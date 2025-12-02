
import { useState, Dispatch, SetStateAction, useCallback, useEffect } from 'react';
import { Trash2, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { QuestionsByRole, RoleSummary } from '@/types/question';
import { createRole as apiCreateRole, deleteRole as apiDeleteRole, updateRoleDuration as apiUpdateRoleDuration } from '@/lib/api';

interface RoleManagerProps {
  roles: RoleSummary[];
  questions: QuestionsByRole;
  setRoles: Dispatch<SetStateAction<RoleSummary[]>>;
  setQuestions: Dispatch<SetStateAction<QuestionsByRole>>;
  onClose: () => void;
}

const DEFAULT_DURATION_MINUTES = 30;

const toMinutes = (seconds?: number) => {
  if (!seconds || seconds <= 0) {
    return DEFAULT_DURATION_MINUTES;
  }
  return Math.max(1, Math.round(seconds / 60));
};

const RoleManager: React.FC<RoleManagerProps> = ({ roles, questions, setRoles, setQuestions, onClose }) => {
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDuration, setNewRoleDuration] = useState(String(DEFAULT_DURATION_MINUTES));
  const [roleDurations, setRoleDurations] = useState<Record<string, string>>({});

  useEffect(() => {
    const durationsMap: Record<string, string> = {};
    roles.forEach((role) => {
      durationsMap[role.name] = String(toMinutes(role.duration));
    });
    setRoleDurations(durationsMap);
  }, [roles]);

  const addRole = useCallback(async () => {
    const trimmedName = newRoleName.trim();
    if (!trimmedName) {
      toast({ title: 'Lỗi', description: 'Tên vị trí không được để trống.', variant: 'destructive' });
      return;
    }

    if (roles.some((role) => role.name === trimmedName)) {
      toast({ title: 'Lỗi', description: 'Vị trí này đã tồn tại.', variant: 'destructive' });
      return;
    }

    const parsedMinutes = Number(newRoleDuration);
    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
      toast({ title: 'Lỗi', description: 'Thời lượng phải là số phút hợp lệ (> 0).', variant: 'destructive' });
      return;
    }

    // Convert minutes to seconds for API
    const durationSeconds = Math.round(parsedMinutes * 60);

    try {
      const createdRole = await apiCreateRole(trimmedName, durationSeconds);
      setRoles((prev) => [...prev, createdRole]);
      setQuestions((prev) => ({ ...prev, [trimmedName]: [] }));
      setNewRoleName('');
      setNewRoleDuration(String(DEFAULT_DURATION_MINUTES));
      setRoleDurations((prev) => ({ ...prev, [createdRole.name]: String(parsedMinutes) }));
      toast({ title: 'Thành công', description: `Đã thêm vị trí "${trimmedName}"` });
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể thêm vị trí mới. Vui lòng thử lại.', variant: 'destructive' });
      console.error(error);
    }
  }, [newRoleName, newRoleDuration, roles, setRoles, setQuestions]);

  const deleteRole = useCallback(async (roleName: string) => {
    if (confirm(`Xóa vị trí "${roleName}"? Tất cả câu hỏi sẽ bị xóa.`)) {
      try {
        await apiDeleteRole(roleName);
        setRoles((prev) => prev.filter((role) => role.name !== roleName));
        setQuestions((prev) => {
          const newQuestions = { ...prev };
          delete newQuestions[roleName];
          return newQuestions;
        });
        setRoleDurations((prev) => {
          const updated = { ...prev };
          delete updated[roleName];
          return updated;
        });
        toast({ title: 'Thành công', description: 'Đã xóa vị trí và các câu hỏi liên quan' });
      } catch (error: any) {
        const errorMessage = error?.message || 'Không thể xóa vị trí. Vui lòng thử lại.';
        toast({ 
          title: 'Lỗi', 
          description: errorMessage, 
          variant: 'destructive',
          duration: 5000 
        });
        console.error(error);
      }
    }
  }, [setRoles, setQuestions]);

  const handleDurationInputChange = useCallback((roleName: string, value: string) => {
    setRoleDurations((prev) => ({ ...prev, [roleName]: value }));
  }, []);

  const handleSaveDuration = useCallback(async (roleName: string) => {
    const rawValue = roleDurations[roleName];
    const parsedMinutes = Number(rawValue);

    if (!rawValue || !Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
      toast({ title: 'Lỗi', description: 'Thời lượng phải là số phút hợp lệ (> 0).', variant: 'destructive' });
      return;
    }

    // Convert minutes to seconds for API
    const durationSeconds = Math.round(parsedMinutes * 60);

    try {
      await apiUpdateRoleDuration(roleName, durationSeconds);
      setRoles((prev) => prev.map((role) => (
        role.name === roleName
          ? { ...role, duration: durationSeconds }
          : role
      )));
      toast({ title: 'Thành công', description: `Đã cập nhật thời lượng cho "${roleName}"` });
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật thời lượng. Vui lòng thử lại.', variant: 'destructive' });
      console.error(error);
    }
  }, [roleDurations, setRoles]);

  return (
    <DialogContent className="max-w-lg w-full sm:max-w-md p-6">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-lg font-semibold text-gray-800">Quản lý Vị trí</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
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
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addRole();
                }
              }}
              className="flex-1"
              aria-label="Tên vị trí mới"
            />
            <div className="flex gap-2">
              <Input
                id="new-role-duration"
                type="number"
                min={1}
                placeholder="Phút"
                value={newRoleDuration}
                onChange={(e) => setNewRoleDuration(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRole();
                  }
                }}
                className="w-24"
                aria-label="Thời lượng bài test (phút)"
              />
              <Button
                onClick={addRole}
                disabled={!newRoleName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Nhập thời lượng bài test theo phút (ví dụ: 30).
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Label className="text-sm font-medium text-gray-700">Danh sách vị trí</Label>
          <div className="border border-gray-200 rounded-lg max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {roles.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Chưa có vị trí nào.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {roles.map((role) => {
                  const inputValue = roleDurations[role.name] ?? '';
                  const parsedMinutes = Number(inputValue);
                  const currentMinutes = toMinutes(role.duration);
                  const isInvalid = !inputValue || !Number.isFinite(parsedMinutes) || parsedMinutes <= 0;
                  const isDirty = !isInvalid && parsedMinutes !== currentMinutes;

                  return (
                    <li
                      key={role.name}
                      className="p-4 hover:bg-gray-50 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-sm font-medium text-gray-800">
                            {role.name} ({(questions[role.name] || []).length} câu hỏi)
                          </span>
                          <p className="text-xs text-gray-500">Thời lượng hiện tại: {currentMinutes} phút</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRole(role.name)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Xóa vị trí ${role.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={inputValue}
                            onChange={(e) => handleDurationInputChange(role.name, e.target.value)}
                            className="w-24"
                            aria-label={`Thời lượng mới cho ${role.name}`}
                          />
                          <span className="text-sm text-gray-500">phút</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveDuration(role.name)}
                          disabled={isInvalid || !isDirty}
                          className="sm:w-auto w-full"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Lưu thời lượng
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

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
