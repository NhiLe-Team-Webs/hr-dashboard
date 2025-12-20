import { useEffect, useMemo, useState } from 'react';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Calendar,
  UserCheck,
  Mail,
  AlertCircle,
  Target,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CandidateDetail } from '@/components/CandidateDetail';
import { getCandidates, type CandidateSummary, type CandidateAttemptSummary, type CandidateAttemptStatus } from '@/lib/api';
import { EMPTY_VALUE, parseStructuredSummary } from '@/lib/ai/structuredSummary';
import { getBandColor, getScoreColor } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusConfig: Record<CandidateAttemptStatus | 'not_started', { label: string; className: string }> = {
  not_started: { label: 'Chưa bắt đầu', className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' },
  in_progress: { label: 'Đang làm', className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  awaiting_ai: { label: 'Chờ chấm', className: 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200' },
  completed: { label: 'Hoàn thành', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' },
};

const getStatusBadge = (status: CandidateAttemptStatus | 'not_started') => {
  const config = statusConfig[status] ?? statusConfig.not_started;
  return (
    <Badge className={`${config.className} font-medium pointer-events-none`}>
      {config.label}
    </Badge>
  );
};

const formatDate = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN', options ?? { dateStyle: 'short', timeStyle: 'short' });
  } catch (error) {
    console.error('Failed to format date:', error);
    return '—';
  }
};

const formatProgressLabel = (attempt?: CandidateAttemptSummary) => {
  if (!attempt) return '0/0 câu';
  return `${attempt.answeredCount}/${attempt.totalQuestions} câu`;
};

const roundProgress = (attempt?: CandidateAttemptSummary) =>
  attempt ? Math.round(attempt.progressPercent) : 0;

const formatDurationLabel = (seconds?: number | null) => {
  if (seconds == null || seconds <= 0) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} giờ`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} phút`);
  }
  if (parts.length === 0 && secs > 0) {
    parts.push(`${secs} giây`);
  } else if (hours === 0 && minutes > 0 && secs > 0) {
    parts.push(`${secs} giây`);
  }

  return parts.join(' ');
};

