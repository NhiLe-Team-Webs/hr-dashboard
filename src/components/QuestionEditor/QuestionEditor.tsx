// src/components/QuestionEditor.tsx
import { useState, useEffect } from 'react';
import { Plus, Settings, Loader2 } from 'lucide-react';
import { QuestionsByRole, Question, RoleSummary } from '@/types/question';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { createQuestion, updateQuestion, getQuestionsByRole, getRoles } from '@/lib/api';
import type { QuestionDraft } from '@/lib/api';

// Import các components con
import QuestionList from '@/components/QuestionEditor/QuestionList';
import QuestionForm from '@/components/QuestionEditor/QuestionForm';
import RoleManager from '@/components/QuestionEditor/RoleManager';

const isMultipleChoiceFormat = (format: Question['format']) => format === 'multiple_choice' || format === 'multiple-choice';
const isTextFormat = (format: Question['format']) => format === 'text';
const QuestionEditor = () => {

  const [questions, setQuestions] = useState<QuestionsByRole>({});
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [targetRoleForCreate, setTargetRoleForCreate] = useState('');
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Tải danh sách vai trò khi component được mount
  useEffect(() => {
    let isMounted = true;

    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      try {
        console.log('DEBUG: QuestionEditor - Fetching roles...');
        const rolesData = await getRoles();
        console.log('DEBUG: QuestionEditor - Received rolesData:', rolesData);
        console.log('DEBUG: QuestionEditor - rolesData type:', typeof rolesData);
        console.log('DEBUG: QuestionEditor - rolesData is array:', Array.isArray(rolesData));

        if (!isMounted) {
          return;
        }

        setRoles(rolesData);
        setSelectedRole((prev) => {
          console.log('DEBUG: QuestionEditor - Setting selected role. prev:', prev, 'rolesData:', rolesData);
          if (prev && rolesData && rolesData.some((role) => role.name === prev)) {
            return prev;
          }
          console.log('DEBUG: QuestionEditor - Accessing rolesData[0]:', rolesData ? rolesData[0] : 'rolesData is null/undefined');
          return rolesData && rolesData[0] ? rolesData[0].name : '';
        });
      } catch (error) {
        console.error('DEBUG: QuestionEditor - Error fetching roles:', error);
        if (isMounted) {
          toast({
            title: 'Lỗi',
            description: 'Không thể tải danh sách vị trí.',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    };

    fetchRoles();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Tải tất cả câu hỏi khi component được mount
  useEffect(() => {
    let isMounted = true;

    const fetchAllQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        console.log('DEBUG: QuestionEditor - Fetching all questions...');
        const allQuestions = await getQuestionsByRole(); // Fetch all

        if (!isMounted) {
          return;
        }

        // Group questions by role
        const grouped: QuestionsByRole = {};
        allQuestions.forEach((q) => {
          const role = q.role || 'unknown';
          if (!grouped[role]) {
            grouped[role] = [];
          }
          grouped[role].push(q);
        });

        setQuestions(grouped);
      } catch (error) {
        console.error('DEBUG: QuestionEditor - Error fetching questions:', error);
        if (isMounted) {
          toast({
            title: 'Lỗi',
            description: 'Không thể tải danh sách câu hỏi.',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingQuestions(false);
        }
      }
    };

    fetchAllQuestions();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const currentQuestions = questions[selectedRole] || [];
  const roleNames = roles.map((role) => role.name);

  useEffect(() => {
    if (roles.length === 0) {
      if (selectedRole) {
        setSelectedRole('');
      }
      return;
    }

    if (!selectedRole || !roles.some((role) => role.name === selectedRole)) {
      setSelectedRole(roles[0]?.name ?? '');
    }
  }, [roles, selectedRole]);

  const handleCreateQuestion = (newQuestion: Question, role: string) => {
    setQuestions((prev) => ({
      ...prev,
      [role]: [...(prev[role] || []), newQuestion],
    }));
    setIsCreating(false);
    setTargetRoleForCreate('');
    toast({ title: 'Thành công', description: 'Đã thêm câu hỏi mới' });
  };

  const handleUpdateQuestion = (data: Question) => {
    setQuestions((prev) => ({
      ...prev,
      [selectedRole]: prev[selectedRole].map((q) => (q.id === data.id ? data : q)),
    }));
    setEditingQuestion(null);
    toast({ title: 'Thành công', description: 'Đã cập nhật câu hỏi' });
  };

  const handleStartCreate = () => {
    setTargetRoleForCreate(selectedRole);
    setIsCreating(true);
  };

  const handleSetQuestions = (newQuestions: QuestionsByRole) => {
    setQuestions(newQuestions);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="glass-panel border border-white/40 rounded-[2rem] shadow-xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Quản lý Câu hỏi</h1>
                <p className="text-muted-foreground mt-1">Tạo và quản lý ngân hàng câu hỏi cho từng vị trí tuyển dụng</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Dialog open={showRoleManager} onOpenChange={setShowRoleManager}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="glass-button rounded-xl border-white/40 hover:bg-white/60">
                      <Settings className="w-4 h-4 mr-2" />
                      Quản lý vị trí
                    </Button>
                  </DialogTrigger>
                  <RoleManager
                    roles={roles}
                    questions={questions}
                    setRoles={setRoles}
                    setQuestions={handleSetQuestions}
                    onClose={() => setShowRoleManager(false)}
                  />
                </Dialog>
                <Button
                  onClick={handleStartCreate}
                  className="rounded-xl shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 border-0"
                  disabled={isLoadingRoles || isLoadingQuestions || !selectedRole}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm câu hỏi mới
                </Button>
              </div>
            </div>

            {/* Stats - Hiển thị thống kê cho vai trò hiện tại */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-200/60">
              <div className="text-center p-4 rounded-2xl bg-white/40 border border-white/40 shadow-sm">
                <div className="text-3xl font-bold text-blue-600">
                  {currentQuestions.length}
                </div>
                <div className="text-sm text-slate-600 font-medium">Tổng câu hỏi</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/40 border border-white/40 shadow-sm">
                <div className="text-3xl font-bold text-purple-600">
                  {currentQuestions.filter(q => isTextFormat(q.format)).length}
                </div>
                <div className="text-sm text-slate-600 font-medium">Tự luận</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/40 border border-white/40 shadow-sm">
                <div className="text-3xl font-bold text-green-600">
                  {currentQuestions.filter(q => isMultipleChoiceFormat(q.format)).length}
                </div>
                <div className="text-sm text-slate-600 font-medium">Trắc nghiệm</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/40 border border-white/40 shadow-sm">
                <div className="text-3xl font-bold text-orange-600">{roles.length}</div>
                <div className="text-sm text-slate-600 font-medium">Vị trí</div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Selection and Questions List */}
        <div className="glass-panel border border-white/40 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/20 bg-white/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-bold text-slate-700">Chọn vị trí:</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    disabled={isLoadingRoles || roles.length === 0}
                  >
                    <SelectTrigger className="w-80 h-11 rounded-xl bg-white/50 border-white/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium" disabled={isLoadingRoles || roles.length === 0}>
                      <SelectValue placeholder={isLoadingRoles ? 'Đang tải vai trò...' : 'Chọn vai trò...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => {
                        const questionCount = (questions[role.name] || []).length;
                        const minutes = role.duration ? Math.max(1, Math.round(role.duration / 60)) : 30;
                        return (
                          <SelectItem key={role.name} value={role.name}>
                            {role.name} ({questionCount} câu hỏi · {minutes} phút)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {isLoadingRoles && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                </div>
              </div>
            </div>
          </div>

          {/* Modals and List */}
          <QuestionList
            questions={currentQuestions}
            selectedRole={selectedRole}
            roles={roleNames}
            setEditingQuestion={setEditingQuestion}
            setQuestions={handleSetQuestions}
            setIsCreating={setIsCreating}
            handleStartCreate={handleStartCreate}
            isLoading={isLoadingQuestions}
          />

          {/* Create New Question Modal */}
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <QuestionForm
                currentQuestions={questions[targetRoleForCreate] || []}
                targetRole={targetRoleForCreate}
                roles={roleNames}
                setTargetRole={setTargetRoleForCreate}
                onSubmit={handleCreateQuestion}
                onCancel={() => {
                  setIsCreating(false);
                  setTargetRoleForCreate('');
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Question Modal */}
          <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <QuestionForm
                question={editingQuestion}
                currentQuestions={currentQuestions}
                isEdit={true}
                onSubmit={handleUpdateQuestion}
                onCancel={() => setEditingQuestion(null)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
