// src/components/CandidateDetail.tsx
import { Calendar, Archive, Mail, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type Candidate } from '@/lib/mockData';
import { getBandColor, getScoreColor } from '@/lib/utils'; // Import from utils
import { useToast } from '@/components/ui/use-toast';

interface CandidateDetailProps {
  candidate: Candidate;
}

export const CandidateDetail = ({ candidate }: CandidateDetailProps) => {
  const { toast } = useToast();
  return (
    <Card className="overflow-hidden">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary-glow/10 p-6 text-center border-b">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4 shadow-lg">
          {candidate.avatarChar}
        </div>
        <h2 className="text-xl font-bold text-foreground">{candidate.userName}</h2>
        <Badge variant="outline" className="mt-2 font-medium">
          {candidate.role}
        </Badge>
      </div>

      <div className="p-6 space-y-6">
        {/* Contact Information */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Thông tin chi tiết</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Họ & Tên:</span>
              <span className="font-medium text-foreground text-right">{candidate.fullName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email:</span>
              <a 
                href={`mailto:${candidate.email}`}
                className="font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                {candidate.email}
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Điện thoại:</span>
              <a 
                href={`tel:${candidate.phone}`}
                className="font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                {candidate.phone}
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Telegram:</span>
              <span className="font-medium text-foreground flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {candidate.telegram}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Giới tính:</span>
              <span className="font-medium text-foreground">{candidate.gender}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tuổi:</span>
              <span className="font-medium text-foreground">{candidate.age}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bằng cấp:</span>
              <span className="font-medium text-foreground text-right">{candidate.education}</span>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        {candidate.scores && (
          <div className="border-t pt-6">
            <h3 className="font-semibold text-foreground mb-4">Điểm tổng hợp</h3>
            <div className="text-center bg-gradient-to-br from-primary/10 to-primary-glow/10 p-6 rounded-xl border border-primary/20">
              <p className={`text-5xl font-bold ${getScoreColor(candidate.scores.overall)}`}>
                {candidate.scores.overall}
              </p>
              {candidate.band && (
                <Badge className={`mt-2 font-bold text-lg px-3 py-1 ${getBandColor(candidate.band)}`}>
                  Xếp loại {candidate.band}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Skill Scores */}
        {candidate.scores && (
          <div className="border-t pt-6">
            <h3 className="font-semibold text-foreground mb-4">Điểm theo Kỹ năng</h3>
            <div className="space-y-4">
              {Object.entries({
                'Work Sample': candidate.scores.work_sample,
                'Problem Solving': candidate.scores.problem_solving,
                'Reliability': candidate.scores.reliability,
                'Culture Fit': candidate.scores.culture_fit
              }).map(([skill, score]) => (
                <div key={skill}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">{skill}</span>
                    <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t pt-6 flex gap-3">
          <Button 
            onClick={() => {
              toast({
                title: "Đã gửi lời mời phỏng vấn",
                description: `Lời mời đã được gửi đến ${candidate.userName} qua email ${candidate.email}`,
              });
            }}
            className="flex-1 bg-success hover:bg-success/90 text-success-foreground shadow-lg"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Mời phỏng vấn
          </Button>
          {/* <Button 
            onClick={() => {
              toast({
                title: "Đã lưu trữ hồ sơ",
                description: `Hồ sơ của ${candidate.userName} đã được lưu trữ thành công.`,
              });
            }}
            variant="outline" 
            className="flex-1"
          >
            <Archive className="w-4 h-4 mr-2" />
            Lưu trữ
          </Button> */}
        </div>
      </div>
    </Card>
  );
};

export default CandidateDetail;

//