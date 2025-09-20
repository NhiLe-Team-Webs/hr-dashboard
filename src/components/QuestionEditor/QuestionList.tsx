// src/components/QuestionEditor/QuestionList.tsx
import { useState, Dispatch, SetStateAction, useCallback } from 'react';
import { Plus, Edit3, Trash2, FileText, ChevronDown, ChevronUp, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        await apiDeleteQuestion(questionId);
        setQuestions(prev => {
          const newQuestions = {
            ...prev,
            [selectedRole]: prev[selectedRole].filter(q => q.id !== questionId)
          };
          return newQuestions;
        });
        toast({ title: 'Thành công', description: 'Đã xóa câu hỏi' });
      } catch (error) {
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
          <Card key={index} className="overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-10 rounded bg-gray-200" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="h-4 w-20 rounded bg-gray-200" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-gray-200" />
                  <div className="h-8 w-8 rounded bg-gray-200" />
                  <div className="h-8 w-8 rounded bg-gray-200" />
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse mb-3" />
              <div className="h-4 w-1/2 rounded bg-gray-100 animate-pulse" />
            </div>
          </Card>
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
              <Card key={question.id} className="overflow-hidden hover:shadow-md transition-all duration-200">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        {question.format === 'text' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                          </div>
                        )}
                        <span>{question.format === 'text' ? 'Tự luận' : 'Trắc nghiệm'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isMultipleChoiceFormat(question.format) && question.options?.length ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(question.id)}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateQuestion(question)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingQuestion(question)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-gray-500 hover:text-red-600"
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
                            className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white text-gray-700"
                          >
                            <div className="w-2 h-2 mt-2 rounded-full bg-gray-300"></div>
                            <span className="flex-1 text-sm leading-relaxed">{option.text}</span>
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
        <div className="p-12 text-center border-2 border-dashed border-gray-200">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có câu hỏi nào</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Bắt đầu tạo câu hỏi đánh giá cho vị trí <strong>{selectedRole}</strong> để xây dựng bộ đề thi chuyên nghiệp
          </p>
          <Button onClick={handleStartCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Tạo câu hỏi đầu tiên
          </Button>
        </div>
      )}
    </>
  );
};

export default QuestionList;
