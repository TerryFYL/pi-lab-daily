import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
};

const reports = new Hono<{ Bindings: Bindings }>();

// 硬编码学生名单 -- 谭老师实验室，后续从访谈获取真实名单
const STUDENTS = [
  "张三",
  "李四",
  "王五",
  "赵六",
  "孙七",
  "周八",
];

// 获取学生名单
reports.get("/students", (c) => {
  return c.json({ students: STUDENTS });
});

// 提交日报
reports.post("/", async (c) => {
  const body = await c.req.json<{
    student_name: string;
    work_done: string;
    problems?: string;
    plan_tomorrow?: string;
  }>();

  if (!body.student_name || !body.work_done) {
    return c.json({ error: "student_name 和 work_done 为必填项" }, 400);
  }

  if (!STUDENTS.includes(body.student_name)) {
    return c.json({ error: "学生不在名单中" }, 400);
  }

  // 检查今天是否已提交
  const today = new Date(Date.now() + 8 * 3600 * 1000)
    .toISOString()
    .split("T")[0];

  const existing = await c.env.DB.prepare(
    "SELECT id FROM daily_reports WHERE student_name = ? AND report_date = ?"
  )
    .bind(body.student_name, today)
    .first();

  if (existing) {
    // 已提交则更新
    await c.env.DB.prepare(
      `UPDATE daily_reports
       SET work_done = ?, problems = ?, plan_tomorrow = ?, created_at = datetime('now', '+8 hours')
       WHERE student_name = ? AND report_date = ?`
    )
      .bind(
        body.work_done,
        body.problems || "",
        body.plan_tomorrow || "",
        body.student_name,
        today
      )
      .run();

    return c.json({ message: "日报已更新" });
  }

  await c.env.DB.prepare(
    `INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow)
     VALUES (?, ?, ?, ?)`
  )
    .bind(
      body.student_name,
      body.work_done,
      body.problems || "",
      body.plan_tomorrow || ""
    )
    .run();

  return c.json({ message: "日报提交成功" }, 201);
});

// 按日期查所有日报（PI看板）
reports.get("/", async (c) => {
  const date =
    c.req.query("date") ||
    new Date(Date.now() + 8 * 3600 * 1000).toISOString().split("T")[0];

  const result = await c.env.DB.prepare(
    "SELECT * FROM daily_reports WHERE report_date = ? ORDER BY created_at DESC"
  )
    .bind(date)
    .all();

  return c.json({
    date,
    reports: result.results,
  });
});

// 查填写状态
// - 不传 student_name: 返回全部学生概况（PI看板用）
// - 传 student_name: 返回该学生个人状态（学生端用）
reports.get("/status", async (c) => {
  const date =
    c.req.query("date") ||
    new Date(Date.now() + 8 * 3600 * 1000).toISOString().split("T")[0];

  const studentName = c.req.query("student_name");

  // 个人状态查询
  if (studentName) {
    const row = await c.env.DB.prepare(
      "SELECT created_at FROM daily_reports WHERE student_name = ? AND report_date = ?"
    )
      .bind(studentName, date)
      .first<{ created_at: string }>();

    return c.json({
      submitted: !!row,
      submittedAt: row?.created_at ?? null,
    });
  }

  // 全部学生概况
  const result = await c.env.DB.prepare(
    "SELECT student_name FROM daily_reports WHERE report_date = ?"
  )
    .bind(date)
    .all();

  const submitted = result.results.map(
    (r) => r.student_name as string
  );
  const notSubmitted = STUDENTS.filter((s) => !submitted.includes(s));

  return c.json({
    date,
    total: STUDENTS.length,
    submitted_count: submitted.length,
    submitted,
    not_submitted: notSubmitted,
  });
});

export default reports;
