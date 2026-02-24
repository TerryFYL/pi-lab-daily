#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# PI Lab Daily — 一键部署到 Cloudflare Workers
# 幂等：重复运行不会出错
# ============================================================

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$PROJECT_ROOT/packages/api"
PROD_TOML="$API_DIR/wrangler.production.toml"
DB_NAME="pi-lab-daily-db"
SCHEMA_FILE="$API_DIR/src/db/schema.sql"
SEED_FILE="$API_DIR/src/db/seed.sql"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ---- 前置检查 ----

info "检查前置条件..."

command -v pnpm >/dev/null 2>&1 || error "pnpm 未安装。运行: npm install -g pnpm"
command -v wrangler >/dev/null 2>&1 || error "wrangler 未安装。运行: pnpm add -g wrangler"

# 检查 wrangler 是否已登录
if ! wrangler whoami 2>/dev/null | grep -q "Account ID"; then
  error "wrangler 未登录。运行: wrangler login"
fi

info "wrangler 已登录 ✓"

# ---- 1. 构建前端 ----

info "构建前端..."
cd "$PROJECT_ROOT"
pnpm build:web
info "前端构建完成 ✓"

# ---- 2. 获取/创建 D1 数据库 ----

info "检查 D1 数据库 $DB_NAME..."

# 尝试获取已有数据库的 ID
DB_ID=$(wrangler d1 list --json 2>/dev/null | grep -o "\"uuid\":\"[^\"]*\"" | head -1 | sed 's/"uuid":"//;s/"//g' || true)

# 更精确地匹配数据库名
DB_ID=$(wrangler d1 list --json 2>/dev/null \
  | python3 -c "
import sys, json
dbs = json.load(sys.stdin)
for db in dbs:
    if db.get('name') == '$DB_NAME':
        print(db['uuid'])
        break
" 2>/dev/null || true)

if [ -z "$DB_ID" ]; then
  info "创建 D1 数据库 $DB_NAME..."
  CREATE_OUTPUT=$(wrangler d1 create "$DB_NAME" 2>&1)
  DB_ID=$(echo "$CREATE_OUTPUT" | grep -o 'database_id = "[^"]*"' | sed 's/database_id = "//;s/"//g')
  if [ -z "$DB_ID" ]; then
    echo "$CREATE_OUTPUT"
    error "无法获取新创建的数据库 ID"
  fi
  info "D1 数据库已创建: $DB_ID"
else
  info "D1 数据库已存在: $DB_ID"
fi

# ---- 3. 生成生产 wrangler 配置 ----

info "写入 database_id 到生产配置..."

# 用 sed 替换占位符（写入临时文件避免污染 git 跟踪的模板）
DEPLOY_TOML="$API_DIR/wrangler.deploy.toml"
sed "s/__D1_DATABASE_ID__/$DB_ID/g" "$PROD_TOML" > "$DEPLOY_TOML"

info "生产配置已生成 ✓"

# ---- 4. 初始化数据库 schema ----

info "执行 schema.sql（CREATE IF NOT EXISTS，幂等）..."
wrangler d1 execute "$DB_NAME" --remote --file="$SCHEMA_FILE" --config="$DEPLOY_TOML"
info "Schema 初始化完成 ✓"

# ---- 5. 填充 demo 数据（可选） ----

# 检查是否已有数据，避免重复 seed
ROW_COUNT=$(wrangler d1 execute "$DB_NAME" --remote --command "SELECT COUNT(*) as cnt FROM daily_reports;" --json --config="$DEPLOY_TOML" 2>/dev/null \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print(r[0]['results'][0]['cnt'])" 2>/dev/null || echo "0")

if [ "$ROW_COUNT" = "0" ]; then
  info "数据库为空，填充 demo 数据..."
  wrangler d1 execute "$DB_NAME" --remote --file="$SEED_FILE" --config="$DEPLOY_TOML"
  info "Demo 数据已填充 ✓"
else
  info "数据库已有 $ROW_COUNT 条记录，跳过 seed"
fi

# ---- 6. 部署 Worker ----

info "部署 Worker..."
cd "$API_DIR"
DEPLOY_OUTPUT=$(wrangler deploy --config="$DEPLOY_TOML" 2>&1)
echo "$DEPLOY_OUTPUT"

# 提取部署 URL
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*\.workers\.dev' | head -1 || true)

# ---- 7. 清理临时文件 ----

rm -f "$DEPLOY_TOML"

# ---- 完成 ----

echo ""
echo "============================================"
info "部署完成！"
if [ -n "$DEPLOY_URL" ]; then
  info "访问地址: $DEPLOY_URL"
  info "API 健康检查: $DEPLOY_URL/api/health"
fi
echo "============================================"
