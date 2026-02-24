/**
 * Demo mode: serves realistic mock data when the API is unavailable.
 * Activates automatically on github.io or when VITE_DEMO=true.
 */

import { getStudents } from "./students";

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

// Default students for demo data generation (hardcoded content references these names)
const DEMO_DEFAULT_STUDENTS = ["陈思远", "刘雨桐", "张明阳", "王子涵", "李晓萱", "赵天宇"];

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

/** Compute demo status dynamically from current student roster. */
export function getDemoStatus(): MockStatus {
  const students = getStudents();
  const submittedNames = DEMO_REPORTS.map((r) => r.student_name).filter((n) => students.includes(n));
  const notSubmitted = students.filter((n) => !submittedNames.includes(n));
  return {
    date: todayStr(),
    total: students.length,
    submitted_count: submittedNames.length,
    submitted: submittedNames,
    not_submitted: notSubmitted,
  };
}

/** @deprecated Use getStudents() from ./students instead */
export function getDemoStudentNames(): string[] {
  return getStudents();
}

// Generate a week of statuses for the filling-status tab
// Use seeded random for consistent results per date
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function dateToSeed(date: string): number {
  return date.split("-").reduce((acc, v) => acc * 31 + parseInt(v, 10), 0);
}

export function getDemoWeekStatus(date: string): MockStatus {
  const students = getStudents();
  const d = new Date(date + "T00:00:00+08:00");
  const dow = d.getUTCDay(); // 0=Sun
  const isWeekend = dow === 0 || dow === 6;

  if (isWeekend) {
    return { date, total: students.length, submitted_count: 0, submitted: [], not_submitted: [...students] };
  }

  // Only students with demo data can appear as "submitted"
  const withData = students.filter((n) => n in WEEKLY_WORK_POOL);
  const withoutData = students.filter((n) => !(n in WEEKLY_WORK_POOL));

  const seed = dateToSeed(date);
  const shuffled = [...withData].sort((a, b) =>
    seededRandom(seed + a.charCodeAt(0)) - seededRandom(seed + b.charCodeAt(0))
  );
  const count = Math.min(4 + Math.floor(seededRandom(seed + 7) * 3), withData.length);
  const submitted = shuffled.slice(0, count);
  const notSubmitted = [...shuffled.slice(count), ...withoutData];

  return {
    date,
    total: students.length,
    submitted_count: count,
    submitted,
    not_submitted: notSubmitted,
  };
}

// ---------------------------------------------------------------------------
// Weekly mock reports — realistic lab work for each day of the week
// ---------------------------------------------------------------------------

