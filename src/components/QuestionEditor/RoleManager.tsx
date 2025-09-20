import { useState, Dispatch, SetStateAction, useCallback } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { QuestionsByRole } from '@/types/question';
import { createRole as apiCreateRole, deleteRole as apiDeleteRole } from '@/lib/api';

// Define types for the component
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
      setRoles((prev) => [...prev, trimmedName]);
      setQuestions((prev) => ({ ...prev, [trimmedName]: [] }));
      setNewRoleName('');
      toast({ title: 'Thành công', description: `Đã thêm vị trí "${trimmedName}"` });
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể thêm vị trí mới. Vui lòng thử lại.', variant: 'destructive' });
      console.error(error);
    }
  }, [newRoleName, roles, setRoles, setQuestions]);

  const deleteRole = useCallback(async (role: string) => {
    if (confirm(`Xóa vị trí "${role}"? Tất cả câu hỏi sẽ bị xóa.`)) {
      try {
        await apiDeleteRole(role);
        setRoles((prev) => prev.filter((r) => r !== role));
        setQuestions((prev) => {
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
  }, [setRoles, setQuestions]);

  return (
    <DialogContent className="max-w-lg w-full sm:max-w-md p-6">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-lg font-semibold text-gray-800">Quản lý Vị trí</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-6">
        {/* Add Role Section */}
        <div className="flex flex-col gap-3">
          <Label htmlFor="new-role" className="text-sm font-medium text-gray-700">
            Thêm vị trí mới
          </Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="new-role"
              placeholder="Nhập tên vị trí..."
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addRole();
              }}
              className="flex-1"
              aria-label="Tên vị trí mới"
            />
            <Button
              onClick={addRole}
              disabled={!newRoleName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white sm:w-auto w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm
            </Button>
          </div>
        </div>

        {/* Role List Section */}
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-medium text-gray-700">Danh sách vị trí</Label>
          <div className="border border-gray-200 rounded-lg max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {roles.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Chưa có vị trí nào.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <li
                    key={role}
                    className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-800">
                      {role} ({(questions[role] || []).length} câu hỏi)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRole(role)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={`Xóa vị trí ${role}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            aria-label="Đóng"
          >
            Đóng
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export default RoleManager;