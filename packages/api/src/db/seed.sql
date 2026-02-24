-- Demo seed data: 模拟谭老师实验室一周的日报数据
-- 本周一 2026-02-23 (Mon) 和今天 2026-02-24 (Tue)
-- 上周 2026-02-20 (Fri), 2026-02-19 (Thu)

-- ========== 上周四 2/19 (5/6 提交) ==========

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('张三', '[细胞培养] [Western Blot] 传代HeLa细胞，跑了一版WB', '', '继续WB优化条件', '2026-02-19 17:20:00', '2026-02-19');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('李四', '[PCR] [数据分析] 跑了3组qPCR，整理数据做了统计', '', '准备组会PPT', '2026-02-19 18:05:00', '2026-02-19');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('王五', '[文献阅读] [写论文] 读了5篇关于CRISPR筛选的文献，写了综述初稿引言部分', '', '继续写方法部分', '2026-02-19 19:30:00', '2026-02-19');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('赵六', '[动物实验] [样本处理] 小鼠取材，处理了12个肝脏样本', '', '提RNA做qPCR', '2026-02-19 17:45:00', '2026-02-19');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('孙七', '[仪器调试] [试剂配制] 流式细胞仪校准，配了新批次的裂解液', '', '跑流式分选', '2026-02-19 16:50:00', '2026-02-19');

-- 周八未提交

-- ========== 上周五 2/20 (4/6 提交) ==========

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('张三', '[Western Blot] 重新跑WB，优化了一抗浓度', '条带还是不太清晰，怀疑二抗有问题', '换新批次二抗试试', '2026-02-20 18:15:00', '2026-02-20');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('李四', '[组会/汇报] [数据分析] 组会汇报了qPCR结果，整理了反馈意见', '', '按老师建议补做对照组', '2026-02-20 17:30:00', '2026-02-20');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('赵六', '[PCR] [数据分析] 提了RNA，测了浓度和纯度，A260/280都在1.9以上', '', '下周跑qPCR', '2026-02-20 18:40:00', '2026-02-20');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('孙七', '[其他] 整理实验记录本，更新了试剂库存表', '', '周末休息', '2026-02-20 16:20:00', '2026-02-20');

-- 王五、周八未提交

-- ========== 本周一 2/23 (5/6 提交) ==========

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('张三', '[细胞培养] [Western Blot] 换了新批次二抗，重新跑WB', '', '等曝光结果', '2026-02-23 17:50:00', '2026-02-23');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('李四', '[PCR] 补做了对照组的qPCR实验', '引物可能有问题，阴性对照出现了微弱条带', '重新设计引物', '2026-02-23 18:20:00', '2026-02-23');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('王五', '[写论文] 完成了综述方法部分，开始写结果', '', '画Figure 1的示意图', '2026-02-23 19:10:00', '2026-02-23');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('赵六', '[PCR] [数据分析] qPCR跑完了，做了统计分析', '', '整理数据准备汇报', '2026-02-23 17:35:00', '2026-02-23');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('周八', '[文献阅读] [数据分析] 读了导师推荐的综述，对比了自己的数据', '', '明天和导师讨论结果', '2026-02-23 20:00:00', '2026-02-23');

-- 孙七未提交

-- ========== 今天 2/24 周二 (4/6 提交，其中1人报告问题) ==========

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('张三', '[Western Blot] [数据分析] WB结果出来了！条带很清晰，量化分析中', '', '整理数据准备投稿', '2026-02-24 16:30:00', '2026-02-24');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('李四', '[PCR] [试剂配制] 重新设计了引物，配了新的PCR体系', '新引物到货要等2天，实验进度会延迟', '先做其他实验的数据整理', '2026-02-24 17:15:00', '2026-02-24');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('王五', '[写论文] [数据分析] 画了Figure 1示意图，用BioRender做的', '', '继续写结果和讨论', '2026-02-24 18:00:00', '2026-02-24');

INSERT INTO daily_reports (student_name, work_done, problems, plan_tomorrow, created_at, report_date)
VALUES ('赵六', '[组会/汇报] [数据分析] 组会汇报了qPCR数据，老师提了几个修改意见', '', '按意见补实验', '2026-02-24 17:45:00', '2026-02-24');

-- 孙七、周八今天未提交
