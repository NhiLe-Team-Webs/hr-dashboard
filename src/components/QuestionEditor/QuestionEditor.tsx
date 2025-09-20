// src/components/QuestionEditor.tsx
import { useState, useEffect } from 'react';
import { Plus, Settings } from 'lucide-react';
import { QuestionsByRole, Question, QuestionTypeInfo } from '@/types/question';
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

const initialQuestionTypes: QuestionTypeInfo[] = [
  { value: 'Work Sample', label: 'Mẫu công việc', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Problem Solving', label: 'Giải quyết vấn đề', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'Values & Reliability', label: 'Giá trị & Độ tin cậy', color: 'bg-green-50 text-green-700 border-green-200' }
];

const QuestionEditor = () => {
  const [questions, setQuestions] = useState<QuestionsByRole>({});
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [targetRoleForCreate, setTargetRoleForCreate] = useState('');

  // Tải danh sách vai trò khi component được mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await getRoles();
        setRoles(rolesData);
        if (rolesData.length > 0) {
          setSelectedRole(rolesData[0]);
        }
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách vị trí.',
          variant: 'destructive',
        });
      }
    };
    fetchRoles();
  }, [toast]);

  // Tải câu hỏi cho vai trò đã chọn
  useEffect(() => {
    if (selectedRole) {
      const fetchQuestions = async () => {
        try {
          const data = await getQuestionsByRole(selectedRole);
          setQuestions(prev => ({ ...prev, [selectedRole]: data }));
        } catch (error) {
          toast({
            title: 'Lỗi',
            description: 'Không thể tải câu hỏi.',
            variant: 'destructive',
          });
        }
      };
      fetchQuestions();
    }
  }, [selectedRole, toast]);

  const currentQuestions = questions[selectedRole] || [];

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
              <Button onClick={handleStartCreate} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Thêm câu hỏi mới
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(questions).reduce((total, roleQuestions) => total + roleQuestions.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Tổng câu hỏi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(questions).flat().filter(q => isTextFormat(q.format)).length}
              </div>
              <div className="text-sm text-gray-600">Tự luận</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(questions).flat().filter(q => isMultipleChoiceFormat(q.format)).length}
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
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role} ({(questions[role] || []).length} câu hỏi)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Modals and List */}
          <QuestionList
            questions={currentQuestions}
            selectedRole={selectedRole}
            roles={roles}
            setEditingQuestion={setEditingQuestion}
            setQuestions={handleSetQuestions}
            setIsCreating={setIsCreating}
            initialQuestionTypes={initialQuestionTypes}
            handleStartCreate={handleStartCreate}
          />
          
          {/* Create New Question Modal */}
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <QuestionForm
                currentQuestions={questions[targetRoleForCreate] || []}
                targetRole={targetRoleForCreate}
                roles={roles}
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
