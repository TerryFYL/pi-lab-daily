import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { DEMO_MODE, DEMO_REPORTS, DEMO_STATUS, getDemoWeekStatus, getDemoWeekReports } from "../lib/demo";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: number;
  student_name: string;
  work_done: string;
  problems: string;
  plan_tomorrow: string;
  created_at: string;
}

interface StatusData {
  date: string;
  total: number;
  submitted_count: number;
  submitted: string[];
  not_submitted: string[];
}

interface DayStatus {
  date: string;
  label: string; // "周一" etc.
  statusData: StatusData | null;
  loading: boolean;
}

type TabId = "dashboard" | "filling-status" | "weekly-summary";
type FilterId = "all" | "not-submitted" | "needs-attention";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayStr(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().split("T")[0];
}

function formatChineseDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+08:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

function formatTime(isoString: string): string {
  // Handle both ISO datetime and plain time strings
  try {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      // Convert to CST (UTC+8)
      const cst = new Date(d.getTime() + 8 * 3600 * 1000);
      const hh = String(cst.getUTCHours()).padStart(2, "0");
      const mm = String(cst.getUTCMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  } catch {
    // fall through
  }
  return isoString;
}

function parseWorkDone(text: string): { tags: string[]; supplement: string } {
  const tagRegex = /\[([^\]]+)\]/g;
  const tags: string[] = [];
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    tags.push(match[1]);
  }
  const supplement = text.replace(/\[([^\]]+)\]/g, "").trim();
  return { tags, supplement };
}

/** Returns the Monday through today for the current week (CST) */
function getWeekDates(todayStr: string): { date: string; label: string }[] {
  const labels = ["周一", "周二", "周三", "周四", "周五"];
  const today = new Date(todayStr + "T00:00:00+08:00");
  // getDay(): 0=Sun, 1=Mon ... 6=Sat
  const dayOfWeek = today.getUTCDay(); // use UTC since we're already at midnight CST
  // JS Sunday=0, so Monday offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + mondayOffset);

  const results: { date: string; label: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    // Only include up to today
    if (dateStr <= todayStr) {
      results.push({ date: dateStr, label: labels[i] });
    } else {
      results.push({ date: dateStr, label: labels[i] });
    }
  }
  return results;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Tag pill
function TagPill({ tag }: { tag: string }) {
  return (
    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
      {tag}
    </span>
  );
}

// Attention item card
function AttentionItem({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-orange-500 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-orange-700 mb-1">
            ⚠ {report.student_name} 报告了问题
          </p>
          <p
            className={`text-sm text-gray-700 ${expanded ? "" : "line-clamp-2"}`}
          >
            {report.problems}
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-blue-600 font-medium whitespace-nowrap flex-shrink-0 mt-0.5"
          aria-expanded={expanded}
          aria-label={`${expanded ? "收起" : "展开"} ${report.student_name} 的问题详情`}
        >
          {expanded ? "收起" : "展开"}
        </button>
      </div>
    </div>
  );
}

// Mobile report card (submitted)
function MobileReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false);
  const { tags, supplement } = parseWorkDone(report.work_done);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900 text-sm">
          {report.student_name}
        </span>
        <span className="text-xs text-gray-400">
          {formatTime(report.created_at)} 提交
        </span>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map((tag, i) => (
            <TagPill key={i} tag={tag} />
          ))}
        </div>
      )}

      {supplement && (
        <p
          className={`text-sm text-gray-600 mb-2 ${expanded ? "" : "line-clamp-1"}`}
        >
          {supplement}
        </p>
      )}

      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-2 text-sm">
          <div>
            <span className="text-gray-500 font-medium">今日工作：</span>
            <span className="text-gray-800">{report.work_done}</span>
          </div>
          {report.problems && (
            <div>
              <span className="text-orange-600 font-medium">遇到问题：</span>
              <span className="text-gray-800">{report.problems}</span>
            </div>
          )}
          {report.plan_tomorrow && (
            <div>
              <span className="text-gray-500 font-medium">明日计划：</span>
              <span className="text-gray-800">{report.plan_tomorrow}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end mt-1">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-blue-600 font-medium"
          aria-expanded={expanded}
          aria-label={`${expanded ? "收起" : "展开"} ${report.student_name} 的详细日报`}
        >
          {expanded ? "收起 ▲" : "展开 ▼"}
        </button>
      </div>
    </div>
  );
}

