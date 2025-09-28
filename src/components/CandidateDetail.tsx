import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Mail,
  User,
  Trophy,
  Target,
  Users,
  Briefcase,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Clock,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getScoreColor, getBandColor } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { getCandidateDetails, type CandidateDetailSummary, type CandidateAttemptSummary, type CandidateAttemptStatus } from '@/lib/api';

const statusConfig: Record<CandidateAttemptStatus | 'not_started', { label: string; className: string }> = {
  not_started: { label: 'Chưa bắt đầu', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_progress: { label: 'Đang làm', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  awaiting_ai: { label: 'Chờ chấm', className: 'bg-sky-100 text-sky-700 border-sky-200' },
  completed: { label: 'Hoàn thành', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const getStatusBadge = (status: CandidateAttemptSummary['status'] | 'not_started') => {
  const config = statusConfig[status] ?? statusConfig.not_started;
  return <Badge className={`${config.className} font-medium pointer-events-none`}>{config.label}</Badge>;
};

const formatDate = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString('vi-VN', options ?? { dateStyle: 'short', timeStyle: 'short' });
  } catch (error) {
    console.error('Failed to format date:', error);
    return '—';
  }
};

const skillIcons = {
  'Work Sample': <Briefcase className="w-4 h-4" />,
  'Problem Solving': <Target className="w-4 h-4" />,
  'Reliability': <Trophy className="w-4 h-4" />,
  'Culture Fit': <Users className="w-4 h-4" />,
};

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

const shortenId = (value: string | null | undefined) => {
  if (!value) {
    return '—';
  }
  return value.length > 10 ? `${value.slice(0, 10)}…` : value;
};

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits }).format(value);

const formatDetailValue = (value: unknown): string => {
  if (value == null) {
    return '—';
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatNumber(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Có' : 'Không';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatDetailValue(item))
      .filter((item) => item && item !== '—');
    return items.length > 0 ? items.join(', ') : '—';
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => `${key}: ${formatDetailValue(nested)}`)
      .filter((entry) => entry && !entry.endsWith(': —'));
    return entries.length > 0 ? entries.join('; ') : '—';
  }

  return String(value);
};

const toDisplayEntries = (input?: Record<string, unknown> | null) => {
  if (!input) {
    return [] as Array<{ key: string; value: string }>;
  }

  return Object.entries(input).map(([key, value]) => ({
    key,
    value: formatDetailValue(value),
  }));
};

const normalisePercentage = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, percent));
};

interface CandidateDetailProps {
  candidateId: string;
}

