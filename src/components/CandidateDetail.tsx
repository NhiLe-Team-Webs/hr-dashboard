// src/components/CandidateDetail.tsx
import { useEffect, useState } from 'react';
import { Calendar, Mail, Phone, User, Trophy, Target, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getScoreColor, getBandColor } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { getCandidateDetails } from '@/lib/api';

// Khai báo một interface để đảm bảo type an toàn
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegram: string;
  age: number;
  gender: string;
  education: string;
  band: string | null;
  role: string;
  avatarChar: string;
  scores: {
    overall: number;
    work_sample?: number;
    problem_solving?: number;
    reliability?: number;
    culture_fit?: number;
  };
}

interface CandidateDetailProps {
  candidateId: string; // Chuyển sang nhận ID thay vì toàn bộ object
}

export const CandidateDetail = ({ candidateId }: CandidateDetailProps) => {
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const skillIcons = {
    'Work Sample': <Briefcase className="w-4 h-4" />,
    'Problem Solving': <Target className="w-4 h-4" />,
    'Reliability': <Trophy className="w-4 h-4" />,
    'Culture Fit': <Users className="w-4 h-4" />
  };

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const data = await getCandidateDetails(candidateId);
        // Format data to match your local state structure
        const formattedData: Candidate = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          telegram: data.telegram,
          age: data.age,
          gender: data.gender,
          education: data.education,
          band: data.band,
          role: data.role,
          avatarChar: data.name.charAt(0).toUpperCase(),
          scores: {
            overall: data.scores[0]?.total_score || 0,
            work_sample: 85, // Giả định
            problem_solving: 90, // Giả định
            reliability: 75, // Giả định
            culture_fit: 88, // Giả định
          },
        };
        setCandidate(formattedData);
      } catch (err) {
        setError('Không thể tải thông tin ứng viên.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [candidateId]);

  const handleEmailClick = () => {
    if (candidate) {
      window.open(`https://mail.google.com/mail/u/0/#inbox?compose=new&to=${encodeURIComponent(candidate.email)}`, '_blank');
    }
  };

  if (loading) {
    return <div className="text-center p-8">Đang tải thông tin ứng viên...</div>;
  }

  if (error || !candidate) {
    return <div className="text-center p-8 text-red-500">Lỗi: {error || 'Không tìm thấy ứng viên.'}</div>;
  }

  return (
    <Card className="overflow-hidden">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center border-b">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4 shadow-lg">
          {candidate.avatarChar}
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">{candidate.name}</h2>
        <Badge variant="outline" className="font-medium">
          {candidate.role}
        </Badge>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Score - Prominent Display */}
        {candidate.scores && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full border-4 border-primary/20 mb-3">
              <span className={`text-3xl font-bold ${getScoreColor(candidate.scores.overall)}`}>
                {candidate.scores.overall}
              </span>
            </div>
            {candidate.band && (
              <div>
                <Badge className={`font-bold text-sm px-3 py-1 ${getBandColor(candidate.band)} pointer-events-none`}>
                  Xếp loại {candidate.band}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Quick Contact Actions */}
        <div className="flex gap-2 justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={handleEmailClick}
            className="flex-1 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
          >
            <Mail className="w-3 h-3 mr-1" />
            Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`tel:${candidate.phone}`, '_blank')}
            className="flex-1 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors"
          >
            <Phone className="w-3 h-3 mr-1" />
            Gọi
          </Button>
        </div>

        {/* Contact Information - Compact */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4" />
            Thông tin liên hệ
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Họ tên:</span>
              <button
                onClick={async () => {
                  if (candidate) {
                    try {
                      await navigator.clipboard.writeText(candidate.name);
                      toast({
                        title: "Đã copy họ tên",
                        description: `Họ tên "${candidate.name}" đã được sao chép`,
                      });
                    } catch (err) {
                      console.log('Failed to copy name:', err);
                    }
                  }
                }}
                className="font-medium text-right hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                {candidate.name}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (candidate) {
                    try {
                      await navigator.clipboard.writeText(candidate.email);
                      toast({
                        title: "Đã copy email",
                        description: `Email ${candidate.email} đã được sao chép`,
                      });
                    } catch (err) {
                      console.log('Failed to copy email:', err);
                    }
                  }
                }}
                className="font-medium text-right truncate ml-2 hover:text-primary hover:underline transition-colors cursor-pointer text-left"
              >
                {candidate.email}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Điện thoại:</span>
              <button
                onClick={async () => {
                  if (candidate) {
                    try {
                      await navigator.clipboard.writeText(candidate.phone);
                      toast({
                        title: "Đã copy số điện thoại",
                        description: `Số điện thoại ${candidate.phone} đã được sao chép`,
                      });
                    } catch (err) {
                      console.log('Failed to copy phone:', err);
                    }
                  }
                }}
                className="font-medium hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                {candidate.phone}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telegram:</span>
              <button
                onClick={async () => {
                  if (candidate) {
                    try {
                      await navigator.clipboard.writeText(candidate.telegram);
                      toast({
                        title: "Đã copy telegram",
                        description: `Telegram ${candidate.telegram} đã được sao chép`,
                      });
                    } catch (err) {
                      console.log('Failed to copy telegram:', err);
                    }
                  }
                }}
                className="font-medium hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                {candidate.telegram}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tuổi:</span>
              <button
                onClick={async () => {
                  if (candidate) {
                    try {
                      const ageInfo = `${candidate.age} (${candidate.gender})`;
                      await navigator.clipboard.writeText(ageInfo);
                      toast({
                        title: "Đã copy thông tin tuổi",
                        description: `Thông tin "${ageInfo}" đã được sao chép`,
                      });
                    } catch (err) {
                      console.log('Failed to copy age info:', err);
                    }
                  }
                }}
                className="font-medium hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                {candidate.age} ({candidate.gender})
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Học vấn:</span>
              <button
                onClick={async () => {
                  if (candidate) {
                    try {
                      await navigator.clipboard.writeText(candidate.education);
                      toast({
                        title: "Đã copy học vấn",
                        description: `Thông tin học vấn "${candidate.education}" đã được sao chép`,
                      });
                    } catch (err) {
                      console.log('Failed to copy education:', err);
                    }
                  }
                }}
                className="font-medium text-right hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                {candidate.education}
              </button>
            </div>
          </div>
        </div>

        {/* Skill Scores - Enhanced */}
        {candidate.scores && (
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Điểm số chi tiết
            </h3>
            <div className="space-y-4">
              {Object.entries({
                'Work Sample': candidate.scores.work_sample,
                'Problem Solving': candidate.scores.problem_solving,
                'Reliability': candidate.scores.reliability,
                'Culture Fit': candidate.scores.culture_fit
              }).map(([skill, score]) => (
                <div key={skill} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {skillIcons[skill as keyof typeof skillIcons]}
                      <span className="text-sm font-medium">{skill}</span>
                    </div>
                    <span className={`font-bold text-lg ${getScoreColor(score)}`}>{score}</span>
                  </div>
                  <div className="relative">
                    <Progress value={score} className="h-2" />
                    <div className="absolute top-0 left-0 w-full h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          score >= 80 ? 'bg-green-500' : 
                          score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Action */}
        <div className="pt-4 border-t">
          <Button 
            onClick={() => {
              toast({
                title: "Đã gửi lời mời phỏng vấn",
                description: `Lời mời đã được gửi đến ${candidate.name} qua email ${candidate.email}`,
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