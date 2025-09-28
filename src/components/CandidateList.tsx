import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Calendar,
  UserCheck,
  Mail,
  Send,
  AlertCircle,
  Clock,
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
            const summarySnippet = candidate.aiInsights?.summary ?? null;
            const truncatedSummary = summarySnippet && summarySnippet.length > 140
              ? `${summarySnippet.slice(0, 140)}...`
              : summarySnippet;
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
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                        {candidate.avatarChar}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-foreground truncate">
                            {candidate.fullName ?? 'Chưa cập nhật'}
                          </h3>
                          {candidate.role && (
                            <Badge variant="outline" className="font-medium">
                              {candidate.role}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
                        {recommendedRole && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Sparkles className="w-3 h-3" />
                            Gợi ý: <span className="text-foreground font-medium">{recommendedRole}</span>
                          </div>
                        )}
                        {assessmentTitle && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Briefcase className="w-3 h-3" />
                            Bài đánh giá:{' '}
                            <span className="text-foreground font-medium truncate">
                              {assessmentTitle}
                            </span>
                          </div>
                        )}
                        {assessmentRole && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Target className="w-3 h-3" />
                            Vị trí mục tiêu: <span className="text-foreground font-medium">{assessmentRole}</span>
                          </div>
                        )}
                        {truncatedSummary && (
                          <p className="text-sm text-muted-foreground">{truncatedSummary}</p>
                        )}
                        {startedAt && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Ngay bat dau: {startedAt}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {overallScore != null ? (
                        <div className="text-center space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${getScoreColor(overallScore ?? 0)}`}>
                              {Math.round(overallScore ?? 0)}
                            </span>
                            {candidate.band && (
                              <Badge className={`${getBandColor(candidate.band)} font-bold pointer-events-none`}>
                                {candidate.band}
                              </Badge>
                            )}
                          </div>
                          {getStatusBadge(attemptStatus)}
                          {analysisCompletedAt && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                              <Calendar className="w-3 h-3" />
                              Chấm AI: {analysisCompletedAt}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-right space-y-1">
                          <div className="text-2xl font-bold text-primary">{progressPercent}%</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {progressLabel}
                          </div>
                          {getStatusBadge(attemptStatus)}
                        </div>
                      )}
                    </div>
                  </div>
                  {(aiStatusLabel || durationLabel || hasCheatingAlerts) && (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {aiStatusLabel && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                          <Sparkles className="w-3 h-3" />
                          {aiStatusLabel}
                        </span>
                      )}
                      {durationLabel && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                          <Timer className="w-3 h-3" />
                          {durationLabel}
                        </span>
                      )}
                      {hasCheatingAlerts && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                          <AlertTriangle className="w-3 h-3" />
                          {cheatingCount} cảnh báo
                        </span>
                      )}
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
