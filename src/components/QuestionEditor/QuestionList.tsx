// src/components/QuestionEditor/QuestionList.tsx
import { useState, Dispatch, SetStateAction, useCallback } from 'react';
import { Plus, Edit3, Trash2, FileText, ChevronDown, ChevronUp, Copy, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { QuestionsByRole, Question } from '@/types/question';
import { deleteQuestion as apiDeleteQuestion } from '@/lib/api';

const isMultipleChoiceFormat = (format: Question['format']) => format === 'multiple_choice' || format === 'multiple-choice';

// Định nghĩa types cho component
interface QuestionListProps {
  questions: Question[];
  selectedRole: string;
  roles: string[];
  setEditingQuestion: (question: Question) => void;
  setQuestions: Dispatch<SetStateAction<QuestionsByRole>>;
  setIsCreating: (isCreating: boolean) => void;
  handleStartCreate: () => void;
  isLoading: boolean;
}

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  selectedRole,
  setEditingQuestion,
  setQuestions,
  handleStartCreate,
  roles,
  isLoading,
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState(new Set<string>());
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const toggleExpanded = useCallback((questionId: string) => {
    setExpandedQuestions(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(questionId)) {
        newExpanded.delete(questionId);
      } else {
        newExpanded.add(questionId);
      }
      return newExpanded;
    });
  }, []);

  const handleDuplicateQuestion = useCallback((question: Question) => {
    const duplicated = { ...question, id: Date.now().toString(), text: `${question.text} (Bản sao)` };
    setQuestions(prev => {
      const newQuestions = {
        ...prev,
        [selectedRole]: [...(prev[selectedRole] || []), duplicated]
      };
      return newQuestions;
    });
    toast({ title: 'Thành công', description: 'Đã sao chép câu hỏi' });
  }, [selectedRole, setQuestions, toast]);

  const handleDeleteQuestion = useCallback(async (questionId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      setDeletingQuestionId(questionId);
      try {
        // Only call API if it's a real backend ID (UUID)
        // Timestamp IDs (from duplication) are just local state
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId);

        if (isUuid) {
          await apiDeleteQuestion(questionId);
        }

        setQuestions(prev => {
          const newQuestions = {
            ...prev,
            [selectedRole]: prev[selectedRole].filter(q => q.id !== questionId)
          };
          return newQuestions;
        });
        toast({ title: 'Thành công', description: 'Đã xóa câu hỏi' });
      } catch (error) {
        console.error('Delete error:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể xóa câu hỏi.',
          variant: 'destructive',
        });
      } finally {
        setDeletingQuestionId(null);
      }
    }
  }, [selectedRole, setQuestions, toast]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="glass-panel border-white/60 rounded-[1.5rem] overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-8 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {questions.length > 0 ? (
        <div className="p-6 space-y-4">
          {questions.map((question, index) => {
            const isExpanded = expandedQuestions.has(question.id);

            return (
              <Card key={question.id} className="overflow-hidden bg-white/40 border-white/60 hover:bg-white/60 transition-all duration-300 shadow-sm hover:shadow-lg rounded-[1.5rem] group backdrop-blur-sm">
                <div className="p-5 border-b border-white/20 bg-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100/50 text-sm font-bold text-blue-700">#{index + 1}</span>
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        {question.format === 'text' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/50 text-purple-700">
                            <FileText className="w-4 h-4" />
                            <span>Tự luận</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-700">
                            <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                            </div>
                            <span>Trắc nghiệm</span>
                          </div>
                        )}
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/50 text-amber-700">
                          {question.duration ? `${Math.round(question.duration / 60)} phút` : '5 phút'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {isMultipleChoiceFormat(question.format) && question.options?.length ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(question.id)}
                          className="h-8 w-8 rounded-full hover:bg-white/60 hover:text-blue-600"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateQuestion(question)}
                        className="h-8 w-8 rounded-full hover:bg-white/60 hover:text-blue-600"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingQuestion(question)}
                        className="h-8 w-8 rounded-full hover:bg-white/60 hover:text-blue-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="h-8 w-8 rounded-full hover:bg-white/60 hover:text-red-600"
                        disabled={deletingQuestionId === question.id}
                      >
                        {deletingQuestionId === question.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-gray-900 font-medium leading-relaxed mb-3">
                    {question.text}
                  </p>
                  {isExpanded && isMultipleChoiceFormat(question.format) && question.options && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">Các phương án trả lời:</p>
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${option.isCorrect
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-white'
                              } text-gray-700`}
                          >
                            {option.isCorrect ? (
                              <div className="w-5 h-5 mt-0.5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-2 h-2 mt-2 rounded-full bg-gray-300"></div>
                            )}
                            <span className="flex-1 text-sm leading-relaxed">{option.text}</span>
                            {option.isCorrect && (
                              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-slate-200/60 rounded-[2rem] bg-white/30 backdrop-blur-sm mx-6 mb-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50/50 flex items-center justify-center">
            <FileText className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có câu hỏi nào</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto font-medium">
            Bắt đầu tạo câu hỏi đánh giá cho vị trí <span className="text-blue-600">{selectedRole}</span> để xây dựng bộ đề thi chuyên nghiệp
          </p>
          <Button onClick={handleStartCreate} className="rounded-xl shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base">
            <Plus className="w-5 h-5 mr-2" />
            Tạo câu hỏi đầu tiên
          </Button>
        </div>
      )}
    </>
  );
};

export default QuestionList;
