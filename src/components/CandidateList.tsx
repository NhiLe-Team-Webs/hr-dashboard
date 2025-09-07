// src/components/CandidateList.tsx
import { useState } from 'react';
import { Plus, Search, Calendar, Archive, UserCheck, Mail, Send, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CandidateDetail } from '@/components/CandidateDetail';
import { mockCandidates, type Candidate } from '@/lib/mockData';
import { getBandColor, getScoreColor } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
  
export const CandidateList = () => {
  const { toast } = useToast();
  const [emailList, setEmailList] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emails, setEmails] = useState(['']);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('Chào bạn, mời bạn tham gia bài đánh giá năng lực của chúng tôi.');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    mockCandidates.length > 0 ? mockCandidates[0] : null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCandidate, setHoveredCandidate] = useState<string | null>(null);
  const [emailValidationError, setEmailValidationError] = useState('');

  const filteredCandidates = mockCandidates.filter(candidate =>
    candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateEmail = (email: string) => {
    if (!email.trim()) return 'Email không được để trống';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không đúng định dạng';
    return '';
  };

  const validateAllEmails = () => {
    const errors = emails.map(email => validateEmail(email));
    setEmailErrors(errors);
    return !errors.some(error => error !== '') && !hasDuplicateEmails();
  };

  const hasDuplicateEmails = () => {
    const validEmails = emails.filter(email => email.trim() && !validateEmail(email));
    return validEmails.length !== [...new Set(validEmails.map(e => e.toLowerCase()))].length;
  };

  // Validate email list function
  const validateEmailList = (emailText: string) => {
    if (!emailText.trim()) {
      setEmailValidationError('');
      return true;
    }

    // Parse emails from both comma and newline separated
    const emailArray = emailText.split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    // Check for format errors
    const formatErrors = emailArray.filter(email => 
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

    // Check for duplicates (case insensitive)
    const lowerCaseEmails = emailArray.map(email => email.toLowerCase());
    const hasDuplicates = lowerCaseEmails.length !== [...new Set(lowerCaseEmails)].length;

    // Check for missing commas (basic heuristic - consecutive words without @ or domain)
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

  const handleEmailListBlur = () => {
    validateEmailList(emailList);
  };

  const handleEmailListChange = (value: string) => {
    setEmailList(value);
    // Clear error when user starts typing
    if (emailValidationError) {
      setEmailValidationError('');
    }
  };

  const addEmail = () => {
    setEmails([...emails, '']);
    setEmailErrors([...emailErrors, '']);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const removeEmail = (index: number) => {
    if (emails.length === 1) return;
    const newEmails = emails.filter((_, i) => i !== index);
    const newErrors = emailErrors.filter((_, i) => i !== index);
    setEmails(newEmails);
    setEmailErrors(newErrors);
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    
    if (showErrors) {
      const newErrors = [...emailErrors];
      newErrors[index] = '';
      setEmailErrors(newErrors);
    }
  };

  const handleEmailBlur = (index: number) => {
    if (!showErrors) return;
    const newErrors = [...emailErrors];
    newErrors[index] = validateEmail(emails[index]);
    setEmailErrors(newErrors);
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
    setShowErrors(true);
    
    if (!validateAllEmails()) {
      toast({
        title: "Có lỗi trong form",
        description: "Vui lòng kiểm tra lại các email",
        variant: "destructive",
      });
      return;
    }

    const validEmails = emails.filter(email => email.trim());
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Gửi thành công!",
        description: `Đã gửi lời mời đến ${validEmails.length} email`,
      });
      
      setEmails(['']);
      setEmailErrors(['']);
      setShowErrors(false);
      setInviteMessage('Chào bạn, mời bạn tham gia bài đánh giá năng lực của chúng tôi.');
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi gửi lời mời",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteInterview = (candidate: Candidate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toast({
      title: "Đã gửi lời mời phỏng vấn",
      description: `Lời mời đã được gửi đến ${candidate.userName}`,
    });
  };

  // Check if send button should be disabled
  const isSendDisabled = () => {
    if (isLoading || !emailList.trim()) return true;
    return emailValidationError !== '';
  };

  const getValidEmailCount = () => {
    if (!emailList.trim() || emailValidationError) return 0;
    return emailList.split(/[,\n]/).filter(e => e.trim()).length;
  };

  return (
    <div className="space-y-6">
      {/* Simplified Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEmails(['']);
          setEmailErrors(['']);
          setShowErrors(false);
          setEmailList('');
          setEmailValidationError('');
        }
      }}>
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
            {/* Simple Email Input */}
            <div className="space-y-3">
              <Label>Danh sách email</Label>
              <Textarea
                placeholder="email1@example.com, email2@example.com, email3@example.com"
                value={emailList}
                onChange={(e) => handleEmailListChange(e.target.value)}
                onBlur={handleEmailListBlur}
                className={`min-h-[80px] resize-none ${emailValidationError ? 'border-red-300 focus:border-red-500' : ''}`}
                disabled={isLoading}
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
            
            {/* Message */}
            <div className="space-y-2">
              <Label>Lời nhắn (tuỳ chọn)</Label>
              <Textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="min-h-[60px] resize-none"
                disabled={isLoading}
                placeholder="Lời nhắn gửi kèm..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button 
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  const emailCount = getValidEmailCount();
                  toast({
                    title: "🎉 Gửi thành công!",
                    description: `Đã gửi lời mời đánh giá đến ${emailCount} ứng viên`,
                  });
                  setEmailList('');
                  setEmailValidationError('');
                  setInviteMessage('Chào bạn, mời bạn tham gia bài đánh giá năng lực của chúng tôi.');
                  setIsDialogOpen(false);
                  setIsLoading(false);
                }, 1500);
              }}
              disabled={isSendDisabled()}
              className={`min-w-[120px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 ${
                isSendDisabled() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang gửi...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Gửi đến {getValidEmailCount()} người
                </div>
              )}
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
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <Plus className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
          Mời ứng viên
        </Button>
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
                ${selectedCandidate?.id === candidate.id 
                  ? 'ring-2 ring-primary/50 shadow-lg' 
                  : 'hover:shadow-md hover:scale-[1.02]'
                }
              `}
              onClick={() => setSelectedCandidate(candidate)}
              onMouseEnter={() => setHoveredCandidate(candidate.id)}
              onMouseLeave={() => setHoveredCandidate(null)}
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
                          {candidate.userName}
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
                              try {
                                await navigator.clipboard.writeText(candidate.email);
                                toast({
                                  title: "Đã copy email",
                                  description: `Email ${candidate.email} đã được sao chép`,
                                });
                              } catch (err) {
                                console.log('Failed to copy email:', err);
                              }
                              window.open('https://gmail.com', '_blank');
                            }}
                            className="truncate hover:text-primary hover:underline transition-colors cursor-pointer"
                          >
                            {candidate.email}
                          </button>
                        </div>
                        <div>Ngày nộp: {candidate.startTime.toLocaleDateString('vi-VN')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Score & Actions */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    {/* Score */}
                    <div className="text-center">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getScoreColor(candidate.scores?.overall ?? 0)}`}>
                          {candidate.scores?.overall ?? 'N/A'}
                        </span>
                        {candidate.band && (
                          <Badge className={`${getBandColor(candidate.band)} font-bold pointer-events-none`}>
                            {candidate.band}
                          </Badge>
                        )}
                      </div>
                      {getStatusBadge(candidate.status)}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className={`
                      flex gap-2 transition-all duration-200
                      ${hoveredCandidate === candidate.id || selectedCandidate?.id === candidate.id 
                        ? 'opacity-100 transform translate-y-0' 
                        : 'opacity-0 transform translate-y-2'
                      }
                    `}>
                      <Button
                        size="sm"
                        onClick={(e) => handleInviteInterview(candidate, e)}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Mời PV
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Progress bars for skills (visible when hovered or selected) */}
                {candidate.scores && (hoveredCandidate === candidate.id || selectedCandidate?.id === candidate.id) && (
                  <div className="mt-4 pt-4 border-t border-border animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {Object.entries({
                        'Work Sample': candidate.scores.work_sample,
                        'Problem Solving': candidate.scores.problem_solving,
                        'Reliability': candidate.scores.reliability,
                        'Culture Fit': candidate.scores.culture_fit
                      }).map(([skill, score]) => (
                        <div key={skill} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{skill}</span>
                            <span className="font-semibold">{score}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-primary rounded-full h-1.5 transition-all duration-300"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              <CandidateDetail candidate={selectedCandidate} />
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