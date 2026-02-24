# PI Lab Daily

医学实验室日报系统 -- 让 PI 每天 30 秒了解实验室动态。

## 本地开发

前置条件: Node.js 18+, pnpm 8+

```bash
# 安装依赖
pnpm install

# 初始化本地数据库
cd packages/api
pnpm run db:init

# 回到项目根目录，同时启动前后端
cd ../..
pnpm run dev
```

前端: http://localhost:5173
API:  http://localhost:8787

## 页面

- `/` -- 学生填写日报（移动端）
- `/dashboard` -- PI 查看看板（桌面/移动端）