export const CandidateDetail = ({ candidateId }: CandidateDetailProps) => {
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<CandidateDetailSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const data = await getCandidateDetails(candidateId);
        setCandidate(data);
      } catch (err) {
        setError('Không thể tải thông tin ứng viên.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  const attempt = candidate?.attempt;
  const attemptStatus = attempt?.status ?? 'not_started';
  const aiInsights = candidate?.aiInsights;
  const overallScore = aiInsights?.overallScore ?? null;
  const strengths = aiInsights?.strengths ?? [];
  const weaknesses = aiInsights?.weaknesses ?? [];
  const recommendedRoles = aiInsights?.recommendedRoles ?? [];
  const developmentSuggestions = aiInsights?.developmentSuggestions ?? [];
  const analysisCompletedAt = aiInsights?.analysisCompletedAt ? formatDate(aiInsights.analysisCompletedAt) : null;
  const insightLocale = aiInsights?.insightLocale ?? null;
  const insightVersion = aiInsights?.insightVersion ?? null;
  const attemptHistory = candidate?.attempts ?? (attempt ? [attempt] : []);
  const previousAttempts = attemptHistory.slice(1);
  const cheatingEvents = attempt?.cheatingEvents ?? [];
  const cheatingCount = attempt?.cheatingCount ?? 0;

  const skillEntries = useMemo(() => {
    const record = aiInsights?.skillScores;
    if (!record) {
      return [] as Array<[string, number]>;
    }

    const entries: Array<[string, number]> = [];
    Object.entries(record).forEach(([skill, rawValue]) => {
      if (rawValue == null) {
        return;
      }
      const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
      if (Number.isFinite(numericValue)) {
        entries.push([skill, numericValue]);
      }
    });

    return entries.sort((a, b) => b[1] - a[1]);
  }, [aiInsights?.skillScores]);

  const questionTimingEntries = useMemo(() => {
    const timings = attempt?.questionTimings;
    if (!timings) {
      return [] as Array<[string, number]>;
    }

    return Object.entries(timings)
      .map(([questionId, rawValue]) => {
        const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        if (!Number.isFinite(value)) {
          return null;
        }
        return [questionId, value] as [string, number];
      })
      .filter((entry): entry is [string, number] => Boolean(entry))
      .sort((a, b) => b[1] - a[1]);
  }, [attempt?.questionTimings]);

  const roleFitEntries = useMemo(() => {
    const record = aiInsights?.roleFit;
    if (!record) {
      return [] as Array<[string, number]>;
    }

    return Object.entries(record)
      .map(([roleName, rawValue]) => {
        if (rawValue == null) {
          return null;
        }
        const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        if (!Number.isFinite(numericValue)) {
          return null;
        }
        return [roleName, normalisePercentage(numericValue)] as [string, number];
      })
      .filter((entry): entry is [string, number] => Boolean(entry))
      .sort((a, b) => b[1] - a[1]);
  }, [aiInsights?.roleFit]);

  const timeAnalysisEntries = useMemo(
    () => toDisplayEntries(aiInsights?.timeAnalysis ?? null).filter((entry) => entry.value && entry.value !== '—'),
    [aiInsights?.timeAnalysis],
  );

  const cheatingSummaryEntries = useMemo(
    () => toDisplayEntries(aiInsights?.cheatingSummary ?? null).filter((entry) => entry.value && entry.value !== '—'),
    [aiInsights?.cheatingSummary],
  );

  const personalityTraitEntries = useMemo(
    () => toDisplayEntries(aiInsights?.personalityTraits ?? null).filter((entry) => entry.value && entry.value !== '—'),
    [aiInsights?.personalityTraits],
  );

  const formatSkillLabel = (skill: string) =>
    skill
      .split(/[\s_]+/)
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(' ');

  if (loading) {
    return <div className="text-center p-8">Đang tải thông tin ứng viên...</div>;
  }

  if (error || !candidate) {
    return <div className="text-center p-8 text-red-500">Lỗi: {error || 'Không tìm thấy ứng viên.'}</div>;
  }

  const handleEmailClick = () => {
    if (candidate.email) {
      window.open(`https://mail.google.com/mail/u/0/#inbox?compose=new&to=${encodeURIComponent(candidate.email)}`, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center border-b">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4 shadow-lg">
          {candidate.avatarChar}
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">{candidate.fullName ?? 'Chưa cập nhật'}</h2>
        {candidate.role && (
          <Badge variant="outline" className="font-medium">
            {candidate.role}
          </Badge>
        )}
      </div>

      <div className="p-6 space-y-6">
        {overallScore != null && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full border-4 border-primary/20 mb-3">
              <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {Math.round(overallScore)}
              </span>
            </div>
            {candidate.band && (
              <div>
                <Badge className={`font-bold text-sm px-3 py-1 ${getBandColor(candidate.band)} pointer-events-none`}>
                  Xếp loại {candidate.band}
                </Badge>
              </div>
            )}
            {analysisCompletedAt && (
              <p className="text-xs text-muted-foreground mt-2">Phân tích lúc: {analysisCompletedAt}</p>
            )}
          </div>
        )}

        {attempt ? (
          <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Briefcase className="w-4 h-4 text-primary" />
                Thông tin bài đánh giá
              </div>
              {getStatusBadge(attemptStatus)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Vị trí mục tiêu:
                <span className="text-foreground font-medium">
                  {attempt.assessmentRole ?? '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Bài đánh giá:
                <span className="text-foreground font-medium">
                  {attempt.assessmentTitle ?? '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Bắt đầu:
                <span className="text-foreground font-medium">{formatDate(attempt.startedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Hoàn thành:
                <span className="text-foreground font-medium">{formatDate(attempt.completedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Thời lượng:
                <span className="text-foreground font-medium">
                  {formatDurationLabel(attempt.durationSeconds) ?? '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                TB / câu:
                <span className="text-foreground font-medium">
                  {formatDurationLabel(attempt.averageSecondsPerQuestion) ?? '—'}
                </span>
              </div>
            </div>
            <div>
              <Progress value={Math.min(100, Math.round(attempt.progressPercent))} className="h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                Đã trả lời {attempt.answeredCount}/{attempt.totalQuestions} câu ({Math.round(attempt.progressPercent)}%)
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="pointer-events-none">
                Tổng câu hỏi: {attempt.totalQuestions}
              </Badge>
              {attempt.aiStatus && (
                <Badge variant="outline" className="pointer-events-none border-sky-200 bg-sky-50 text-sky-700">
                  AI: {attempt.aiStatus}
                </Badge>
              )}
              {attempt.lastAiError && (
                <Badge variant="outline" className="pointer-events-none border-amber-200 bg-amber-50 text-amber-700">
                  Lỗi AI: {attempt.lastAiError}
                </Badge>
              )}
            </div>
            {questionTimingEntries.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Top câu mất thời gian</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {questionTimingEntries.slice(0, 5).map(([questionId, value]) => (
                    <div key={questionId} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-foreground font-medium">{shortenId(questionId)}</span>
                      <span>{formatDurationLabel(value) ?? `${Math.round(value)} giây`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 text-sm text-muted-foreground">
            Ứng viên chưa bắt đầu bài đánh giá nào.
          </div>
        )}

        {aiInsights && (
          <>
            {(aiInsights.summary || recommendedRoles.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {aiInsights.summary && (
                  <div className="bg-muted/30 border border-border/60 rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Tổng quan AI
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{aiInsights.summary}</p>
                    {(analysisCompletedAt || aiInsights.model || insightLocale || insightVersion) && (
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {analysisCompletedAt && <span>Phân tích lúc: {analysisCompletedAt}</span>}
                        {aiInsights.model && (
                          <span>
                            Model: {aiInsights.model}
                            {aiInsights.version ? ` (${aiInsights.version})` : ''}
                          </span>
                        )}
                        {insightVersion && <span>Bản insight: {insightVersion}</span>}
                        {insightLocale && <span>Ngôn ngữ: {insightLocale}</span>}
                      </div>
                    )}
                  </div>
                )}
                {recommendedRoles.length > 0 && (
                  <div className="bg-muted/30 border border-border/60 rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Vai trò gợi ý
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      {recommendedRoles.map((role) => (
                        <li key={role} className="text-foreground font-medium">
                          {role}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {(strengths.length > 0 || weaknesses.length > 0 || developmentSuggestions.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {strengths.length > 0 && (
                  <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Điểm mạnh
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      {strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {weaknesses.length > 0 && (
                  <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Điểm cần cải thiện
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      {weaknesses.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {developmentSuggestions.length > 0 && (
                  <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-emerald-500" />
                      Gợi ý phát triển
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      {developmentSuggestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {(cheatingCount > 0 || cheatingEvents.length > 0 || cheatingSummaryEntries.length > 0) && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              Giám sát và cảnh báo
            </div>
            {cheatingCount > 0 && (
              <p className="text-sm text-amber-800">
                {cheatingCount} cảnh báo được ghi nhận trong lần đánh giá này.
              </p>
            )}
            {cheatingSummaryEntries.length > 0 && (
              <ul className="space-y-1 text-sm text-amber-900">
                {cheatingSummaryEntries.map(({ key, value }) => (
                  <li key={key} className="flex justify-between gap-2">
                    <span className="font-medium">{key}</span>
                    <span className="text-right">{value}</span>
                  </li>
                ))}
              </ul>
            )}
            {cheatingEvents.length > 0 && (
              <div className="space-y-2 text-xs text-amber-900">
                {cheatingEvents.map((event, index) => (
                  <div
                    key={`${event.questionId ?? 'event'}-${event.occurredAt ?? index}`}
                    className="rounded-xl border border-amber-200 bg-white/70 px-3 py-2 flex flex-col gap-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{event.type ?? 'Sự kiện giám sát'}</span>
                      {event.occurredAt && <span>{formatDate(event.occurredAt)}</span>}
                    </div>
                    {event.questionId && <span>Câu hỏi: {shortenId(event.questionId)}</span>}
                    {event.metadata && <span>{formatDetailValue(event.metadata)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {roleFitEntries.length > 0 && (
          <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Mức độ phù hợp vai trò
            </h3>
            <div className="space-y-3">
              {roleFitEntries.map(([roleName, score]) => (
                <div key={roleName} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">{roleName}</span>
                    <span>{Math.round(score)}%</span>
                  </div>
                  <Progress value={Math.round(score)} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {(timeAnalysisEntries.length > 0 || personalityTraitEntries.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {timeAnalysisEntries.length > 0 && (
              <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Phân tích thời gian
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {timeAnalysisEntries.map(({ key, value }) => (
                    <li key={key} className="flex justify-between gap-2">
                      <span className="text-foreground font-medium">{key}</span>
                      <span className="text-right">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {personalityTraitEntries.length > 0 && (
              <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Đặc điểm tính cách
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {personalityTraitEntries.map(({ key, value }) => (
                    <li key={key} className="flex justify-between gap-2">
                      <span className="text-foreground font-medium">{key}</span>
                      <span className="text-right">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {previousAttempts.length > 0 && (
          <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lịch sử bài đánh giá
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {previousAttempts.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <span>{formatDate(item.completedAt ?? item.startedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>
                      {item.answeredCount}/{item.totalQuestions} câu
                    </span>
                    {formatDurationLabel(item.durationSeconds) && (
                      <span>{formatDurationLabel(item.durationSeconds)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Thông tin liên hệ
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <button
                  onClick={handleEmailClick}
                  className="font-medium hover:text-primary hover:underline transition-colors"
                >
                  {candidate.email ?? '—'}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Điện thoại:</span>
                <span className="font-medium">{candidate.phone ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telegram:</span>
                <span className="font-medium">{candidate.telegram ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tuổi / Giới tính:</span>
                <span className="font-medium">{candidate.age ?? '—'} {candidate.gender ? `(${candidate.gender})` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Học vấn:</span>
                <span className="font-medium text-right">{candidate.education ?? '—'}</span>
              </div>
            </div>
          </div>

        </div>

        {skillEntries.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Điểm số chi tiết
            </h3>
            <div className="space-y-4">
              {skillEntries.map(([skill, value]) => {
                const icon = skillIcons[skill as keyof typeof skillIcons] ?? <Target className="w-4 h-4 text-primary/70" />;
                const label = formatSkillLabel(skill);
                const progressValue = Math.max(0, Math.min(100, value));

                return (
                  <div key={skill} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <span className={`font-bold text-lg ${getScoreColor(value)}`}>{Math.round(value)}</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button
            onClick={() => {
              toast({
                title: 'Đã gửi lời mời phỏng vấn',
                description: candidate.email
                  ? `Lời mời đã được gửi đến ${candidate.email}`
                  : 'Lời mời đã được ghi nhận.',
              });
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3"
            size="lg"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Mời phỏng vấn
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CandidateDetail;

