// src/components/RoleManager.tsx
import { useState, Dispatch, SetStateAction, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { QuestionsByRole } from '@/types/question';
import { createRole as apiCreateRole, deleteRole as apiDeleteRole } from '@/lib/api'; 

// Định nghĩa types cho component
interface RoleManagerProps {
  roles: string[];
  questions: QuestionsByRole;
  setRoles: Dispatch<SetStateAction<string[]>>;
  setQuestions: Dispatch<SetStateAction<QuestionsByRole>>;
  onClose: () => void;
}

const RoleManager: React.FC<RoleManagerProps> = ({ roles, questions, setRoles, setQuestions, onClose }) => {
  const [newRoleName, setNewRoleName] = useState('');

  const addRole = useCallback(async () => {
    if (!newRoleName.trim()) {
      toast({ title: 'Lỗi', description: 'Tên vị trí không được để trống.', variant: 'destructive' });
      return;
    }
    if (roles.includes(newRoleName.trim())) {
      toast({ title: 'Lỗi', description: 'Vị trí này đã tồn tại.', variant: 'destructive' });
      return;
    }

    const trimmedName = newRoleName.trim();
    
    try {
      await apiCreateRole(trimmedName);
      setRoles(prev => [...prev, trimmedName]);
      setQuestions(prev => ({ ...prev, [trimmedName]: [] }));
      setNewRoleName('');
      toast({ title: 'Thành công', description: `Đã thêm vị trí "${trimmedName}"` });
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể thêm vị trí mới. Vui lòng thử lại.', variant: 'destructive' });
      console.error(error);
    }
  }, [newRoleName, roles, setRoles, setQuestions, toast]);

  const deleteRole = useCallback(async (role: string) => {
    if (confirm(`Xóa vị trí "${role}"? Tất cả câu hỏi sẽ bị xóa.`)) {
      try {
        await apiDeleteRole(role);
        setRoles(prev => prev.filter(r => r !== role));
        setQuestions(prev => {
          const newQuestions = { ...prev };
          delete newQuestions[role];
          return newQuestions;
        });
        toast({ title: 'Thành công', description: 'Đã xóa vị trí và các câu hỏi liên quan' });
      } catch (error) {
        toast({ title: 'Lỗi', description: 'Không thể xóa vị trí. Vui lòng thử lại.', variant: 'destructive' });
        console.error(error);
      }
    }
  }, [setRoles, setQuestions, toast]);

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
              onKeyDown={(e) => { if (e.key === 'Enter') addRole(); }}
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