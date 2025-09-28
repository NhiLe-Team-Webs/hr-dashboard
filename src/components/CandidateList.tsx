import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Calendar,
  UserCheck,
  Mail,
  Send,
  AlertCircle,
  Target,
  AlertTriangle,
  Briefcase,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CandidateDetail } from '@/components/CandidateDetail';
import { getCandidates, type CandidateSummary, type CandidateAttemptSummary, type CandidateAttemptStatus } from '@/lib/api';
import { EMPTY_VALUE, parseStructuredSummary } from '@/lib/ai/structuredSummary';
import { getBandColor, getScoreColor } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

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
  const [emailList, setEmailList] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState('');
  const [inviteMessage, setInviteMessage] = useState('Chào bạn, mời bạn tham gia bài đánh giá năng lực của chúng tôi.');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const data = await getCandidates();
        setCandidates(data);
        if (data.length > 0) {
          setSelectedCandidateId(data[0].id);
        }
      } catch (err) {
        setError('Không thể tải danh sách ứng viên.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const filteredCandidates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return candidates;
    }
    return candidates.filter((candidate) => {
      const name = candidate.fullName ?? '';
      const email = candidate.email ?? '';
      const role = candidate.role ?? '';
      return (
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        role.toLowerCase().includes(query)
      );
    });
  }, [candidates, searchTerm]);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) ?? null;

  const validateEmailList = (emailText: string) => {
    if (!emailText.trim()) {
      setEmailValidationError('');
      return true;
    }

    const emailArray = emailText
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const invalidEmail = emailArray.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (invalidEmail) {
      setEmailValidationError(`Email không đúng định dạng: ${invalidEmail}`);
      return false;
    }

    const lowerCaseEmails = emailArray.map((email) => email.toLowerCase());
    if (lowerCaseEmails.length !== new Set(lowerCaseEmails).size) {
      setEmailValidationError('Có email trùng lặp trong danh sách');
      return false;
    }

    const missingComma = /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}@/.test(emailText);
    if (missingComma) {
      setEmailValidationError('Có thể thiếu dấu phẩy giữa các email');
      return false;
    }

    setEmailValidationError('');
    return true;
  };

  const handleEmailListChange = (value: string) => {
    setEmailList(value);
    if (emailValidationError) {
      setEmailValidationError('');
    }
  };

  const handleEmailListBlur = () => validateEmailList(emailList);

  if (loading) {
    return <div className="text-center p-8">Đang tải danh sách ứng viên...</div>;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách Ứng viên</h1>
          <p className="text-muted-foreground">Quản lý và đánh giá hồ sơ ứng viên</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Mời ứng viên
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mời ứng viên mới</DialogTitle>
              <DialogDescription>
                Nhập danh sách email (ngăn cách bởi dấu phẩy hoặc xuống dòng) và lời nhắn mời tham gia bài đánh giá.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Email ứng viên</Label>
                <Textarea
                  placeholder="candidate1@example.com, candidate2@example.com"
                  value={emailList}
                  onChange={(event) => handleEmailListChange(event.target.value)}
                  onBlur={handleEmailListBlur}
                  rows={4}
                />
                {emailValidationError && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {emailValidationError}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Lời nhắn</Label>
                <Textarea
                  placeholder="Chào bạn, ..."
                  value={inviteMessage}
                  onChange={(event) => setInviteMessage(event.target.value)}
                  rows={3}
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  if (!validateEmailList(emailList)) {
                    return;
                  }
                  setIsDialogOpen(false);
                  toast({
                    title: 'Đã gửi lời mời',
                    description: 'Email đã được gửi cho ứng viên.',
                  });
                }}
              >
                <Send className="w-4 h-4" />
                Gửi lời mời
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm ứng viên theo tên, email hoặc vị trí..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
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
                className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedCandidateId === candidate.id
                    ? 'ring-2 ring-primary/50 shadow-lg'
                    : 'hover:shadow-md hover:scale-[1.02]'
                }`}
                onClick={() => setSelectedCandidateId(candidate.id)}
              >
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
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1 min-w-0">
                            <Mail className="w-3 h-3 flex-shrink-0" />
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
                              className="truncate hover:text-primary hover:underline transition-colors cursor-pointer"
                            >
                              {candidate.email ?? '—'}
                            </button>
                          </div>
                          {assessmentTitle && (
                            <div className="flex items-center gap-1 text-sm">
                              <Briefcase className="w-3 h-3" />
                              <span className="text-muted-foreground">Bài đánh giá:</span>
                              <span className="text-foreground font-medium truncate max-w-[12rem]">
                                {assessmentTitle}
                              </span>
                            </div>
                          )}
                          {assessmentRole && (
                            <div className="flex items-center gap-1 text-sm">
                              <Target className="w-3 h-3" />
                              <span className="text-muted-foreground">Vị trí mục tiêu:</span>
                              <span className="text-foreground font-medium truncate max-w-[10rem]">
                                {assessmentRole}
                              </span>
                            </div>
                          )}
                        </div>
                        {(summaryPreviewSections.length > 0 || summaryPlainText) && (
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            {summaryPreviewSections.map((section, index) => {
                              const sectionKey = section.id ? `${section.id}-${index}` : `candidate-summary-${index}`;
                              const sectionTitle = section.title && section.title !== EMPTY_VALUE ? section.title : 'Tổng quan';
                              const bulletItems = section.bullets
                                ?.filter((item) => item && item !== EMPTY_VALUE)
                                ?.slice(0, 3) ?? [];
                              const contentChips = section.content
                                ?.filter((entry) => entry.value && entry.value !== EMPTY_VALUE)
                                ?.slice(0, 3) ?? [];
                              return (
                                <div
                                  key={sectionKey}
                                  className="rounded-xl border border-border/40 bg-muted/30 px-3 py-3 shadow-sm"
                                >
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {sectionTitle}
                                  </p>
                                  {section.description && section.description !== EMPTY_VALUE && (
                                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{section.description}</p>
                                  )}
                                  {bulletItems.length > 0 && (
                                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                                      {bulletItems.map((item, bulletIndex) => (
                                        <li key={`${sectionKey}-bullet-${bulletIndex}`}>{item}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {contentChips.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {contentChips.map((entry, chipIndex) => (
                                        <span
                                          key={`${sectionKey}-chip-${chipIndex}`}
                                          className="rounded-full bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm"
                                        >
                                          {entry.label}: {entry.value}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {summaryPlainText && (
                              <p className="md:col-span-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-3 text-sm text-muted-foreground leading-relaxed">
                                {summaryPlainText}
                              </p>
                            )}
                          </div>
                        )}
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
                          {overallScore != null ? 'Điểm tổng' : progressLabel}
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

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
                    {startedAt && (
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50/50 px-3 py-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wide text-slate-500">Ngày bắt đầu</span>
                          <span className="text-foreground font-medium">{startedAt}</span>
                        </div>
                      </div>
                    )}
                    {durationLabel && (
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50/50 px-3 py-2">
                        <Timer className="w-4 h-4 text-slate-500" />
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wide text-slate-500">Thời lượng</span>
                          <span className="text-foreground font-medium">{durationLabel}</span>
                        </div>
                      </div>
                    )}
                    {aiStatusLabel && (
                      <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sky-700">
                        <Sparkles className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wide">AI</span>
                          <span className="text-sm font-medium text-sky-800">{aiStatusLabel}</span>
                        </div>
                      </div>
                    )}
                    {hasCheatingAlerts && (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                        <AlertTriangle className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wide">Giám sát</span>
                          <span className="text-sm font-medium">{cheatingCount} cảnh báo</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {(recommendedRole || topStrengths.length > 0 || topDevelopment.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {recommendedRole && (
                        <Badge className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
                          <Briefcase className="w-3 h-3" />
                          {recommendedRole}
                        </Badge>
                      )}
                      {topStrengths.map((item) => (
                        <Badge key={item} variant="secondary" className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {item}
                        </Badge>
                      ))}
                      {topDevelopment.map((item) => (
                        <Badge key={item} variant="outline" className="flex items-center gap-1 border-amber-300 text-amber-700">
                          <AlertTriangle className="w-3 h-3" />
                          {item}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {filteredCandidates.length === 0 && (
            <Card className="p-12 text-center">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không tìm thấy ứng viên</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {selectedCandidate ? (
              <CandidateDetail candidateId={selectedCandidate.id} />
            ) : (
              <Card className="p-8 text-center">
                <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chọn một ứng viên từ danh sách để xem chi tiết</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateList;