const WEEKLY_WORK_POOL: Record<string, { work: string; problems: string; plan: string }[]> = {
  "陈思远": [
    { work: "[Western Blot] [数据分析] p-STAT3的WB三次重复，条带清晰一致", problems: "二抗孵育时间偏长，背景稍高", plan: "跑ELISA验证细胞因子水平" },
    { work: "[ELISA] [数据分析] IL-6和TNF-α的ELISA检测，处理组显著升高", problems: "", plan: "补充Western验证信号通路" },
    { work: "[Western Blot] 补做p-JAK2的WB，验证JAK-STAT通路激活", problems: "一抗效价可能不够，条带偏弱", plan: "调整一抗浓度重跑" },
    { work: "[数据分析] [写论文] 整理所有WB和ELISA数据，做统计图", problems: "", plan: "写Results部分初稿" },
    { work: "[写论文] [文献阅读] 写Results的JAK-STAT通路部分，读了2篇相关综述", problems: "图片排版需要调整", plan: "下周继续写Discussion" },
  ],
  "刘雨桐": [
    { work: "[细胞培养] [PCR] 传代HEK293T第18代，做IL-6引物的RT-qPCR", problems: "", plan: "细胞转染实验" },
    { work: "[细胞培养] 用lipofectamine 3000转染HEK293T，设了3个浓度梯度", problems: "转染效率偏低，可能需要优化DNA:脂质体比例", plan: "检测转染效率，GFP荧光观察" },
    { work: "[数据分析] 荧光显微镜观察GFP表达，拍照记录，计算转染效率", problems: "", plan: "提取RNA做qPCR验证过表达" },
    { work: "[PCR] [数据分析] RT-qPCR检测过表达效率，目标基因上调约8倍", problems: "", plan: "开始功能实验" },
    { work: "[细胞培养] [样本处理] 功能实验：CCK-8细胞增殖检测，铺了96孔板", problems: "边缘效应明显，边孔数据波动大", plan: "读板并分析数据" },
  ],
  "张明阳": [
    { work: "[文献阅读] [写论文] 读了3篇巨噬细胞极化综述，整理Discussion框架", problems: "Discussion第二段M1/M2转化论证不顺", plan: "继续修改Discussion" },
    { work: "[写论文] 重写Discussion第二段，补充了2个关键参考文献", problems: "", plan: "写完Discussion初稿" },
    { work: "[写论文] Discussion初稿完成，开始写Introduction", problems: "Introduction开头切入点不确定", plan: "和老师讨论后修改" },
    { work: "[文献阅读] 根据老师建议重新梳理Introduction逻辑，读了5篇最新文献", problems: "", plan: "重写Introduction" },
    { work: "[写论文] 重写Introduction，从临床问题切入，逻辑更清晰了", problems: "", plan: "下周整合全文做第一轮修改" },
  ],
  "王子涵": [
    { work: "[动物实验] [样本处理] 小鼠给药第7天，取血清和肝脏组织，-80℃冻存", problems: "", plan: "组织切片H&E染色" },
    { work: "[样本处理] 肝脏组织切片，H&E染色，显微镜下观察拍照", problems: "部分切片染色不均匀", plan: "补做染色，开始免疫组化" },
    { work: "[样本处理] 补做H&E染色，同时开始Ki-67免疫组化实验", problems: "", plan: "继续免疫组化，等待一抗孵育过夜" },
    { work: "[样本处理] [数据分析] 免疫组化显色成功，拍照并开始计数阳性细胞", problems: "阳性细胞计数标准需要统一", plan: "用ImageJ做半定量分析" },
    { work: "[数据分析] ImageJ分析免疫组化图片，完成所有样本的定量统计", problems: "", plan: "整理数据做统计图" },
  ],
  "李晓萱": [
    { work: "[试剂配制] [细胞培养] 配制新的培养基和PBS，传代MDA-MB-231", problems: "", plan: "药物处理实验" },
    { work: "[细胞培养] 药物浓度梯度处理MDA-MB-231，设了6个浓度+对照", problems: "高浓度组细胞状态不好，可能药物毒性太强", plan: "观察24h后细胞状态" },
    { work: "[细胞培养] [数据分析] 拍照记录各浓度组细胞形态，CCK-8测活力", problems: "", plan: "分析IC50" },
    { work: "[数据分析] 计算IC50，绘制剂量-反应曲线", problems: "数据拟合R²偏低", plan: "补充中间浓度点重做" },
    { work: "[组会/汇报] 准备组会PPT，汇报药物敏感性实验进展", problems: "", plan: "根据组会反馈调整实验方案" },
  ],
  "赵天宇": [
    { work: "[仪器调试] [PCR] 调试新到的实时荧光定量PCR仪，跑标准曲线", problems: "标准曲线R²只有0.95，需要重新稀释标准品", plan: "重做标准曲线" },
    { work: "[PCR] [试剂配制] 重新配制标准品梯度稀释液，跑标准曲线R²=0.998", problems: "", plan: "正式样品检测" },
    { work: "[PCR] [样本处理] 提取12个样本的RNA，逆转录后上机跑qPCR", problems: "2个样本RNA浓度偏低", plan: "补提RNA，完成剩余样本检测" },
    { work: "[PCR] [数据分析] 补做2个样本，所有qPCR数据汇总分析", problems: "", plan: "整理数据写实验记录" },
    { work: "[数据分析] [文献阅读] 整理qPCR实验记录，查阅文献解读异常数据点", problems: "有一个样本Ct值异常，需要排查原因", plan: "和老师讨论异常数据处理方案" },
  ],
};

export function getDemoWeekReports(weekDates: { date: string; label: string }[]): Record<string, MockReport[]> {
  const result: Record<string, MockReport[]> = {};
  let idCounter = 100;

  for (const { date } of weekDates) {
    const d = new Date(date + "T00:00:00+08:00");
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) {
      result[date] = [];
      continue;
    }

    const dayIndex = dow - 1; // Mon=0, Tue=1, ...
    const status = getDemoWeekStatus(date);
    const reports: MockReport[] = [];

    for (const name of status.submitted) {
      const pool = WEEKLY_WORK_POOL[name];
      if (!pool) continue;
      const entry = pool[dayIndex % pool.length];
      reports.push({
        id: idCounter++,
        student_name: name,
        work_done: entry.work,
        problems: entry.problems,
        plan_tomorrow: entry.plan,
        created_at: `${date}T${14 + Math.floor(seededRandom(dateToSeed(date) + name.charCodeAt(0)) * 6)}:${String(Math.floor(seededRandom(dateToSeed(date) + name.charCodeAt(1) + 1) * 60)).padStart(2, "0")}:00+08:00`,
      });
    }

    result[date] = reports;
  }

  return result;
}
