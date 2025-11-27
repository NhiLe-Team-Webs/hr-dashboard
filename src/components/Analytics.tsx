// src/components/Analytics.tsx
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { getAnalyticsData, type CandidateAIInsights, type CandidateAttemptStatus } from '@/lib/api';
import Chart from 'chart.js/auto';
import { Users, TrendingUp, Award, Target, Briefcase, CheckCircle2 } from 'lucide-react';

interface CandidateData {
  id: string;
  name: string;
  role: string;
  band: string | null;
  status: CandidateAttemptStatus;
  aiInsights?: CandidateAIInsights;
}

export const Analytics = () => {
  const skillChartRef = useRef<HTMLCanvasElement>(null);
  const roleChartRef = useRef<HTMLCanvasElement>(null);
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const skillChartInstance = useRef<Chart | null>(null);
  const roleChartInstance = useRef<Chart | null>(null);
  const statusChartInstance = useRef<Chart | null>(null);

  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const completedCandidates = candidates.filter((candidate) => candidate.status === 'completed');
  const totalCandidates = candidates.length;
  const completionRate = totalCandidates > 0 ? (completedCandidates.length / totalCandidates) * 100 : 0;

  const statusCounts = candidates.reduce<Record<CandidateAttemptStatus, number>>(
    (acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] ?? 0) + 1;
      return acc;
    },
    {
      not_started: 0,
      in_progress: 0,
      awaiting_ai: 0,
      completed: 0,
    },
  );

  // Aggregate skill scores across all completed candidates
  const skillScoreAggregates: Record<string, { total: number; count: number }> = {};
  completedCandidates.forEach((candidate) => {
    candidate.aiInsights?.skillScores?.forEach((skill) => {
      if (!skillScoreAggregates[skill.name]) {
        skillScoreAggregates[skill.name] = { total: 0, count: 0 };
      }
      skillScoreAggregates[skill.name].total += skill.score;
      skillScoreAggregates[skill.name].count += 1;
    });
  });

  const averageSkillScores = Object.entries(skillScoreAggregates)
    .map(([name, { total, count }]) => ({
      name,
      average: total / count,
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 6); // Top 6 skills

  // Aggregate strengths
  const strengthCounts: Record<string, number> = {};
  completedCandidates.forEach((candidate) => {
    candidate.aiInsights?.strengths?.forEach((strength) => {
      strengthCounts[strength] = (strengthCounts[strength] ?? 0) + 1;
    });
  });
  const topStrengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Aggregate recommended roles
  const recommendedRoleCounts: Record<string, number> = {};
  completedCandidates.forEach((candidate) => {
    candidate.aiInsights?.recommendedRoles?.forEach((role) => {
      recommendedRoleCounts[role] = (recommendedRoleCounts[role] ?? 0) + 1;
    });
  });
  const topRecommendedRoles = Object.entries(recommendedRoleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAnalyticsData();
        setCandidates(data as CandidateData[]);
      } catch (err) {
        setError("Không thể tải dữ liệu phân tích.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Cleanup existing charts
    if (skillChartInstance.current) {
      skillChartInstance.current.destroy();
    }
    if (roleChartInstance.current) {
      roleChartInstance.current.destroy();
    }
    if (statusChartInstance.current) {
      statusChartInstance.current.destroy();
    }

    // Skill Scores Chart
    if (skillChartRef.current && averageSkillScores.length > 0) {
      const ctx = skillChartRef.current.getContext('2d');
      if (ctx) {
        skillChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: averageSkillScores.map(s => s.name),
            datasets: [{
              label: 'Điểm trung bình',
              data: averageSkillScores.map(s => s.average),
              backgroundColor: '#10b981',
              borderRadius: 8,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { 
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: (value) => `${value}%`
                }
              }
            }
          }
        });
      }
    }

    // Role Distribution Chart
    if (roleChartRef.current) {
      const roleCounts: Record<string, number> = {};
      candidates.forEach((candidate) => {
        const key = candidate.role ?? 'Chưa xác định';
        roleCounts[key] = (roleCounts[key] ?? 0) + 1;
      });

      const ctx = roleChartRef.current.getContext('2d');
      if (ctx) {
        roleChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(roleCounts),
            datasets: [{
              data: Object.values(roleCounts),
              backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    }

    // Status Chart
    if (statusChartRef.current) {
      const ctx = statusChartRef.current.getContext('2d');
      if (ctx) {
        statusChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Hoàn thành', 'Đang làm', 'Chờ AI', 'Chưa bắt đầu'],
            datasets: [{
              data: [
                statusCounts.completed,
                statusCounts.in_progress,
                statusCounts.awaiting_ai,
                statusCounts.not_started
              ],
              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#94a3b8'],
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    }

    return () => {
      if (skillChartInstance.current) {
        skillChartInstance.current.destroy();
      }
      if (roleChartInstance.current) {
        roleChartInstance.current.destroy();
      }
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }
    };
  }, [candidates, completedCandidates, averageSkillScores, statusCounts]);

  if (loading) {
    return <div className="text-center p-8">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Lỗi: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="font-bold text-3xl tracking-tight text-foreground">Phân tích & Báo cáo</h1>
      </header>

      <main>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-blue-700 dark:text-blue-300 font-medium">Tổng ứng viên</h3>
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{totalCandidates}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-emerald-700 dark:text-emerald-300 font-medium">Tỷ lệ hoàn thành</h3>
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-4xl font-bold text-emerald-900 dark:text-emerald-100">{completionRate.toFixed(0)}%</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{statusCounts.completed}/{totalCandidates} ứng viên</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-purple-700 dark:text-purple-300 font-medium">Đang chờ xử lý</h3>
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">{statusCounts.awaiting_ai + statusCounts.in_progress}</p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
              {statusCounts.in_progress} đang làm, {statusCounts.awaiting_ai} chờ AI
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-amber-700 dark:text-amber-300 font-medium">Chưa bắt đầu</h3>
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-4xl font-bold text-amber-900 dark:text-amber-100">{statusCounts.not_started}</p>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6 bg-card border border-border rounded-3xl shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-lg text-foreground">Kỹ năng trung bình</h3>
            </div>
            <div className="h-80">
              {averageSkillScores.length > 0 ? (
                <canvas ref={skillChartRef}></canvas>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Chưa có dữ liệu kỹ năng
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-card border border-border rounded-3xl shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-lg text-foreground">Phân bổ theo vị trí</h3>
            </div>
            <div className="h-80">
              <canvas ref={roleChartRef}></canvas>
            </div>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-card border border-border rounded-3xl shadow-lg">
            <h3 className="font-bold text-lg mb-4 text-foreground">Trạng thái đánh giá</h3>
            <div className="h-64">
              <canvas ref={statusChartRef}></canvas>
            </div>
          </Card>

          <Card className="p-6 bg-card border border-border rounded-3xl shadow-lg">
            <h3 className="font-bold text-lg mb-4 text-foreground">Điểm mạnh phổ biến</h3>
            <div className="space-y-3">
              {topStrengths.length > 0 ? (
                topStrengths.map(([strength, count]) => (
                  <div key={strength} className="flex items-center justify-between">
                    <span className="text-sm text-foreground flex-1">{strength}</span>
                    <span className="text-sm font-semibold text-emerald-600 ml-2">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-card border border-border rounded-3xl shadow-lg">
            <h3 className="font-bold text-lg mb-4 text-foreground">Vai trò được gợi ý</h3>
            <div className="space-y-3">
              {topRecommendedRoles.length > 0 ? (
                topRecommendedRoles.map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm text-foreground flex-1">{role}</span>
                    <span className="text-sm font-semibold text-blue-600 ml-2">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