// Mobile unsubmitted card
function MobileUnsubmittedCard({ name }: { name: string }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-3 flex items-center justify-between">
      <span className="text-sm font-medium text-gray-500">{name}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">未提交</span>
        <button
          onClick={() => alert("提醒功能将在微信集成后启用")}
          className="text-xs text-blue-600 font-medium"
          aria-label={`提醒 ${name} 提交日报`}
        >
          提醒
        </button>
      </div>
    </div>
  );
}

// Desktop table row (submitted)
function DesktopReportRow({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false);
  const { tags, supplement } = parseWorkDone(report.work_done);

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
          {report.student_name}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {tags.length > 0
              ? tags.map((tag, i) => <TagPill key={i} tag={tag} />)
              : <span className="text-gray-300 text-xs">—</span>}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
          <span className="line-clamp-1">{supplement || report.work_done}</span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
          {formatTime(report.created_at)}
        </td>
        <td className="px-4 py-3">
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            已提交
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50">
          <td colSpan={5} className="px-4 py-3">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">今日工作：</span>
                <span className="text-gray-800">{report.work_done}</span>
              </div>
              {report.problems && (
                <div>
                  <span className="font-medium text-orange-600">遇到问题：</span>
                  <span className="text-gray-800">{report.problems}</span>
                </div>
              )}
              {report.plan_tomorrow && (
                <div>
                  <span className="font-medium text-gray-600">明日计划：</span>
                  <span className="text-gray-800">{report.plan_tomorrow}</span>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Desktop table row (unsubmitted)
function DesktopUnsubmittedRow({ name }: { name: string }) {
  return (
    <tr className="bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium text-gray-400 whitespace-nowrap">
        {name}
      </td>
      <td className="px-4 py-3 text-gray-300 text-sm">—</td>
      <td className="px-4 py-3 text-gray-300 text-sm">—</td>
      <td className="px-4 py-3 text-gray-300 text-sm">—</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            未提交
          </span>
          <button
            onClick={() => alert("提醒功能将在微信集成后启用")}
            className="text-xs text-blue-600 font-medium"
            aria-label={`提醒 ${name} 提交日报`}
          >
            提醒
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Today Dashboard Tab ──────────────────────────────────────────────────────

function DashboardTab({
  reports,
  status,
  loading,
}: {
  reports: Report[];
  status: StatusData | null;
  loading: boolean;
}) {
  // Sort submitted reports: newest first
  const sortedReports = [...reports].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const attentionItems = reports.filter((r) => r.problems && r.problems.trim() !== "");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400 text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Layer 1: Overview */}
      {status && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            今日概况
          </p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-blue-600">
              {status.submitted_count}
            </span>
            <span className="text-lg text-gray-400">/ {status.total} 人已提交</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full mb-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width:
                  status.total > 0
                    ? `${(status.submitted_count / status.total) * 100}%`
                    : "0%",
              }}
              role="progressbar"
              aria-valuenow={status.submitted_count}
              aria-valuemin={0}
              aria-valuemax={status.total}
              aria-label={`已提交 ${status.submitted_count} / ${status.total} 人`}
            />
          </div>
          {status.not_submitted.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                未提交：
                <span className="text-red-600 font-medium">
                  {status.not_submitted.join("、")}
                </span>
              </p>
              <button
                onClick={() => alert("提醒功能将在微信集成后启用")}
                className="text-xs text-blue-600 font-medium ml-3 flex-shrink-0"
                aria-label="提醒未提交的同学"
              >
                提醒
              </button>
            </div>
          )}
          {status.not_submitted.length === 0 && (
            <p className="text-sm text-green-600 font-medium">全勤 - 所有人已提交</p>
          )}
        </div>
      )}

      {/* Layer 2: Needs Attention */}
      {attentionItems.length > 0 && (
        <section aria-labelledby="attention-heading">
          <h2
            id="attention-heading"
            className="text-base font-semibold text-gray-800 mb-2"
          >
            需要关注
          </h2>
          <div className="space-y-2">
            {attentionItems.map((r) => (
              <AttentionItem key={r.id} report={r} />
            ))}
          </div>
        </section>
      )}

      {/* Layer 3: Report cards */}
      <section aria-labelledby="reports-heading">
        <h2
          id="reports-heading"
          className="text-base font-semibold text-gray-800 mb-2"
        >
          今日日报
        </h2>

        {sortedReports.length === 0 && (!status || status.submitted_count === 0) ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">今天还没有同学提交日报</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {sortedReports.map((r) => (
                <MobileReportCard key={r.id} report={r} />
              ))}
              {status &&
                status.not_submitted.map((name) => (
                  <MobileUnsubmittedCard key={name} name={name} />
                ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full" aria-label="日报列表">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      姓名
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      标签
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      内容摘要
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      时间
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedReports.map((r) => (
                    <DesktopReportRow key={r.id} report={r} />
                  ))}
                  {status &&
                    status.not_submitted.map((name) => (
                      <DesktopUnsubmittedRow key={name} name={name} />
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ─── Filling Status Tab ───────────────────────────────────────────────────────

function FillingStatusTab({
  todayStr,
  todayReports,
  todayStatus,
}: {
  todayStr: string;
  todayReports: Report[];
  todayStatus: StatusData | null;
}) {
  const weekDates = getWeekDates(todayStr);
  const [weekStatuses, setWeekStatuses] = useState<DayStatus[]>(() =>
    weekDates.map((d) => ({
      date: d.date,
      label: d.label,
      statusData: d.date === todayStr ? todayStatus : null,
      loading: d.date !== todayStr,
    }))
  );
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  // Fetch week statuses
  useEffect(() => {
    const fetchWeek = async () => {
      const datesNeeded = weekDates.filter((d) => d.date !== todayStr);

      if (DEMO_MODE) {
        setWeekStatuses((prev) =>
          prev.map((s) =>
            s.date !== todayStr
              ? { ...s, statusData: getDemoWeekStatus(s.date) as StatusData, loading: false }
              : s
          )
        );
        return;
      }

      await Promise.all(
        datesNeeded.map(async ({ date }) => {
          try {
            const res = await fetch(`/api/reports/status?date=${date}`);
            const data: StatusData = await res.json();
            setWeekStatuses((prev) =>
              prev.map((s) =>
                s.date === date ? { ...s, statusData: data, loading: false } : s
              )
            );
          } catch {
            setWeekStatuses((prev) =>
              prev.map((s) =>
                s.date === date ? { ...s, loading: false } : s
              )
            );
          }
        })
      );
    };

    fetchWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr]);

  // Sync today's status when it arrives
  useEffect(() => {
    setWeekStatuses((prev) =>
      prev.map((s) =>
        s.date === todayStr ? { ...s, statusData: todayStatus, loading: false } : s
      )
    );
  }, [todayStatus, todayStr]);

  // Build student list from today's status
  const allStudents: { name: string; submitted: boolean; time: string | null }[] = [];
  if (todayStatus) {
    for (const name of todayStatus.submitted) {
      const report = todayReports.find((r) => r.student_name === name);
      allStudents.push({
        name,
        submitted: true,
        time: report ? formatTime(report.created_at) : null,
      });
    }
    for (const name of todayStatus.not_submitted) {
      allStudents.push({ name, submitted: false, time: null });
    }
  }

  const needsAttentionNames = new Set(
    todayReports
      .filter((r) => r.problems && r.problems.trim() !== "")
      .map((r) => r.student_name)
  );

  const filteredStudents = allStudents.filter((s) => {
    if (activeFilter === "not-submitted") return !s.submitted;
    if (activeFilter === "needs-attention") return needsAttentionNames.has(s.name);
    return true;
  });

  const notSubmittedCount = allStudents.filter((s) => !s.submitted).length;
  const needsAttentionCount = needsAttentionNames.size;

  const filterTabs: { id: FilterId; label: string; count: number }[] = [
    { id: "all", label: "全部", count: allStudents.length },
    { id: "not-submitted", label: "未提交", count: notSubmittedCount },
    { id: "needs-attention", label: "需关注", count: needsAttentionCount },
  ];

  return (
    <div className="space-y-4">
      {/* Weekly overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          本周提交率
        </p>
        <div className="grid grid-cols-5 gap-2">
          {weekStatuses.map((day) => {
            const isFuture = day.date > todayStr;
            const isToday = day.date === todayStr;
            const allIn =
              day.statusData &&
              day.statusData.submitted_count === day.statusData.total &&
              day.statusData.total > 0;

            return (
              <div
                key={day.date}
                className={`text-center rounded-lg p-2 ${
                  isToday ? "bg-blue-50" : "bg-gray-50"
                }`}
              >
                <p className={`text-xs font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-500"}`}>
                  {day.label}
                </p>
                {isFuture ? (
                  <p className="text-sm text-gray-300">—</p>
                ) : day.loading ? (
                  <p className="text-xs text-gray-300">…</p>
                ) : day.statusData ? (
                  <>
                    <p className="text-sm font-semibold text-gray-800">
                      {day.statusData.submitted_count}/{day.statusData.total}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        allIn ? "text-green-600" : "text-orange-500"
                      }`}
                    >
                      {allIn
                        ? "全勤"
                        : `${day.statusData.total - day.statusData.submitted_count}人缺`}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-300">—</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Student list with filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter tabs */}
        <div className="flex border-b border-gray-100" role="tablist" aria-label="筛选条件">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeFilter === tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeFilter === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${
                  activeFilter === tab.id
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Student rows */}
        <div className="divide-y divide-gray-100" role="tabpanel">
          {filteredStudents.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-400 text-sm">暂无数据</p>
            </div>
          ) : (
            filteredStudents.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-800">{s.name}</span>
                <div className="flex items-center gap-2">
                  {s.submitted ? (
                    <>
                      {s.time && (
                        <span className="text-xs text-gray-400">{s.time}</span>
                      )}
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        已提交
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      未提交
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Remind all button */}
        {notSubmittedCount > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `确认提醒所有 ${notSubmittedCount} 位未提交的同学？`
                  )
                ) {
                  alert("提醒功能将在微信集成后启用");
                }
              }}
              className="w-full bg-blue-100 text-blue-700 text-sm font-medium py-2.5 rounded-lg hover:bg-blue-200 transition-colors"
              aria-label={`提醒所有 ${notSubmittedCount} 位未提交的同学`}
            >
              提醒所有未提交的同学
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

function downloadCSV(filename: string, rows: string[][]) {
  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Weekly Summary Tab ──────────────────────────────────────────────────────

function WeeklySummaryTab({ todayStr }: { todayStr: string }) {
  const weekDates = getWeekDates(todayStr);
  const [weekReports, setWeekReports] = useState<Record<string, Report[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeekReports = async () => {
      setLoading(true);
      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 400));
        const demoData = getDemoWeekReports(weekDates);
        // Cast MockReport[] to Report[] (compatible shapes)
        const typed: Record<string, Report[]> = {};
        for (const [date, reports] of Object.entries(demoData)) {
          typed[date] = reports as unknown as Report[];
        }
        setWeekReports(typed);
        setLoading(false);
        return;
      }

      const results: Record<string, Report[]> = {};
      await Promise.all(
        weekDates.map(async ({ date }) => {
          try {
            const res = await fetch(`/api/reports?date=${date}`);
            const data = await res.json();
            results[date] = data.reports || [];
          } catch {
            results[date] = [];
          }
        })
      );
      setWeekReports(results);
      setLoading(false);
    };

    fetchWeekReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr]);

  // Aggregate all reports for the week
  const allReports = useMemo(
    () => Object.values(weekReports).flat(),
    [weekReports]
  );

  // Per-student summary
  const studentSummaries = useMemo(() => {
    const map = new Map<
      string,
      { reports: Report[]; tags: Set<string>; problemDays: number; totalDays: number }
    >();

    for (const report of allReports) {
      if (!map.has(report.student_name)) {
        map.set(report.student_name, {
          reports: [],
          tags: new Set(),
          problemDays: 0,
          totalDays: 0,
        });
      }
      const entry = map.get(report.student_name)!;
      entry.reports.push(report);
      entry.totalDays++;
      if (report.problems && report.problems.trim()) entry.problemDays++;
      // Extract tags
      const tagRegex = /\[([^\]]+)\]/g;
      let match;
      while ((match = tagRegex.exec(report.work_done)) !== null) {
        entry.tags.add(match[1]);
      }
    }

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalDays - a.totalDays);
  }, [allReports]);

  // Activity tag frequency
  const tagFrequency = useMemo(() => {
    const freq = new Map<string, number>();
    for (const report of allReports) {
      const tagRegex = /\[([^\]]+)\]/g;
      let match;
      while ((match = tagRegex.exec(report.work_done)) !== null) {
        freq.set(match[1], (freq.get(match[1]) || 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1]);
  }, [allReports]);

  // Daily completion stats
  const dailyStats = useMemo(() => {
    return weekDates.map(({ date, label }) => {
      const status = date === todayStr
        ? null // will use live data
        : getDemoWeekStatus(date);
      const reports = weekReports[date] || [];
      return {
        date,
        label,
        submitted: DEMO_MODE && status ? status.submitted_count : reports.length,
        total: DEMO_MODE && status ? status.total : 6,
      };
    });
  }, [weekDates, weekReports, todayStr]);

  const weekTotal = dailyStats.reduce((sum, d) => sum + d.submitted, 0);
  const weekMax = dailyStats.reduce((sum, d) => sum + d.total, 0);
  const weekRate = weekMax > 0 ? Math.round((weekTotal / weekMax) * 100) : 0;

  // Problems this week
  const weekProblems = useMemo(
    () => allReports.filter((r) => r.problems && r.problems.trim()),
    [allReports]
  );

  // Export handler
  const handleExport = () => {
    const header = ["日期", "姓名", "今日工作", "遇到问题", "明日计划", "提交时间"];
    const rows: string[][] = [header];

    for (const { date } of weekDates) {
      const reports = weekReports[date] || [];
      for (const r of reports) {
        rows.push([
          date,
          r.student_name,
          r.work_done,
          r.problems || "",
          r.plan_tomorrow || "",
          r.created_at,
        ]);
      }
    }

    const mondayStr = weekDates[0]?.date || todayStr;
    downloadCSV(`实验室周报_${mondayStr}.csv`, rows);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400 text-sm">加载周报数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            本周总览
          </p>
          <button
            onClick={handleExport}
            className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            aria-label="导出本周数据为CSV"
          >
            导出 CSV
          </button>
        </div>

        {/* Week completion rate */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-blue-600">{weekRate}%</span>
          <span className="text-sm text-gray-400">周提交率</span>
          <span className="text-xs text-gray-300 ml-auto">
            {weekTotal}/{weekMax} 人次
          </span>
        </div>

        {/* Daily bars */}
        <div className="flex gap-1.5 items-end h-16">
          {dailyStats.map((day) => {
            const pct = day.total > 0 ? (day.submitted / day.total) * 100 : 0;
            const isToday = day.date === todayStr;
            const isFull = day.submitted === day.total && day.total > 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gray-100 rounded-sm relative" style={{ height: "48px" }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-sm transition-all duration-500 ${
                      isFull ? "bg-green-500" : isToday ? "bg-blue-600" : "bg-blue-400"
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className={`text-xs ${isToday ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity breakdown */}
      {tagFrequency.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            本周实验类型
          </p>
          <div className="flex flex-wrap gap-2">
            {tagFrequency.map(([tag, count]) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full"
              >
                {tag}
                <span className="bg-blue-200 text-blue-800 text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] text-center">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Problems this week */}
      {weekProblems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">
            本周问题汇总（{weekProblems.length}条）
          </p>
          <div className="space-y-2">
            {weekProblems.map((r) => (
              <div
                key={r.id}
                className="border-l-2 border-orange-400 pl-3 py-1"
              >
                <p className="text-sm text-gray-800">{r.problems}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.student_name} · {weekDates.find((d) => weekReports[d.date]?.some((wr) => wr.id === r.id))?.label || ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-student weekly digest */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-4 pb-2">
          每人周报摘要
        </p>
        <div className="divide-y divide-gray-100">
          {studentSummaries.map(({ name, tags, totalDays, problemDays }) => (
            <StudentWeekCard
              key={name}
              name={name}
              tags={Array.from(tags)}
              totalDays={totalDays}
              problemDays={problemDays}
              weekDates={weekDates}
              weekReports={weekReports}
            />
          ))}
          {studentSummaries.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-400 text-sm">本周暂无日报数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentWeekCard({
  name,
  tags,
  totalDays,
  problemDays,
  weekDates,
  weekReports,
}: {
  name: string;
  tags: string[];
  totalDays: number;
  problemDays: number;
  weekDates: { date: string; label: string }[];
  weekReports: Record<string, Report[]>;
}) {
  const [expanded, setExpanded] = useState(false);

  // Collect this student's reports by day
  const dailyReports = weekDates
    .map(({ date, label }) => {
      const report = (weekReports[date] || []).find((r) => r.student_name === name);
      return { date, label, report };
    })
    .filter((d) => d.report);

  return (
    <div className="px-4 py-3">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{name}</span>
          <span className="text-xs text-gray-400">{totalDays}天提交</span>
          {problemDays > 0 && (
            <span className="text-xs text-orange-500">{problemDays}天有问题</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {weekDates.map(({ date }) => {
              const hasReport = (weekReports[date] || []).some((r) => r.student_name === name);
              return (
                <span
                  key={date}
                  className={`w-2 h-2 rounded-full ${hasReport ? "bg-green-500" : "bg-gray-200"}`}
                />
              );
            })}
          </div>
          <span className="text-xs text-gray-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map((tag) => (
            <span key={tag} className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expanded: daily breakdown */}
      {expanded && (
        <div className="mt-3 space-y-2 pl-2 border-l-2 border-gray-100">
          {dailyReports.map(({ label, report }) =>
            report ? (
              <div key={report.id} className="text-sm">
                <span className="text-xs font-medium text-gray-400 mr-2">{label}</span>
                <span className="text-gray-700">{report.work_done.replace(/\[([^\]]+)\]/g, "").trim() || report.work_done}</span>
                {report.problems && (
                  <p className="text-xs text-orange-500 mt-0.5 ml-8">
                    问题：{report.problems}
                  </p>
                )}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/*
 * Usage:
 *   <PIDashboard />
 *
 * Renders a two-tab dashboard:
 *  - "今日看板": overview + attention + report cards/table
 *  - "填写状态": weekly bar + student list with filters
 */
function PIDashboard() {
  const todayStr = getTodayStr();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 300));
        setReports(DEMO_REPORTS as Report[]);
        setStatus(DEMO_STATUS as StatusData);
        setLoading(false);
        return;
      }
      const [reportsRes, statusRes] = await Promise.all([
        fetch(`/api/reports?date=${todayStr}`),
        fetch(`/api/reports/status?date=${todayStr}`),
      ]);
      const reportsData = await reportsRes.json();
      const statusData = await statusRes.json();
      setReports(reportsData.reports || []);
      setStatus(statusData);
    } catch {
      console.error("加载日报数据失败");
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "dashboard", label: "今日看板" },
    { id: "filling-status", label: "填写状态" },
    { id: "weekly-summary", label: "周报总结" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Demo banner with navigation */}
        {DEMO_MODE && (
          <div className="bg-blue-600 text-white text-xs py-2 px-4 flex items-center justify-between">
            <Link to="/" className="text-white/80 hover:text-white font-medium transition-colors">
              ← 首页
            </Link>
            <span className="text-white/70">演示模式</span>
            <Link
              to="/"
              className="bg-white text-blue-600 px-3 py-1 rounded-full font-semibold hover:bg-blue-50 transition-colors"
            >
              免费试用
            </Link>
          </div>
        )}

        {/* Page header */}
        <header className="bg-white border-b border-gray-100 px-4 pt-6 pb-4 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">实验室日报</h1>
              <p className="text-sm text-gray-500 mt-0.5">{DEMO_MODE ? "XX实验室" : "谭淑平实验室"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {formatChineseDate(todayStr)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">今天</p>
            </div>
          </div>
        </header>

        {/* Tab content */}
        <main className="px-4 py-4 pb-20">
          {activeTab === "dashboard" && (
            <DashboardTab
              reports={reports}
              status={status}
              loading={loading}
            />
          )}
          {activeTab === "filling-status" && (
            <FillingStatusTab
              todayStr={todayStr}
              todayReports={reports}
              todayStatus={status}
            />
          )}
          {activeTab === "weekly-summary" && (
            <WeeklySummaryTab todayStr={todayStr} />
          )}
        </main>

        {/* Bottom tab navigation */}
        <nav
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20"
          aria-label="页面导航"
        >
          <div className="max-w-2xl mx-auto flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-t-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700 border-t-2 border-transparent"
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default PIDashboard;