export const CandidateList = () => {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const data = await getCandidates();
        setCandidates(data);
      } catch (err) {
        setError('Không thể tải danh sách ứng viên.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    candidates.forEach((candidate) => {
      if (candidate.recommendedTeam?.name) {
        teams.add(candidate.recommendedTeam.name);
      }
    });
    return Array.from(teams).sort();
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return candidates.filter((candidate) => {
      // Apply search filter
      const name = candidate.fullName ?? '';
      const email = candidate.email ?? '';
      const role = candidate.role ?? '';
      const matchesSearch = !query || (
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        role.toLowerCase().includes(query)
      );

      // Apply team filter
      const matchesTeam = selectedTeam === 'all' ||
        (selectedTeam === 'unassigned' && !candidate.recommendedTeam) ||
        candidate.recommendedTeam?.name === selectedTeam;

      return matchesSearch && matchesTeam;
    });
  }, [candidates, searchTerm, selectedTeam]);

  const selectedCandidate = candidates.find((c) => c.authId === selectedCandidateId) ?? null;
  const isDetailDialogOpen = isDetailOpen && Boolean(selectedCandidate);

  const handleCandidateClick = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        {/* Card Skeletons */}
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-panel border-white/60 p-6 rounded-[1.5rem]">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Danh sách Ứng viên</h1>
          <p className="text-muted-foreground mt-1">Quản lý và đánh giá hồ sơ ứng viên</p>
        </div>
        <Button
          className="gap-2 rounded-xl shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 border-0"
          onClick={() => {
            toast({
              title: 'Chức năng đang phát triển',
              description: 'Tính năng mời ứng viên qua email sẽ sớm được ra mắt.',
            });
          }}
        >
          <Plus className="w-4 h-4" />
          Mời ứng viên
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 glass-panel border border-white/60 rounded-[1.5rem] shadow-lg">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Tìm kiếm ứng viên theo tên, email hoặc vị trí..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 h-12 rounded-xl bg-white/50 border-white/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="h-12 rounded-xl bg-white/50 border-white/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium">
                <SelectValue placeholder="Lọc theo team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả team</SelectItem>
                <SelectItem value="unassigned">Chưa phân team</SelectItem>
                {uniqueTeams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {filteredCandidates.length > 0 ? (
        <div className="space-y-4">
          {filteredCandidates.map((candidate) => {
            const attempt = candidate.attempt;
            const attemptStatus = attempt?.status ?? 'not_started';
            const overallScore = candidate.aiInsights?.overallScore ?? null;
            const recommendedRole = candidate.aiInsights?.recommendedRoles?.[0] ?? null;
            const { sections: summarySections, plainText: summaryPlainText } = parseStructuredSummary(
              candidate.aiInsights?.summary ?? null,
            );
            const summaryPreviewSections = summarySections
              .filter((section) => {
                const hasDescription = section.description && section.description !== EMPTY_VALUE;
                const hasBullets = section.bullets && section.bullets.some((item) => item && item !== EMPTY_VALUE);
                const hasContent = section.content && section.content.some((entry) => entry.value && entry.value !== EMPTY_VALUE);
                return hasDescription || hasBullets || hasContent;
              })
              .slice(0, 2);
            const progressPercent = roundProgress(attempt);
            const progressLabel = formatProgressLabel(attempt);
            const startedAt = attempt?.startedAt ? formatDate(attempt.startedAt, { dateStyle: 'short' }) : null;
            const analysisCompletedAt = candidate.aiInsights?.analysisCompletedAt
              ? formatDate(candidate.aiInsights.analysisCompletedAt, { dateStyle: 'short', timeStyle: 'short' })
              : null;
            const durationLabel = formatDurationLabel(attempt?.durationSeconds);
            const aiStatusLabel = attempt?.aiStatus ?? (attemptStatus === 'awaiting_ai' ? 'Chờ đánh giá AI' : null);
            const cheatingCount = attempt?.cheatingCount ?? 0;
            const hasCheatingAlerts = cheatingCount > 0;
            const assessmentTitle = attempt?.assessmentTitle ?? null;
            const assessmentRole = attempt?.assessmentRole ?? null;
            const strengths = candidate.aiInsights?.strengths ?? [];
            const developmentAreas = candidate.aiInsights?.weaknesses ?? [];
            const topStrengths = strengths.slice(0, 2);
            const topDevelopment = developmentAreas.slice(0, 2);

            return (
              <Card
                key={candidate.id}
                className={`overflow-hidden cursor-pointer transition-all duration-300 glass-panel border border-white/60 rounded-[1.5rem] relative group ${selectedCandidateId === candidate.authId
                  ? 'ring-2 ring-primary/50 shadow-xl scale-[1.01] bg-white/80'
                  : 'hover:shadow-2xl hover:bg-white/90 hover:-translate-y-1'
                  }`}
                onClick={() => handleCandidateClick(candidate.authId)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="p-6 space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-1 items-start gap-4">
                      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-xl shadow-lg">
                        {candidate.avatarChar}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-lg text-foreground truncate">
                            {candidate.fullName ?? 'Chưa cập nhật'}
                          </h3>
                          {candidate.role && (
                            <Badge variant="outline" className="font-medium">
                              {candidate.role}
                            </Badge>
                          )}
                          {candidate.attemptCount != null && candidate.attemptCount > 1 && (
                            <Badge variant="secondary" className="font-medium">
                              {candidate.attemptCount} lần đánh giá
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 min-w-0">
                            <Mail className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                            <button
                              onClick={async (event) => {
                                event.stopPropagation();
                                if (candidate.email) {
                                  try {
                                    await navigator.clipboard.writeText(candidate.email);
                                    toast({
                                      title: 'Đã copy email',
                                      description: `Email ${candidate.email} đã được sao chép`,
                                    });
                                  } catch (err) {
                                    console.log('Failed to copy email:', err);
                                  }
                                }
                              }}
                              className="text-sm truncate hover:text-primary hover:underline transition-colors cursor-pointer"
                            >
                              {candidate.email ?? '—'}
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {assessmentRole && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {assessmentRole}
                              </Badge>
                            )}
                            {candidate.aiInsights?.teamFit && Array.isArray(candidate.aiInsights.teamFit) && candidate.aiInsights.teamFit.length > 0 && (
                              <>
                                {candidate.aiInsights.teamFit.slice(0, 2).map((team) => (
                                  <Badge key={team} variant="secondary" className="flex items-center gap-1">
                                    <UserCheck className="w-3 h-3" />
                                    {team}
                                  </Badge>
                                ))}
                                {candidate.aiInsights.teamFit.length > 2 && (
                                  <Badge variant="secondary">
                                    +{candidate.aiInsights.teamFit.length - 2} team
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <div className="inline-flex flex-col items-center justify-center">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/10">
                          <span className={`text-2xl font-bold ${overallScore != null ? getScoreColor(overallScore) : 'text-primary'}`}>
                            {overallScore != null ? Math.round(overallScore) : `${progressPercent}%`}
                          </span>
                        </div>
                        <span className="mt-2 text-xs text-muted-foreground">
                          {overallScore != null ? 'Điểm tổng' : `${progressLabel} (${progressPercent}%)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {candidate.band && overallScore != null && (
                          <Badge className={`${getBandColor(candidate.band)} font-bold pointer-events-none`}>
                            {candidate.band}
                          </Badge>
                        )}
                        {getStatusBadge(attemptStatus)}
                      </div>
                      {analysisCompletedAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Chấm AI: {analysisCompletedAt}
                        </div>
                      )}
                    </div>
                  </div>

                  {topStrengths.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {topStrengths.map((item) => (
                        <Badge key={item} variant="secondary" className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Không tìm thấy ứng viên</p>
        </Card>
      )}

      <Dialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setSelectedCandidateId(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          {selectedCandidate && <CandidateDetail candidateId={selectedCandidate.authId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateList;
