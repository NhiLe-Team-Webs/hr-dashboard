// src/components/Analytics.tsx
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { getAnalyticsData, type CandidateAIInsights, type CandidateAttemptStatus } from '@/lib/api';
import Chart from 'chart.js/auto';

// Khai báo một interface để đảm bảo type an toàn
interface CandidateData {
  id: string;
  name: string;
  role: string;
  band: string | null;
  status: CandidateAttemptStatus;
  aiInsights?: CandidateAIInsights;
}

export const Analytics = () => {
  const bandChartRef = useRef<HTMLCanvasElement>(null);
  const roleChartRef = useRef<HTMLCanvasElement>(null);
  const bandChartInstance = useRef<Chart | null>(null);
  const roleChartInstance = useRef<Chart | null>(null);

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

  const awaitingAiCount = statusCounts.awaiting_ai;
  const inProgressCount = statusCounts.in_progress;
  const notStartedCount = statusCounts.not_started;
  const completedCount = statusCounts.completed;

  const overallScores = completedCandidates
    .map((candidate) => candidate.aiInsights?.overallScore)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  const averageScore = overallScores.length > 0
    ? overallScores.reduce((acc, value) => acc + value, 0) / overallScores.length
    : null;

  const recommendedRoleCounts = completedCandidates.reduce<Record<string, number>>((acc, candidate) => {
    candidate.aiInsights?.recommendedRoles?.forEach((roleName) => {
      const key = roleName.trim();
      if (!key) {
        return;
      }
      acc[key] = (acc[key] ?? 0) + 1;
    });
    return acc;
  }, {});

  const topRecommendedRole = Object.entries(recommendedRoleCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  const aPlayers = completedCandidates.filter((candidate) => candidate.band === 'A').length;

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
    if (bandChartInstance.current) {
      bandChartInstance.current.destroy();
    }
    if (roleChartInstance.current) {
      roleChartInstance.current.destroy();
    }

    // Band Chart
    if (bandChartRef.current) {
      const bandCounts = { A: 0, B: 0, C: 0 };
      completedCandidates.forEach(c => {
        if (c.band && Object.prototype.hasOwnProperty.call(bandCounts, c.band)) {
          bandCounts[c.band as keyof typeof bandCounts]++;
        }
      });

      const bandCtx = bandChartRef.current.getContext('2d');
      if (bandCtx) {
        bandChartInstance.current = new Chart(bandCtx, {
          type: 'bar',
          data: {
            labels: ['A Player', 'B Player', 'C Player'],
            datasets: [{
              label: 'Số lượng ứng viên',
              data: Object.values(bandCounts),
              backgroundColor: ['#2563eb', '#f97316', '#ef4444'],
              borderRadius: 8,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }
    }

    // Role Chart
    if (roleChartRef.current) {
      const roleCounts: Record<string, number> = {};
      candidates.forEach((candidate) => {
        const key = candidate.role ?? 'Unassigned';
        roleCounts[key] = (roleCounts[key] ?? 0) + 1;
      });

      const roleCtx = roleChartRef.current.getContext('2d');
      if (roleCtx) {
        roleChartInstance.current = new Chart(roleCtx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(roleCounts),
            datasets: [{
              data: Object.values(roleCounts),
              backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'],
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
      if (bandChartInstance.current) {
        bandChartInstance.current.destroy();
      }
      if (roleChartInstance.current) {
        roleChartInstance.current.destroy();
      }
    };
  }, [completedCandidates, candidates]);

  if (loading) {
    return <div className="text-center p-8">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Lỗi: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="font-bold text-3xl tracking-tight text-foreground">Phân tích & Báo cáo</h1>
      </header>

      <main>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 flex flex-col bg-card border border-border rounded-3xl shadow-lg">
            <h3 className="text-muted-foreground font-medium mb-2">Tổng ứng viên</h3>
            <p className="text-4xl font-bold text-foreground">{totalCandidates}</p>
          </Card>
          <Card className="p-6 flex flex-col bg-card border border-border rounded-3xl shadow-lg">
            <h3 className="text-muted-foreground font-medium mb-2">Tỷ lệ hoàn thành</h3>
            <p className="text-4xl font-bold text-foreground">{completionRate.toFixed(0)}%</p>
          </Card>
          <Card className="p-6 flex flex-col bg-card border border-border rounded-3xl shadow-lg">
            <h3 className="text-muted-foreground font-medium mb-2">Điểm trung bình</h3>
            <p className="text-4xl font-bold text-foreground">{averageScore != null ? averageScore.toFixed(0) : 'N/A'}</p>
          </Card>
          <Card className="p-6 flex flex-col bg-card border border-border rounded-3xl shadow-lg">
            <h3 className="text-muted-foreground font-medium mb-1">Trạng thái đánh giá</h3>
            <p className="text-4xl font-bold text-foreground">{awaitingAiCount}</p>
            <p className="text-sm text-muted-foreground">đang chờ AI chấm</p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <div>
                Chưa bắt đầu:{' '}
                <span className="font-semibold text-foreground">{notStartedCount}</span>
              </div>
              <div>
                Đang làm:{' '}
                <span className="font-semibold text-foreground">{inProgressCount}</span>
              </div>
              <div>
                Hoàn thành:{' '}
                <span className="font-semibold text-foreground">{completedCount}</span>
              </div>
              <div>
                A Player:{' '}
                <span className="font-semibold text-foreground">{aPlayers}</span>
              </div>
              <div className="col-span-2">
                Top gợi ý:{' '}
                <span className="font-semibold text-foreground">{topRecommendedRole ?? 'N/A'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-3 p-6 bg-card border border-border rounded-3xl shadow-lg">
            <h3 className="font-bold text-lg mb-4 text-foreground">Phân bổ theo Xếp loại</h3>
            <div className="h-64">
              <canvas ref={bandChartRef}></canvas>
            </div>
          </Card>
          <Card className="lg:col-span-2 p-6 bg-card border border-border rounded-3xl shadow-lg">
            <h3 className="font-bold text-lg mb-4 text-foreground">Phân bổ theo Vị trí</h3>
            <div className="h-64">
              <canvas ref={roleChartRef}></canvas>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;