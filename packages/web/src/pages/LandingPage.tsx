import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface FormData {
  name: string;
  lab_size: string;
  contact: string;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({ name: "", lab_size: "", contact: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiSent, setApiSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) return;

    setSubmitting(true);

    // Always save to localStorage as backup
    const existing = JSON.parse(localStorage.getItem("interest_submissions") || "[]");
    existing.push({ ...form, timestamp: new Date().toISOString() });
    localStorage.setItem("interest_submissions", JSON.stringify(existing));

    // Try to POST to API if configured
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      try {
        await fetch(`${apiUrl}/api/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, timestamp: new Date().toISOString() }),
        });
        setApiSent(true);
      } catch {
        // API unavailable — localStorage backup exists
      }
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-2xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
            专为医学实验室 PI 设计
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
            2分钟了解
            <br />
            学生每天在干什么
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-md mx-auto mb-8">
            学生每天花1分钟填写日报，您打开就能看到汇总。
            <br />
            谁做了什么、谁遇到了问题、谁还没提交——一目了然。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
            >
              看 PI 看板演示
            </button>
            <button
              onClick={() => navigate("/report")}
              className="flex-1 bg-white text-blue-600 py-3 px-6 rounded-xl text-sm font-semibold border border-blue-200 hover:bg-blue-50 active:bg-blue-100 transition-colors"
            >
              看学生端演示
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-lg font-bold text-gray-900 text-center mb-8">
          怎么用？
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "学生填日报",
              desc: "选标签、写两句话，1分钟完成。手机随时填。",
              color: "bg-blue-100 text-blue-700",
            },
            {
              step: "2",
              title: "系统自动汇总",
              desc: "实时统计提交率，自动标记有问题需要关注的日报。",
              color: "bg-green-100 text-green-700",
            },
            {
              step: "3",
              title: "PI 一眼掌握",
              desc: "打开看板就知道：谁做了什么、谁有困难、谁没交。",
              color: "bg-orange-100 text-orange-700",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div
                className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mx-auto mb-3 text-sm font-bold`}
              >
                {item.step}
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pain point section */}
      <div className="bg-gray-50">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">
            这些情况你熟悉吗？
          </h2>
          <div className="space-y-3 max-w-lg mx-auto">
            {[
              "开会才知道学生实验出了问题，已经浪费了一周试剂",
              "不在实验室的时候，完全不知道学生在干什么",
              "微信群消息太多太碎，找不到关键信息",
              "想了解每个学生的进度，但逐一问太花时间",
            ].map((pain, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-lg px-4 py-3 border border-gray-100"
              >
                <span className="text-orange-500 mt-0.5 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <p className="text-sm text-gray-700">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About / Credibility */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-blue-50 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">为什么做这个？</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            我是一名北京大学医学部博士后，在医学实验室待了十年。我亲眼见过太多
            PI 的困境——开完会才知道学生实验出了问题，出差几天就完全失去对实验室的掌控。
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            现有的工具要么太重（ELN、LIMS），要么太散（微信群、Excel），
            没有一个是专为 PI "快速了解学生动态" 设计的。
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            所以我做了这个极简工具——学生1分钟填，PI 2分钟看。
            不替代你的 ELN，只解决"<span className="font-medium text-gray-800">信息黑洞</span>"问题。
          </p>
        </div>
      </div>

      {/* Data privacy note */}
      <div className="max-w-2xl mx-auto px-6 pb-8">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>数据安全存储，仅 PI 和本实验室成员可见</span>
        </div>
      </div>

      {/* Interest form */}
      <div className="max-w-2xl mx-auto px-6 py-16" id="try">
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">感谢您的兴趣！</h3>
            {apiSent ? (
              <p className="text-sm text-gray-500 mb-6">
                我们已收到您的信息，会尽快联系您配置实验室环境。
              </p>
            ) : (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-4">
                  为了尽快帮您开通，请通过以下方式联系我：
                </p>
                <div className="inline-flex flex-col items-center gap-2 bg-gray-50 rounded-xl px-6 py-4">
                  <span className="text-sm font-medium text-gray-700">微信号：terryfyl</span>
                  <span className="text-xs text-gray-400">添加时请备注"实验室日报"</span>
                </div>
              </div>
            )}
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              先去看看演示 &rarr;
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
              我是 PI，我想试试
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              免费试用，3 分钟帮你配好。留下联系方式，我们来帮你。
            </p>
            <form
              onSubmit={handleSubmit}
              className="max-w-sm mx-auto space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  您的姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如：张教授"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  实验室人数
                </label>
                <select
                  value={form.lab_size}
                  onChange={(e) => setForm({ ...form, lab_size: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none bg-white"
                >
                  <option value="">选择（可选）</option>
                  <option value="1-5">1-5 人</option>
                  <option value="6-10">6-10 人</option>
                  <option value="11-20">11-20 人</option>
                  <option value="20+">20 人以上</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  微信号或手机号 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="方便我们联系您"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !form.name.trim() || !form.contact.trim()}
                className={[
                  "w-full py-3 rounded-xl text-sm font-semibold transition-colors",
                  !submitting && form.name.trim() && form.contact.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed",
                ].join(" ")}
              >
                {submitting ? "提交中..." : "免费试用"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-8 text-center">
          <p className="text-xs text-gray-400">
            PI Lab Daily &mdash; 让实验室管理更轻松
          </p>
        </div>
      </div>
    </div>
  );
}
