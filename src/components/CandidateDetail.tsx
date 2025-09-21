import { useEffect, useMemo, useState } from 'react';
import { Calendar, Mail, User, Trophy, Target, Users, Briefcase, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';
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
  const aiInsights = candidate?.aiInsights;
  const overallScore = aiInsights?.overallScore ?? null;
  const strengths = aiInsights?.strengths ?? [];
  const weaknesses = aiInsights?.weaknesses ?? [];
  const recommendedRoles = aiInsights?.recommendedRoles ?? [];
  const developmentSuggestions = aiInsights?.developmentSuggestions ?? [];
  const analysisCompletedAt = aiInsights?.analysisCompletedAt ? formatDate(aiInsights.analysisCompletedAt) : null;

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
              <p className="text-xs text-muted-foreground mt-2">Phan tich luc: {analysisCompletedAt}</p>
            )}
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
                      Tong quan AI
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{aiInsights.summary}</p>
                    {(analysisCompletedAt || aiInsights.model) && (
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {analysisCompletedAt && <span>Phan tich luc: {analysisCompletedAt}</span>}
                        {aiInsights.model && (
                          <span>
                            Model: {aiInsights.model}
                            {aiInsights.version ? ` (${aiInsights.version})` : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {recommendedRoles.length > 0 && (
                  <div className="bg-muted/30 border border-border/60 rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Vai tro goi y
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
                      Diem manh
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
                      Diem can cai thien
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
                      Goi y phat trien
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

          <div>
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Tiến độ đánh giá
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Trạng thái</span>
                {getStatusBadge(attempt?.status ?? 'not_started')}
              </div>
              <div className="flex justify-between items-center">
                <span>Tiến độ</span>
                <span className="font-medium text-foreground">{attempt ? `${Math.round(attempt.progressPercent)}%` : '0%'}</span>
              </div>
              <Progress value={attempt?.progressPercent ?? 0} className="h-2" />
              <div className="flex justify-between">
                <span>Đã trả lời</span>
                <span className="font-medium text-foreground">{attempt ? `${attempt.answeredCount}/${attempt.totalQuestions}` : '0/0'} câu hỏi</span>
              </div>
              <div className="flex justify-between">
                <span>Bắt đầu</span>
                <span>{formatDate(attempt?.startedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lần hoạt động gần nhất</span>
                <span>{formatDate(attempt?.lastActivityAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Đã nộp</span>
                <span>{formatDate(attempt?.submittedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hoàn tất</span>
                <span>{formatDate(attempt?.completedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {skillEntries.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Diem so chi tiet
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

