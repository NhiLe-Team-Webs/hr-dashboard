// src/components/RoleManager.tsx
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { QuestionsByRole } from '@/types/question';

// Định nghĩa types cho component

interface RoleManagerProps {
  roles: string[];
  questions: QuestionsByRole; // Sử dụng interface mới ở đây
  setRoles: (roles: string[]) => void;
  setQuestions: (questions: QuestionsByRole) => void;
  onClose: () => void;
}

const RoleManager: React.FC<RoleManagerProps> = ({ roles, questions, setRoles, setQuestions, onClose }) => {
  const [newRoleName, setNewRoleName] = useState('');

  const addRole = () => {
    if (!newRoleName.trim() || roles.includes(newRoleName.trim())) {
      toast({ title: 'Lỗi', description: 'Tên vị trí không hợp lệ hoặc đã tồn tại' });
      return;
    }
    const trimmedName = newRoleName.trim();
    setRoles([...roles, trimmedName]);
    setQuestions({ ...questions, [trimmedName]: [] });
    setNewRoleName('');
    toast({ title: 'Thành công', description: `Đã thêm vị trí "${trimmedName}"` });
  };

  const deleteRole = (role: string) => {
    if (confirm(`Xóa vị trí "${role}"? Tất cả câu hỏi sẽ bị xóa.`)) {
      setRoles(roles.filter(r => r !== role));
      const newQuestions = { ...questions };
      delete newQuestions[role];
      setQuestions(newQuestions);
      toast({ title: 'Thành công', description: 'Đã xóa vị trí và các câu hỏi liên quan' });
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Quản lý Vị trí</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {/* Add Role */}
        <div className="space-y-2">
          <Label>Thêm vị trí mới</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nhập tên vị trí..."
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
            <Button onClick={addRole} disabled={!newRoleName.trim()}>Thêm</Button>
          </div>
        </div>

        {/* List Roles */}
        <div>
          <Label>Danh sách vị trí</Label>
          <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
            {roles.map(role => (
              <div key={role} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{role} ({(questions[role] || []).length} câu hỏi)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRole(role)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Button onClick={onClose} className="mt-4">Đóng</Button>
    </DialogContent>
  );
};

export default RoleManager;