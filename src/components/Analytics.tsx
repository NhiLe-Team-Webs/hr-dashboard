import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { mockCandidates } from '@/lib/mockData';
import Chart from 'chart.js/auto';

export const Analytics = () => {
  const bandChartRef = useRef<HTMLCanvasElement>(null);
  const roleChartRef = useRef<HTMLCanvasElement>(null);
  const bandChartInstance = useRef<Chart | null>(null);
  const roleChartInstance = useRef<Chart | null>(null);

  const completedCandidates = mockCandidates.filter(c => c.status === 'completed');
  const totalCandidates = mockCandidates.length;
  const completionRate = totalCandidates > 0 ? (completedCandidates.length / totalCandidates) * 100 : 0;
  
  const totalScore = completedCandidates.reduce((sum, c) => sum + (c.scores?.overall || 0), 0);
  const avgScore = completedCandidates.length > 0 ? totalScore / completedCandidates.length : 0;
  const aPlayers = completedCandidates.filter(c => c.band === 'A').length;

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
        if (c.band && bandCounts.hasOwnProperty(c.band)) {
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
      mockCandidates.forEach(c => {
        roleCounts[c.role] = (roleCounts[c.role] || 0) + 1;
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
  }, [completedCandidates]);

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
            <p className="text-4xl font-bold text-foreground">{avgScore.toFixed(1)}</p>
          </Card>
          <Card className="p-6 flex flex-col bg-card border border-border rounded-3xl shadow-lg">
            <h3 className="text-muted-foreground font-medium mb-2">Ứng viên tiềm năng (A)</h3>
            <p className="text-4xl font-bold text-foreground">{aPlayers}</p>
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