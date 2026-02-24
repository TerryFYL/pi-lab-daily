/**
 * Demo mode: serves realistic mock data when the API is unavailable.
 * Activates automatically on github.io or when VITE_DEMO=true.
 */

const hostname = typeof window !== "undefined" ? window.location.hostname : "";

export const DEMO_MODE =
  hostname.includes("github.io") ||
  hostname.includes("pages.dev") ||
  import.meta.env.VITE_DEMO === "true";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

// ---------------------------------------------------------------------------
// Mock data — realistic medical lab daily reports
// ---------------------------------------------------------------------------

const STUDENTS = ["陈思远", "刘雨桐", "张明阳", "王子涵", "李晓萱", "赵天宇"];

export interface MockReport {
  id: number;
  student_name: string;
  work_done: string;
  problems: string;
  plan_tomorrow: string;
  created_at: string;
}

export interface MockStatus {
  date: string;
  total: number;
  submitted_count: number;
  submitted: string[];
  not_submitted: string[];
}

export const DEMO_REPORTS: MockReport[] = [
  {
    id: 1,
    student_name: "陈思远",
    work_done: "[Western Blot] [数据分析] 完成了p-STAT3的WB，三次重复均一致，条带清晰",
    problems: "二抗孵育时间可能偏长，背景稍高，下次减少到45min试试",
    plan_tomorrow: "跑ELISA验证细胞因子水平",
    created_at: hoursAgo(3),
  },
  {
    id: 2,
    student_name: "刘雨桐",
    work_done: "[细胞培养] [PCR] 传代HEK293T第18代，同时做了IL-6引物的RT-qPCR",
    problems: "",
    plan_tomorrow: "细胞转染实验，用lipofectamine 3000",
    created_at: hoursAgo(4),
  },
  {
    id: 3,
    student_name: "张明阳",
    work_done: "[文献阅读] [写论文] 读了3篇关于肿瘤微环境中巨噬细胞极化的综述，整理了Discussion部分的逻辑框架",
    problems: "Discussion第二段关于M1/M2转化的论证逻辑不太顺，需要老师指导一下",
    plan_tomorrow: "继续修改Discussion，争取写完初稿",
    created_at: hoursAgo(2),
  },
  {
    id: 4,
    student_name: "王子涵",
    work_done: "[动物实验] [样本处理] 小鼠给药第7天，取血清和肝脏组织，已-80冻存",
    problems: "",
    plan_tomorrow: "组织切片H&E染色",
    created_at: hoursAgo(5),
  },
];

const SUBMITTED_NAMES = DEMO_REPORTS.map((r) => r.student_name);
const NOT_SUBMITTED = STUDENTS.filter((n) => !SUBMITTED_NAMES.includes(n));

export const DEMO_STATUS: MockStatus = {
  date: todayStr(),
  total: STUDENTS.length,
  submitted_count: SUBMITTED_NAMES.length,
  submitted: SUBMITTED_NAMES,
  not_submitted: NOT_SUBMITTED,
};

export const DEMO_STUDENT_NAMES = STUDENTS;

// Generate a week of statuses for the filling-status tab
export function getDemoWeekStatus(date: string): MockStatus {
  const d = new Date(date + "T00:00:00+08:00");
  const dow = d.getUTCDay(); // 0=Sun
  const isWeekend = dow === 0 || dow === 6;

  if (isWeekend) {
    return { date, total: 6, submitted_count: 0, submitted: [], not_submitted: STUDENTS };
  }

  // Simulate different completion rates for past days
  const shuffled = [...STUDENTS].sort(() => Math.random() - 0.5);
  const count = Math.min(4 + Math.floor(Math.random() * 3), 6); // 4-6 students
  const submitted = shuffled.slice(0, count);
  const notSubmitted = shuffled.slice(count);

  return {
    date,
    total: 6,
    submitted_count: count,
    submitted,
    not_submitted: notSubmitted,
  };
}
