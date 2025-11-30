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

        console.log('DEBUG: QuestionEditor - Grouped questions:', grouped);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Câu hỏi Đánh giá</h1>
              <p className="text-gray-600 mt-1">Tạo và quản lý ngân hàng câu hỏi cho từng vị trí tuyển dụng</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={showRoleManager} onOpenChange={setShowRoleManager}>
                <DialogTrigger asChild>
                  <Button variant="outline">
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
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoadingRoles || isLoadingQuestions || !selectedRole}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm câu hỏi mới
              </Button>
            </div>
          </div>

          {/* Stats - Hiển thị thống kê cho vai trò hiện tại */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentQuestions.length}
              </div>
              <div className="text-sm text-gray-600">Tổng câu hỏi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {currentQuestions.filter(q => isTextFormat(q.format)).length}
              </div>
              <div className="text-sm text-gray-600">Tự luận</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentQuestions.filter(q => isMultipleChoiceFormat(q.format)).length}
              </div>
              <div className="text-sm text-gray-600">Trắc nghiệm</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{roles.length}</div>
              <div className="text-sm text-gray-600">Vị trí</div>
            </div>
          </div>
        </div>

        {/* Role Selection and Questions List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium text-gray-700">Chọn vị trí:</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    disabled={isLoadingRoles || roles.length === 0}
                  >
                    <SelectTrigger className="w-80" disabled={isLoadingRoles || roles.length === 0}>
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
