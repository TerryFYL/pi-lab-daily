import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Submission {
  name: string;
  lab_size: string;
  contact: string;
  timestamp: string;
}

export default function AdminLeads() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("interest_submissions") || "[]");
    setSubmissions(data.reverse());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-gray-900">
            试用意向（{submissions.length}）
          </h1>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; 返回首页
          </button>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            还没有人提交试用意向
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 px-4 py-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm">{s.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(s.timestamp).toLocaleString("zh-CN")}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  联系方式：{s.contact}
                </div>
                {s.lab_size && (
                  <div className="text-xs text-gray-400 mt-1">
                    实验室规模：{s.lab_size}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
