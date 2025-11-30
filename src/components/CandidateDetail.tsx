import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
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
  FileText,
  CheckCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getScoreColor, getBandColor } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
// COMMENTED OUT: getCandidateAnswers import - feature is currently broken
import { getCandidateDetails, /* getCandidateAnswers, */ type CandidateDetailSummary, type CandidateAttemptSummary, type CandidateAttemptStatus, /* type CandidateAnswer */ } from '@/lib/api';
import { EMPTY_VALUE, formatDetailValue, parseStructuredSummary, toDisplayEntries } from '@/lib/ai/structuredSummary';

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

const getCheatingBadge = (count: number) => {
  if (count === 0) {
    return <Badge className="bg-green-100 text-green-700 border-green-200 font-medium pointer-events-none">Không có cảnh báo</Badge>;
  } else if (count <= 3) {
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 font-medium pointer-events-none">Mức độ thấp ({count})</Badge>;
  } else if (count <= 7) {
    return <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-medium pointer-events-none">Mức độ trung bình ({count})</Badge>;
  } else {
    return <Badge className="bg-red-100 text-red-700 border-red-200 font-medium pointer-events-none">Mức độ cao ({count})</Badge>;
  }
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
  // COMMENTED OUT: Answers dialog state - feature is currently broken
  // const [answers, setAnswers] = useState<CandidateAnswer[]>([]);
  // const [loadingAnswers, setLoadingAnswers] = useState(false);
  // const [showAnswersDialog, setShowAnswersDialog] = useState(false);
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

  // COMMENTED OUT: openAnswersDialog function - feature is currently broken
  // TODO: Re-enable when answers_snapshot feature is fixed
  /*
  const openAnswersDialog = async () => {
    if (!candidate?.attempt?.id) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy thông tin bài đánh giá.',
        variant: 'destructive',
      });
      return;
    }
    
    // If answers already loaded, just show dialog
    if (answers.length > 0) {
      setShowAnswersDialog(true);
      return;
    }
    
    // Otherwise, fetch answers
    setLoadingAnswers(true);
    try {
      console.log('[CandidateDetail] Fetching answers for attempt:', candidate.attempt.id);
      const data = await getCandidateAnswers(candidate.attempt.id);
      console.log('[CandidateDetail] Received answers:', {
        count: data.length,
        sample: data[0],
      });
      
      if (data.length === 0) {
        toast({
          title: 'Thông báo',
          description: 'Chưa có câu trả lời nào được lưu cho bài đánh giá này.',
        });
      }
      
      setAnswers(data);
      setShowAnswersDialog(true);
    } catch (err) {
      console.error('Failed to load answers:', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải câu trả lời của ứng viên.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAnswers(false);
    }
  };
  */

  const attempt = candidate?.attempt;
  const attemptStatus = attempt?.status ?? 'not_started';
  const aiInsights = candidate?.aiInsights;
  const strengths = aiInsights?.strengths ?? [];
  const weaknesses = aiInsights?.weaknesses ?? [];
  const recommendedRoles = aiInsights?.recommendedRoles ?? [];
  const developmentSuggestions = aiInsights?.developmentSuggestions ?? [];
  const analysisCompletedAt = aiInsights?.analysisCompletedAt ? formatDate(aiInsights.analysisCompletedAt) : null;
  
  console.log('[CandidateDetail] Attempt data:', {
    hasAttempt: !!attempt,
    assessmentTitle: attempt?.assessmentTitle,
    assessmentRole: attempt?.assessmentRole,
    hasAiInsights: !!aiInsights,
    teamFit: aiInsights?.teamFit,
  });
  const { sections: structuredSummarySections } = useMemo(
    () => parseStructuredSummary(aiInsights?.summary ?? null),
    [aiInsights?.summary],
  );
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



  const teamFitEntries = useMemo(() => {
    const record = aiInsights?.teamFit;
    console.log('[CandidateDetail] teamFit raw:', record);
    
    if (!record) {
      return [] as string[];
    }

    // Handle array of strings (new format)
    if (Array.isArray(record)) {
      console.log('[CandidateDetail] teamFitEntries (array):', record);
      return record;
    }

    // Legacy format fallback - convert object to array
    const entries = Object.keys(record);
    console.log('[CandidateDetail] teamFitEntries (object keys):', entries);
    return entries;
  }, [aiInsights?.teamFit]);

  const timeAnalysisEntries = useMemo(
    () => toDisplayEntries(aiInsights?.timeAnalysis ?? null).filter((entry) => entry.value && entry.value !== EMPTY_VALUE),
    [aiInsights?.timeAnalysis],
  );

  const cheatingSummaryEntries = useMemo(
    () => toDisplayEntries(aiInsights?.cheatingSummary ?? null).filter((entry) => entry.value && entry.value !== EMPTY_VALUE),
    [aiInsights?.cheatingSummary],
  );

  const personalityTraitEntries = useMemo(
    () => toDisplayEntries(aiInsights?.personalityTraits ?? null).filter((entry) => entry.value && entry.value !== EMPTY_VALUE),
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
        {candidate.band && (
          <div className="text-center mb-6">
            <Badge className={`font-bold text-sm px-3 py-1 ${getBandColor(candidate.band)} pointer-events-none`}>
              Xếp loại {candidate.band}
            </Badge>
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
              {attempt.assessmentTitle && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Briefcase className="w-4 h-4" />
                  Tên bài test:
                  <span className="text-foreground font-medium">
                    {attempt.assessmentTitle}
                  </span>
                </div>
              )}
              {attempt.assessmentRole && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Target className="w-4 h-4" />
                  Vị trí ứng tuyển:
                  <span className="text-foreground font-medium">
                    {attempt.assessmentRole}
                  </span>
                </div>
              )}
              {teamFitEntries.length > 0 && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Users className="w-4 h-4" />
                  Team phù hợp:
                  <div className="flex flex-wrap gap-1">
                    {teamFitEntries.map((teamName) => (
                      <Badge key={teamName} variant="secondary" className="text-xs">
                        {teamName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
            {/* COMMENTED OUT: View answers button - feature is currently broken */}
            {/* TODO: Re-enable when answers_snapshot feature is fixed */}
            {/*
            {attempt.status === 'completed' && (
              <div className="pt-3 border-t border-border/40">
                <Button
                  onClick={openAnswersDialog}
                  disabled={loadingAnswers}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {loadingAnswers ? 'Đang tải...' : 'Xem câu trả lời'}
                </Button>
              </div>
            )}
            */}
          </div>
        ) : (
          <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 text-sm text-muted-foreground">
            Ứng viên chưa bắt đầu bài đánh giá nào.
          </div>
        )}



        {aiInsights && (
          <>
            {structuredSummarySections.map((section, index) => {
              const sectionKey = section.id
                ? `${section.id}-${index}`
                : `summary-section-${index}`;

              return (
                <div
                  key={sectionKey}
                  className="flex flex-col gap-3 rounded-xl border border-border/40 bg-background px-4 py-3 shadow-sm min-w-[220px]"
                >
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-foreground">
                      {section.title}
                    </span>
                    {section.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-normal break-words">
                        {section.description}
                      </p>
                    )}
                  </div>

                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {section.bullets.map((item, itemIndex) => (
                        <li
                          key={`${sectionKey}-bullet-${itemIndex}`}
                          className="break-words"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.content && section.content.length > 0 && (
                    <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      {section.content.map((entry, entryIndex) => (
                        <div
                          key={`${sectionKey}-entry-${entryIndex}`}
                          className="flex flex-col rounded-lg bg-muted/40 px-3 py-2"
                        >
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {entry.label}
                          </dt>
                          <dd className="text-sm font-semibold text-foreground break-words">
                            {entry.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              );
            })}

            {strengths.length > 0 && (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-xl font-semibold text-foreground">Điểm mạnh</h3>
                </div>
                <p className="text-sm text-muted-foreground">Những điểm nổi bật của ứng viên</p>
                <div className="flex flex-wrap gap-3">
                  {strengths.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {teamFitEntries.length > 0 && (
              <div className="bg-sky-50/50 border border-sky-200 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-sky-500" />
                  <h3 className="text-xl font-semibold text-foreground">Team phù hợp</h3>
                </div>
                <p className="text-sm text-muted-foreground">Các team được đề xuất dựa trên kết quả đánh giá</p>
                <div className="flex flex-wrap gap-3">
                  {teamFitEntries.map((teamName) => (
                    <span
                      key={teamName}
                      className="rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm"
                    >
                      {teamName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {skillEntries.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50/50 to-sky-50/50 border border-purple-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <h3 className="text-xl font-semibold text-foreground">Bảng điểm năng lực</h3>
                </div>
                <p className="text-sm text-muted-foreground">Đánh giá chi tiết các kỹ năng của ứng viên</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {skillEntries.map(([skill, value]) => {
                    const label = formatSkillLabel(skill);
                    const progressValue = Math.max(0, Math.min(100, value));
                    return (
                      <div
                        key={skill}
                        className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-3">
                          <span>{label}</span>
                          <span className={`text-lg ${getScoreColor(value)}`}>{Math.round(value)}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-sky-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all"
                            style={{ width: `${progressValue}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {recommendedRoles.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-200 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-xl font-semibold text-foreground">Vị trí được đề xuất</h3>
                </div>
                <p className="text-sm text-muted-foreground">Các vị trí phù hợp với năng lực của ứng viên</p>
                <div className="flex flex-wrap gap-3">
                  {recommendedRoles.map((role) => (
                    <span
                      key={role}
                      className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(weaknesses.length > 0 || developmentSuggestions.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {developmentSuggestions.length > 0 && (
                  <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="w-6 h-6 text-purple-500" />
                      <h3 className="text-xl font-semibold text-foreground">Gợi ý phát triển</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Hướng phát triển cho ứng viên</p>
                    <ul className="space-y-3 text-sm text-slate-600">
                      {developmentSuggestions.map((suggestion) => (
                        <li
                          key={suggestion}
                          className="flex items-start gap-2 rounded-2xl bg-purple-50/80 px-4 py-3 text-left shadow-sm"
                        >
                          <span className="mt-1 h-2 w-2 rounded-full bg-purple-400 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {weaknesses.length > 0 && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                      <h3 className="text-xl font-semibold text-foreground">Điểm cần cải thiện</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Các kỹ năng cần phát triển thêm</p>
                    <div className="flex flex-wrap gap-3">
                      {weaknesses.map((area) => (
                        <span
                          key={area}
                          className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {(cheatingCount > 0 || cheatingEvents.length > 0) && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                Giám sát và cảnh báo
              </div>
              {getCheatingBadge(cheatingCount)}
            </div>
            
            {cheatingEvents.length > 0 && (() => {
              const eventsByType = cheatingEvents.reduce((acc, event) => {
                const type = event.type ?? 'unknown';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              
              const typeLabels: Record<string, string> = {
                'tab_switch': 'Chuyển tab',
                'copy_paste': 'Sao chép/Dán',
                'unknown': 'Khác',
              };
              
              return (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(eventsByType).map(([type, count]) => (
                    <div key={type} className="bg-white/70 border border-amber-200 rounded-lg px-3 py-2 text-center">
                      <div className="font-semibold text-amber-900">{count}</div>
                      <div className="text-xs text-amber-700">{typeLabels[type] || type}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
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



        <div className="pt-4 border-t">
          <Button
            onClick={() => {
              toast({
                title: 'Chức năng đang phát triển',
                description: 'Tính năng mời phỏng vấn sẽ sớm được ra mắt.',
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

      {/* COMMENTED OUT: Answers Dialog - feature is currently broken */}
      {/* TODO: Re-enable when answers_snapshot feature is fixed */}
      {/*
      <Dialog open={showAnswersDialog} onOpenChange={setShowAnswersDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Câu trả lời của ứng viên
            </DialogTitle>
            <DialogDescription>
              Chi tiết các câu trả lời trong bài đánh giá {candidate.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {answers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có câu trả lời nào được lưu.</p>
                <p className="text-sm mt-2">Ứng viên có thể chưa hoàn thành bài đánh giá hoặc dữ liệu chưa được đồng bộ.</p>
              </div>
            ) : answers.map((answer, index) => {
              const isMultipleChoice = answer.questionFormat === 'multiple_choice';
              const isAnswered = answer.userAnswer !== null && answer.userAnswer !== '';
              const isCorrect = isAnswered && answer.isCorrect === true;
              const isWrong = isAnswered && answer.isCorrect === false;
              
              console.log('[CandidateDetail] Rendering answer:', {
                index,
                questionNumber: answer.questionNumber,
                userAnswer: answer.userAnswer,
                userAnswerType: typeof answer.userAnswer,
                userAnswerLength: answer.userAnswer?.length,
                isAnswered,
                isCorrect,
                isWrong,
              });
              
              return (
                <div
                  key={answer.questionId}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-semibold">
                      Câu {index + 1}
                    </Badge>
                    {isMultipleChoice && (
                      <Badge variant="secondary" className="text-xs">
                        Trắc nghiệm
                      </Badge>
                    )}
                    {!isAnswered && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                        Chưa trả lời
                      </Badge>
                    )}
                    {isCorrect && (
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                        Đúng
                      </Badge>
                    )}
                    {isWrong && (
                      <Badge className="text-xs bg-red-100 text-red-700 border-red-300">
                        Sai
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium text-slate-800">
                    {answer.questionText}
                  </p>
                  
                  {isMultipleChoice && answer.allOptions && answer.allOptions.length > 0 ? (
                    <div className="space-y-2">
                      {answer.allOptions.map((option, optIndex) => {
                        const isSelected = optIndex === answer.selectedOptionIndex;
                        const isCorrectOption = option === answer.correctAnswer;
                        
                        return (
                          <div
                            key={optIndex}
                            className={`rounded-lg p-3 border-2 transition-colors ${
                              isSelected && isCorrect
                                ? 'bg-green-50 border-green-500'
                                : isSelected && isWrong
                                  ? 'bg-red-50 border-red-500'
                                  : isCorrectOption
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected && isCorrect && (
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                              {isSelected && isWrong && (
                                <X className="w-4 h-4 text-red-600 flex-shrink-0" />
                              )}
                              {!isSelected && isCorrectOption && (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              )}
                              <p className={`text-sm ${
                                isSelected && isCorrect
                                  ? 'text-green-900 font-medium'
                                  : isSelected && isWrong
                                    ? 'text-red-900 font-medium'
                                    : isCorrectOption
                                      ? 'text-green-700 font-medium'
                                      : 'text-slate-700'
                              }`}>
                                {option}
                                {!isSelected && isCorrectOption && (
                                  <span className="ml-2 text-xs text-green-600">(Đáp án đúng)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Câu trả lời:</p>
                      <p className="text-sm text-slate-900 whitespace-pre-wrap">
                        {answer.userAnswer || 'Chưa trả lời'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      */}
    </Card>
  );
};

export default CandidateDetail;

