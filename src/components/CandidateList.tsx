// src/components/CandidateList.tsx
import { useState } from 'react';
import { Plus, Search, Calendar, Archive, UserCheck } from 'lucide-react';
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
    if (emails.length === 1) return; // Ít nhất phải có 1 email
    const newEmails = emails.filter((_, i) => i !== index);
    const newErrors = emailErrors.filter((_, i) => i !== index);
    setEmails(newEmails);
    setEmailErrors(newErrors);
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    
    // Clear error khi user đang nhập
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
        return <Badge className="bg-success-light text-success border-success/20">Hoàn thành</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning-light text-warning border-warning/20">Đang làm</Badge>;
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
      
      // Reset form
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
  

  return (
  <div className="space-y-6">
    {/* Dialog */}
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) {
        // Reset khi đóng dialog
        setEmails(['']);
        setEmailErrors(['']);
        setShowErrors(false);
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="space-y-3 sticky top-0 bg-background z-10 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            Mời ứng viên làm bài đánh giá
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Gửi link đánh giá năng lực đến các ứng viên qua email. Bạn có thể thêm nhiều email và tùy chỉnh lời nhắn.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Email Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Danh sách email ứng viên
              <span className="text-red-500">*</span>
            </Label>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {emails.map((email, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder={`Email ứng viên ${index + 1}...`}
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        onBlur={() => handleEmailBlur(index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={`transition-all duration-200 ${
                          showErrors && emailErrors[index] 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'focus:ring-primary/20'
                        }`}
                        disabled={isLoading}
                      />
                      {showErrors && emailErrors[index] && (
                        <p className="text-xs text-red-500 mt-1 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                          {emailErrors[index]}
                        </p>
                      )}
                    </div>
                    
                    {emails.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmail(index)}
                        disabled={isLoading}
                        className="px-3 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors duration-200"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={addEmail}
              disabled={isLoading}
              className="w-full border-dashed hover:bg-primary/5 hover:border-primary transition-all duration-200 group"
            >
              <Plus className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
              Thêm email 
            </Button>
            
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Đã thêm {emails.filter(email => email.trim()).length} email 
              {emails.filter(email => email.trim()).length !== [...new Set(emails.filter(email => email.trim()).map(e => e.toLowerCase()))].length && 
                <span className="text-amber-600 ml-1">(có trùng lặp)</span>
              }
            </p>
          </div>
          
          {/* Message Section */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Lời nhắn mời tham gia
            </Label>
            <Textarea
              id="message"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              className="min-h-[100px] resize-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              disabled={isLoading}
              placeholder="Nhập lời nhắn gửi đến ứng viên..."
            />
            <p className="text-xs text-muted-foreground">
              Lời nhắn này sẽ được gửi cùng với link đánh giá đến tất cả ứng viên
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center gap-3 pt-4 border-t sticky bottom-0 bg-background">
          <div className="text-sm text-muted-foreground">
            {emails.filter(email => email.trim()).length > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Sẵn sàng gửi đến {emails.filter(email => email.trim()).length} email
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
              className="hover:bg-muted/80 transition-colors duration-200"
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSendInvites}
              disabled={
                isLoading || 
                emails.filter(email => email.trim()).length === 0 ||
                hasDuplicateEmails() ||
                emails.some((email) => validateEmail(email))
              }
              className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang gửi...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Gửi lời mời ({emails.filter(email => email.trim()).length})
                </div>
              )}
            </Button>
          </div>
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
        onClick={() => {
          setIsDialogOpen(true);
        }}
        className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group"
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
      {/* Candidates Table */}
      <div className="lg:col-span-2">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-foreground">Ứng viên</th>
                  <th className="text-left p-4 font-semibold text-foreground">Vị trí</th>
                  <th className="text-left p-4 font-semibold text-foreground">Điểm tổng</th>
                  <th className="text-left p-4 font-semibold text-foreground">Trạng thái</th>
                  <th className="text-left p-4 font-semibold text-foreground">Ngày nộp</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`
                      border-b border-border cursor-pointer transition-all duration-200
                      ${selectedCandidate?.id === candidate.id 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'hover:bg-muted/30'
                      }
                    `}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center text-primary-foreground font-semibold shadow-lg">
                          {candidate.avatarChar}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{candidate.userName}</div>
                          <div className="text-sm text-muted-foreground">{candidate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="font-medium">
                        {candidate.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          {candidate.scores?.overall ?? 'N/A'}
                        </span>
                        {candidate.band && (
                          <Badge className={`${getBandColor(candidate.band)} bg-transparent border-0 p-0 text-base`}>
                            ({candidate.band})
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(candidate.status)}</td>
                    <td className="p-4 text-muted-foreground">
                      {candidate.startTime.toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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

//