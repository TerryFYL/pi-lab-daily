import { Hono } from "hono";
import { cors } from "hono/cors";
import reports from "./routes/reports";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS: 本地开发需要跨域（Vite 5173 -> Worker 8787）
// 生产环境前端和 API 同域，不需要 CORS，但配了也无害
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      // 本地开发
      if (
        origin === "http://localhost:5173" ||
        origin === "http://127.0.0.1:5173"
      )
        return origin;
      // 生产环境同域（origin 为空或匹配 workers.dev）
      return origin ?? "*";
    },
    allowMethods: ["GET", "POST"],
  })
);

// 挂载路由
app.route("/api/reports", reports);

// 健康检查
app.get("/api/health", (c) => {
  return c.json({ status: "ok", service: "pi-lab-daily-api" });
});

export default app;
