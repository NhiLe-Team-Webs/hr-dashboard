import { useState } from 'react';
import { Plus, Search, Calendar, Archive, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CandidateDetail } from '@/components/CandidateDetail';
import { mockCandidates, type Candidate } from '@/lib/mockData';

export const CandidateList = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    mockCandidates.length > 0 ? mockCandidates[0] : null
  );
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCandidates = mockCandidates.filter(candidate =>
    candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getBandColor = (band: string) => {
    switch (band) {
      case 'A':
        return 'text-success font-bold';
      case 'B':
        return 'text-info font-bold';
      case 'C':
        return 'text-warning font-bold';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Danh sách Ứng viên</h1>
          <p className="text-muted-foreground mt-1">Quản lý và đánh giá hồ sơ ứng viên</p>
        </div>
        <Button 
          onClick={() => {
            alert('Tính năng mời ứng viên sẽ được phát triển. Bạn có thể gửi link đánh giá qua email hoặc social media.');
          }}
          className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
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