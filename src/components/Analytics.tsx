import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { getAnalyticsData, type CandidateAIInsights, type CandidateAttemptStatus } from '@/lib/api';
import Chart from 'chart.js/auto';
import { Users, TrendingUp, Award, Target, Briefcase, CheckCircle2 } from 'lucide-react';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';

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
    const skillScores = candidate.aiInsights?.skillScores;
    if (skillScores) {
      Object.entries(skillScores).forEach(([skillName, score]) => {
        if (score != null) {
          if (!skillScoreAggregates[skillName]) {
            skillScoreAggregates[skillName] = { total: 0, count: 0 };
          }
          skillScoreAggregates[skillName].total += score;
          skillScoreAggregates[skillName].count += 1;
        }
      });
    }
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
    /*
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
    */

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
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel p-6 rounded-[2rem] space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 glass-panel p-6 rounded-[2rem]">
            <div className="mb-6">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
          <div className="col-span-3 glass-panel p-6 rounded-[2rem]">
            <div className="mb-6">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Lỗi: {error}</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Phân tích & Báo cáo</h1>
          <p className="text-muted-foreground mt-1">Tổng quan hiệu suất và thông tin chi tiết</p>
        </div>
      </header>

      <main>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 glass-panel border border-white/40 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-blue-700 dark:text-blue-300 font-medium">Tổng ứng viên</h3>
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{totalCandidates}</p>
            </div>
          </Card>

          <Card className="p-6 glass-panel border border-white/40 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-emerald-700 dark:text-emerald-300 font-medium">Tỷ lệ hoàn thành</h3>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-4xl font-bold text-emerald-900 dark:text-emerald-100">{completionRate.toFixed(0)}%</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{statusCounts.completed}/{totalCandidates} ứng viên</p>
            </div>
          </Card>

          <Card className="p-6 glass-panel border border-white/40 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-purple-700 dark:text-purple-300 font-medium">Đang chờ xử lý</h3>
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">{statusCounts.awaiting_ai + statusCounts.in_progress}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                {statusCounts.in_progress} đang làm, {statusCounts.awaiting_ai} chờ AI
              </p>
            </div>
          </Card>

          <Card className="p-6 glass-panel border border-white/40 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-amber-700 dark:text-amber-300 font-medium">Chưa bắt đầu</h3>
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-4xl font-bold text-amber-900 dark:text-amber-100">{statusCounts.not_started}</p>
            </div>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6 glass-panel border border-white/40 rounded-[2rem] shadow-lg">
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

          {/* Phần "Phân bổ theo vị trí" tạm thời comment lại */}
          {/* <Card className="p-6 glass-panel border border-white/40 rounded-[2rem] shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-lg text-foreground">Phân bổ theo vị trí</h3>
            </div>
            <div className="h-80">
              <canvas ref={roleChartRef}></canvas>
            </div>
          </Card> */}

          <Card className="p-6 glass-panel border border-white/40 rounded-[2rem] shadow-lg">
            <h3 className="font-bold text-lg mb-4 text-foreground">Trạng thái đánh giá</h3>
            <div className="h-80">
              <canvas ref={statusChartRef}></canvas>
            </div>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <Card className="p-6 glass-panel border border-white/40 rounded-[2rem] shadow-lg">
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

          <Card className="p-6 glass-panel border border-white/40 rounded-[2rem] shadow-lg">
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
