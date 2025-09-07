// src/components/CandidateList.tsx
import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, UserCheck, Mail, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CandidateDetail } from '@/components/CandidateDetail';
import { getCandidates } from '@/lib/api'; // Import API function
import { getBandColor, getScoreColor } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

// Cần định nghĩa interface cho Candidate để đảm bảo type an toàn
interface Candidate {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  role: string;
  band: string | null;
  avatarChar: string;
  scores?: {
    overall: number;
    work_sample?: number;
    problem_solving?: number;
    reliability?: number;
    culture_fit?: number;
  };
  status: 'completed' | 'in_progress';
  startTime?: Date;
  phone?: string;
  telegram?: string;
  age?: number;
  gender?: string;
  education?: string;
}

export const CandidateList = () => {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailList, setEmailList] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState('');
  const [inviteMessage, setInviteMessage] = useState('Chào bạn, mời bạn tham gia bài đánh giá năng lực của chúng tôi.');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Lấy dữ liệu ứng viên từ API
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

  const filteredCandidates = candidates.filter(candidate =>
    candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) || null;

  const validateEmailList = (emailText: string) => {
    if (!emailText.trim()) {
      setEmailValidationError('');
      return true;
    }

    const emailArray = emailText.split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const formatErrors = emailArray.filter(email => 
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

    const lowerCaseEmails = emailArray.map(email => email.toLowerCase());
    const hasDuplicates = lowerCaseEmails.length !== [...new Set(lowerCaseEmails)].length;

    const hasMissingCommas = /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}@/.test(emailText);

    if (formatErrors.length > 0) {
      setEmailValidationError(`Email không đúng định dạng: ${formatErrors[0]}`);
      return false;
    }
    if (hasDuplicates) {
      setEmailValidationError('Có email trùng lặp trong danh sách');
      return false;
    }
    if (hasMissingCommas) {
      setEmailValidationError('Có thể thiếu dấu phẩy phân cách giữa các email');
      return false;
    }
    setEmailValidationError('');
    return true;
  };

  const handleEmailListBlur = () => validateEmailList(emailList);
  const handleEmailListChange = (value: string) => {
    setEmailList(value);
    if (emailValidationError) setEmailValidationError('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 transition-colors">Hoàn thành</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 transition-colors">Đang làm</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  const handleSendInvites = async () => {
    if (!validateEmailList(emailList)) {
      toast({
        title: "Có lỗi trong form",
        description: "Vui lòng kiểm tra lại các email",
        variant: "destructive",
      });
      return;
    }

    // TODO: Gửi email đến Supabase
    // const validEmails = emailList.split(/[,\n]/).map(e => e.trim()).filter(e => e.length > 0);
    // await sendInvites(validEmails, inviteMessage);
    
    toast({
      title: "Gửi thành công!",
      description: `Đã gửi lời mời đến ${getValidEmailCount()} email`,
    });
    
    setIsDialogOpen(false);
  };
  
  const getValidEmailCount = () => {
    if (!emailList.trim() || emailValidationError) return 0;
    return emailList.split(/[,\n]/).filter(e => e.trim()).length;
  };

  if (loading) {
    return <div className="text-center p-8">Đang tải danh sách ứng viên...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Lỗi: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Simplified Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <Plus className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
            Mời ứng viên
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Mời ứng viên làm bài đánh giá
            </DialogTitle>
            <DialogDescription>
              Nhập email để gửi link đánh giá năng lực
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Danh sách email</Label>
              <Textarea
                placeholder="email1@example.com, email2@example.com, email3@example.com"
                value={emailList}
                onChange={(e) => handleEmailListChange(e.target.value)}
                onBlur={handleEmailListBlur}
                className={`min-h-[80px] resize-none ${emailValidationError ? 'border-red-300 focus:border-red-500' : ''}`}
              />
              {emailValidationError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{emailValidationError}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Có thể nhập nhiều email, phân cách bằng dấu phẩy hoặc xuống dòng
              </p>
            </div>
            <div className="space-y-2">
              <Label>Lời nhắn (tuỳ chọn)</Label>
              <Textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="min-h-[60px] resize-none"
                placeholder="Lời nhắn gửi kèm..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleSendInvites}
              disabled={!emailList.trim() || emailValidationError !== ''}
              className={`min-w-[120px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200`}
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Gửi đến {getValidEmailCount()} người
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Danh sách Ứng viên</h1>
          <p className="text-muted-foreground mt-1">Quản lý và đánh giá hồ sơ ứng viên</p>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm kiếm ứng viên theo tên, email hoặc vị trí..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidates Cards */}
        <div className="lg:col-span-2 space-y-4">
          {filteredCandidates.map((candidate) => (
            <Card 
              key={candidate.id}
              className={`
                overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg
                ${selectedCandidateId === candidate.id 
                  ? 'ring-2 ring-primary/50 shadow-lg' 
                  : 'hover:shadow-md hover:scale-[1.02]'
                }
              `}
              onClick={() => setSelectedCandidateId(candidate.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left Side - Avatar & Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg flex-shrink-0">
                      {candidate.avatarChar}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground truncate">
                          {candidate.fullName}
                        </h3>
                        <Badge variant="outline" className="font-medium flex-shrink-0">
                          {candidate.role}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (candidate.email) {
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
                            className="truncate hover:text-primary hover:underline transition-colors cursor-pointer"
                          >
                            {candidate.email}
                          </button>
                        </div>
                        {candidate.startTime && (
                          <div>Ngày nộp: {candidate.startTime.toLocaleDateString('vi-VN')}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Score & Actions */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    {/* Score */}
                    {candidate.scores && (
                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${getScoreColor(candidate.scores.overall)}`}>
                            {candidate.scores.overall ?? 'N/A'}
                          </span>
                          {candidate.band && (
                            <Badge className={`${getBandColor(candidate.band)} font-bold pointer-events-none`}>
                              {candidate.band}
                            </Badge>
                          )}
                        </div>
                        {getStatusBadge(candidate.status)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {filteredCandidates.length === 0 && (
            <Card className="p-12 text-center">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không tìm thấy ứng viên nào</p>
            </Card>
          )}
        </div>

        {/* Candidate Detail */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {selectedCandidate ? (
              <CandidateDetail candidateId={selectedCandidate.id} />
            ) : (
              <Card className="p-8 text-center">
                <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Chọn một ứng viên từ danh sách để xem chi tiết
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateList;