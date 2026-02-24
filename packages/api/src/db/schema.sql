CREATE TABLE IF NOT EXISTS daily_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL,
  work_done TEXT NOT NULL,
  problems TEXT DEFAULT '',
  plan_tomorrow TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now', '+8 hours')),
  report_date TEXT DEFAULT (date('now', '+8 hours'))
);

CREATE INDEX IF NOT EXISTS idx_report_date ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_student_date ON daily_reports(student_name, report_date);
