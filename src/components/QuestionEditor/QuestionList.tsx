// src/components/QuestionList.tsx
import { useState } from 'react';
import { Plus, Edit3, Trash2, FileText, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { QuestionsByRole, Question } from '@/types/question';

// Định nghĩa types cho component
interface QuestionType {
  value: string;
  label: string;
  color: string;
}

interface QuestionListProps {
  questions: Question[];  
  selectedRole: string;
  roles: string[];
  setEditingQuestion: (question: Question) => void;
  setQuestions: (questions: QuestionsByRole | ((prev: QuestionsByRole) => QuestionsByRole)) => void;
  setIsCreating: (isCreating: boolean) => void;
  initialQuestionTypes: QuestionType[];
  handleStartCreate: () => void;
}

const QuestionList: React.FC<QuestionListProps> = ({ 
  questions, 
  selectedRole,
  setEditingQuestion,
  setQuestions,
  initialQuestionTypes,
  handleStartCreate
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  
  const getQuestionTypeInfo = (type) => {
    return initialQuestionTypes.find(t => t.value === type) || initialQuestionTypes[0];
  };

  const toggleExpanded = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };
  
  const duplicateQuestion = (question: Question) => {
    const duplicated: Question = { ...question, id: Date.now().toString(), text: `${question.text} (Bản sao)` };
    setQuestions((prev: QuestionsByRole): QuestionsByRole => ({
      ...prev,
      [selectedRole]: [...(prev[selectedRole] || []), duplicated]
    }));
    toast({ title: 'Thành công', description: 'Đã sao chép câu hỏi' });
  };
  
  const deleteQuestion = (questionId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      setQuestions((prev: QuestionsByRole): QuestionsByRole => ({
        ...prev,
        [selectedRole]: prev[selectedRole].filter(q => q.id !== questionId)
      }));
      toast({ title: 'Thành công', description: 'Đã xóa câu hỏi' });
    }
  };

  return (
    <>
      {questions.length > 0 ? (
        <div className="p-6 space-y-4">
          {questions.map((question, index) => {
            const typeInfo = getQuestionTypeInfo(question.type);
            const isExpanded = expandedQuestions.has(question.id);
            
            return (
              <Card key={question.id} className="overflow-hidden hover:shadow-md transition-all duration-200">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <Badge className={`${typeInfo.color} font-medium`}>
                        {typeInfo.label}
                      </Badge>
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
                      <Badge variant="outline" className="text-xs">
                        {question.points} điểm
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(question.id)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateQuestion(question)}
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
                        onClick={() => deleteQuestion(question.id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-gray-900 font-medium leading-relaxed mb-3">
                    {question.text}
                  </p>
                  {isExpanded && question.format === 'multiple_choice' && question.options && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">Các phương án trả lời:</p>
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              option.id === question.correctAnswer 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-white border-gray-200 text-gray-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              option.id === question.correctAnswer 
                                ? 'border-green-500 bg-green-500' 
                                : 'border-gray-300'
                            }`}>
                              {option.id === question.correctAnswer && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className="flex-1 font-medium">{option.text}</span>
                            {option.id === question.correctAnswer && (
                              <Badge className="bg-green-100 text-green-800 text-xs border-green-200">
                                Đáp án đúng
                              </Badge>
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