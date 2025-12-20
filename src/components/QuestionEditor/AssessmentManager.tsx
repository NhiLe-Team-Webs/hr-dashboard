
import { useState, Dispatch, SetStateAction, useCallback, useEffect } from 'react';
import { Trash2, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { QuestionsByRole, RoleSummary } from '@/types/question';
import { createRole as apiCreateRole, deleteRole as apiDeleteRole, updateRoleDuration as apiUpdateRoleDuration } from '@/lib/api';

interface AssessmentManagerProps {
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

const AssessmentManager: React.FC<AssessmentManagerProps> = ({ roles, questions, setRoles, setQuestions, onClose }) => {
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
      setNewRoleDuration(String(DEFAULT_DURATION_MINUTES));
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
    <DialogContent className="max-w-lg w-full sm:max-w-md p-6 glass-panel border border-white/40 shadow-2xl backdrop-blur-xl">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Quản lý bài đánh giá</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
          <Label htmlFor="new-role" className="text-sm font-semibold text-blue-900">
            Thêm bài đánh giá mới
          </Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="new-role"
              placeholder="Nhập tên bài đánh giá..."
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addRole();
                }
              }}
              className="flex-1 bg-white/70 border-blue-200 focus-visible:ring-blue-500/20"
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
                className="w-24 bg-white/70 border-blue-200 focus-visible:ring-blue-500/20"
                aria-label="Thời lượng bài test (phút)"
              />
              <Button
                onClick={addRole}
                disabled={!newRoleName.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-blue-600/80 font-medium">
            Nhập thời lượng bài test theo phút (ví dụ: 30).
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Label className="text-sm font-semibold text-slate-700">Danh sách bài đánh giá</Label>
          <div className="border border-white/40 bg-white/30 rounded-xl max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent p-1">
            {roles.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-slate-300" />
                </div>
                <p>Chưa có vị trí nào.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {roles.map((role) => {
                  const inputValue = roleDurations[role.name] ?? '';
                  const parsedMinutes = Number(inputValue);
                  // Fix: Ensure we use number for comparison or correct logic
                  // const currentMinutes = toMinutes(role.duration); // already calculated in map
                  // Wait, I am replacing the whole logic. 
                  // Let's just trust I renamed the props and component name.
                  const currentMinutes = toMinutes(role.duration);
                  const isInvalid = !inputValue || !Number.isFinite(parsedMinutes) || parsedMinutes <= 0;
                  const isDirty = !isInvalid && parsedMinutes !== currentMinutes;

                  return (
                    <li
                      key={role.name}
                      className="p-3 rounded-lg hover:bg-white/60 transition-all border border-transparent hover:border-white/40 hover:shadow-sm space-y-3 group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            {role.name}
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-normal text-slate-500">
                              {(questions[role.name] || []).length} câu
                            </span>
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRole(role.name)}
                          className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            className="w-20 h-8 text-sm bg-white/50 border-slate-200"
                            aria-label={`Thời lượng mới cho ${role.name}`}
                          />
                          <span className="text-xs text-slate-500 font-medium">phút</span>
                        </div>
                        {isDirty && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveDuration(role.name)}
                            disabled={isInvalid}
                            className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          >
                            <Save className="w-3 h-3 mr-1.5" />
                            Lưu
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-white/20">
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng"
          >
            Đóng
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export default AssessmentManager;
