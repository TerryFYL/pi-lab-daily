/**
 * StudentReport.tsx
 *
 * Usage:
 *   <StudentReport />
 *
 * Design goals:
 *   - Fill time under 90 seconds
 *   - Zero learning cost, warm casual tone
 *   - Quick-select activity tags + optional collapsible fields
 *   - localStorage draft persistence per student per day
 *   - Submission success overlay
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { DEMO_MODE } from "../lib/demo";
import { getStudents } from "../lib/students";

const ACTIVITY_TAGS = [
  "细胞培养",
  "PCR",
  "Western Blot",
  "数据分析",
  "文献阅读",
  "写论文",
  "动物实验",
  "样本处理",
  "组会/汇报",
  "仪器调试",
  "试剂配制",
  "其他",
];

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateChinese(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAY_NAMES[date.getDay()];
  return `${month}月${day}日 周${weekday}`;
}

function formatTimeChinese(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month}月${day}日 ${hh}:${mm}`;
}

function buildWorkDone(tags: string[], supplement: string): string {
  const tagStr = tags.map((t) => `[${t}]`).join(" ");
  if (tagStr && supplement.trim()) return `${tagStr} ${supplement.trim()}`;
  if (tagStr) return tagStr;
  return supplement.trim();
}

function draftKey(name: string, dateStr: string): string {
  return `draft_${name}_${dateStr}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Draft {
  selectedTags: string[];
  supplement: string;
  problems: string;
  planTomorrow: string;
}

interface SubmissionStatus {
  submitted: boolean;
  submittedAt?: string; // ISO string
}

interface SuccessOverlayProps {
  submittedAt: string;
  onViewSubmission: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
        flexShrink: 0,
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CollapsibleField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="px-4 pb-4">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none"
            style={{ lineHeight: 1.6 }}
          />
        </div>
      )}
    </div>
  );
}

function SuccessOverlay({ submittedAt, onViewSubmission, onClose }: SuccessOverlayProps) {
  const [buttonsVisible, setButtonsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setButtonsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="提交成功"
    >
      <div className="text-center px-8">
        {/* Success checkmark */}
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <p className="text-3xl font-bold text-gray-800 mb-3">已提交</p>
        <p className="text-base text-gray-500 mb-2">{formatTimeChinese(submittedAt)}</p>
        <p className="text-lg text-gray-600 mb-10">今天辛苦了</p>

        {buttonsVisible && (
          <div
            className="flex flex-col gap-3 w-full max-w-xs mx-auto"
            style={{ animation: "fadeIn 0.3s ease" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-base font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              关闭
            </button>
            <button
              type="button"
              onClick={onViewSubmission}
              className="w-full border border-gray-300 text-gray-600 py-3 rounded-lg text-base font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              查看我的提交
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StudentReport() {
  const dateStr = getTodayStr();
  const students = getStudents();

  // --- Persistent student selection ---
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem("last_student") ?? "";
  });

  // --- Activity tags ---
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [supplement, setSupplement] = useState("");
  const supplementRef = useRef<HTMLTextAreaElement>(null);

  // --- Optional fields ---
  const [problems, setProblems] = useState("");
  const [planTomorrow, setPlanTomorrow] = useState("");

  // --- Submission state ---
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmissionStatus>({ submitted: false });
  const [statusLoading, setStatusLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlaySubmittedAt, setOverlaySubmittedAt] = useState("");

  // ---------------------------------------------------------------------------
  // Load status from API when student is selected
  // ---------------------------------------------------------------------------
  const loadStatus = useCallback(async (name: string) => {
    if (!name) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/reports/status?date=${dateStr}&student_name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setStatus({ submitted: false });
      }
    } catch {
      setStatus({ submitted: false });
    } finally {
      setStatusLoading(false);
    }
  }, [dateStr]);

  // ---------------------------------------------------------------------------
  // Restore draft from localStorage when student changes
  // ---------------------------------------------------------------------------
  const restoreDraft = useCallback((name: string) => {
    if (!name) return;
    const raw = localStorage.getItem(draftKey(name, dateStr));
    if (!raw) return;
    try {
      const draft: Draft = JSON.parse(raw);
      setSelectedTags(draft.selectedTags ?? []);
      setSupplement(draft.supplement ?? "");
      setProblems(draft.problems ?? "");
      setPlanTomorrow(draft.planTomorrow ?? "");
    } catch {
      // malformed draft — ignore
    }
  }, [dateStr]);

  useEffect(() => {
    if (studentName) {
      restoreDraft(studentName);
      loadStatus(studentName);
    }
  }, [studentName, restoreDraft, loadStatus]);

  // ---------------------------------------------------------------------------
  // Persist student name
  // ---------------------------------------------------------------------------
  const handleStudentChange = (name: string) => {
    // Reset form fields when switching student
    setSelectedTags([]);
    setSupplement("");
    setProblems("");
    setPlanTomorrow("");
    setError(null);
    setStatus({ submitted: false });

    setStudentName(name);
    if (name) {
      localStorage.setItem("last_student", name);
    }
  };

  // ---------------------------------------------------------------------------
  // Save draft on every change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!studentName) return;
    const draft: Draft = { selectedTags, supplement, problems, planTomorrow };
    localStorage.setItem(draftKey(studentName, dateStr), JSON.stringify(draft));
  }, [studentName, dateStr, selectedTags, supplement, problems, planTomorrow]);

  // ---------------------------------------------------------------------------
  // Tag toggle
  // ---------------------------------------------------------------------------
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      // If "其他" was just selected, focus supplement textarea
      if (tag === "其他" && !prev.includes("其他")) {
        setTimeout(() => supplementRef.current?.focus(), 50);
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Submit logic
  // ---------------------------------------------------------------------------
  const canSubmit =
    studentName.length > 0 &&
    (selectedTags.length > 0 || supplement.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    const workDone = buildWorkDone(selectedTags, supplement);

    try {
      if (DEMO_MODE) {
        // Demo mode: simulate successful submission
        await new Promise((r) => setTimeout(r, 600));
        localStorage.removeItem(draftKey(studentName, dateStr));
        const now = new Date().toISOString();
        setStatus({ submitted: true, submittedAt: now });
        setOverlaySubmittedAt(now);
        setShowOverlay(true);
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName,
          work_done: workDone,
          problems,
          plan_tomorrow: planTomorrow,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Clear draft after successful submission
        localStorage.removeItem(draftKey(studentName, dateStr));

        const now = new Date().toISOString();
        setStatus({ submitted: true, submittedAt: now });
        setOverlaySubmittedAt(now);
        setShowOverlay(true);
      } else {
        setError(data.error ?? "提交失败，请重试");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Overlay handlers
  // ---------------------------------------------------------------------------
  const handleViewSubmission = () => {
    setShowOverlay(false);
    // The form already shows the submitted data (tags/supplement/etc. are still in state)
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
  };

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const todayLabel = formatDateChinese();
  const lastSubmittedLabel = status.submittedAt
    ? formatTimeChinese(status.submittedAt)
    : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {showOverlay && (
        <SuccessOverlay
          submittedAt={overlaySubmittedAt}
          onViewSubmission={handleViewSubmission}
          onClose={handleCloseOverlay}
        />
      )}

      <div className="min-h-screen bg-gray-50">
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
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

          {/* ------------------------------------------------------------------ */}
          {/* Header info bar                                                     */}
          {/* ------------------------------------------------------------------ */}
          <div className="bg-white rounded-lg px-4 py-3 flex items-center justify-between border border-gray-100">
            <div className="flex items-center gap-3">
              {/* Date */}
              <span className="text-sm font-medium text-gray-700">{todayLabel}</span>

              {/* Student name dropdown — compact inline style */}
              <div className="relative">
                <select
                  value={studentName}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="appearance-none bg-gray-100 rounded-md pl-3 pr-7 py-1 text-sm text-gray-700 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="选择你的名字"
                >
                  <option value="">选择姓名</option>
                  {students.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {/* Custom chevron for select */}
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  ▾
                </span>
              </div>
            </div>

            {/* Submission status badge */}
            <div className="flex items-center">
              {statusLoading ? (
                <span className="text-xs text-gray-400">检查中...</span>
              ) : status.submitted ? (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  已提交
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                  未提交
                </span>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Page title                                                          */}
          {/* ------------------------------------------------------------------ */}
          <div className="px-1">
            <h1 className="text-lg font-semibold text-gray-800 leading-snug">
              今天做了什么？
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              选标签或随手写几句，1 分钟搞定
            </p>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Work done: quick-select tags + supplement                           */}
          {/* ------------------------------------------------------------------ */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-lg px-4 pt-4 pb-4 border border-gray-100">
              {/* Tags */}
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="今日活动标签（可多选）"
              >
                {ACTIVITY_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      aria-pressed={active}
                      className={[
                        "px-3 py-2 rounded-full text-sm transition-colors select-none",
                        "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1",
                        active
                          ? "bg-blue-600 text-white"
                          : "border border-blue-300 text-blue-600 hover:bg-blue-50",
                      ].join(" ")}
                      style={{ minHeight: "36px" }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Supplement textarea */}
              <textarea
                ref={supplementRef}
                value={supplement}
                onChange={(e) => setSupplement(e.target.value)}
                rows={2}
                placeholder="可以补充几句细节，也可以不写"
                className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none"
                style={{ lineHeight: 1.6 }}
                aria-label="补充描述"
              />
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Collapsible: 遇到什么问题                                       */}
            {/* -------------------------------------------------------------- */}
            <CollapsibleField
              label="遇到什么问题"
              placeholder="实验没成功？数据有疑问？都可以写在这里"
              value={problems}
              onChange={setProblems}
            />

            {/* -------------------------------------------------------------- */}
            {/* Collapsible: 明天计划                                           */}
            {/* -------------------------------------------------------------- */}
            <CollapsibleField
              label="明天计划"
              placeholder="明天打算做什么？不确定也可以写个大概"
              value={planTomorrow}
              onChange={setPlanTomorrow}
            />

            {/* -------------------------------------------------------------- */}
            {/* Error message                                                   */}
            {/* -------------------------------------------------------------- */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* -------------------------------------------------------------- */}
            {/* Submit button                                                   */}
            {/* -------------------------------------------------------------- */}
            <div>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={[
                  "bg-blue-600 text-white py-3 rounded-lg w-full text-base font-medium transition-colors",
                  canSubmit && !submitting
                    ? "hover:bg-blue-700 active:bg-blue-800"
                    : "opacity-40 cursor-not-allowed",
                ].join(" ")}
                aria-busy={submitting}
              >
                {submitting
                  ? "提交中..."
                  : status.submitted
                  ? "更新"
                  : "提交"}
              </button>

              {/* Hint when disabled */}
              {!canSubmit && (
                <p className="mt-2 text-center text-xs text-gray-400">
                  选一个标签或写几个字就能提交
                </p>
              )}
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Last submission info                                            */}
            {/* -------------------------------------------------------------- */}
            {lastSubmittedLabel && (
              <p className="text-center text-xs text-gray-400 pb-2">
                上次提交：{lastSubmittedLabel}
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
