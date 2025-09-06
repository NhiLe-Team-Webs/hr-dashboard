import { useState } from 'react';
import { Plus, Edit3, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockQuestions, type Question } from '@/lib/mockData';

export const QuestionEditor = () => {
  const [questions, setQuestions] = useState(mockQuestions);
  const [selectedRole, setSelectedRole] = useState('Content Creator');

  const roles = Object.keys(questions);
  const currentQuestions = questions[selectedRole] || [];

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'Work Sample':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Problem Solving':
        return 'bg-info/10 text-info border-info/20';
      case 'Values & Reliability':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'multiple_choice':
        return <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
        </div>;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Câu hỏi Đánh giá</h1>
          <p className="text-muted-foreground mt-1">Tùy chỉnh và quản lý ngân hàng câu hỏi theo vị trí</p>
        </div>
        <Button 
          onClick={() => {
            alert('Tính năng thêm câu hỏi mới sẽ được phát triển. Bạn có thể liên hệ admin để thêm câu hỏi.');
          }}
          className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm câu hỏi mới
        </Button>
      </div>

      {/* Role Tabs */}
      <Card className="p-6">
        <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {roles.map((role) => (
              <TabsTrigger 
                key={role} 
                value={role}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {role}
              </TabsTrigger>
            ))}
          </TabsList>

          {roles.map((role) => (
            <TabsContent key={role} value={role} className="space-y-4">
              {currentQuestions.length > 0 ? (
                currentQuestions.map((question) => (
                  <Card key={question.id} className="p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Question Header */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={`font-semibold ${getQuestionTypeColor(question.type)}`}>
                            {question.type}
                          </Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {getFormatIcon(question.format)}
                            <span className="text-sm font-medium capitalize">
                              {question.format === 'text' ? 'Tự luận' : 'Trắc nghiệm'}
                            </span>
                          </div>
                        </div>

                        {/* Question Text */}
                        <p className="text-foreground leading-relaxed">{question.text}</p>

                        {/* Multiple Choice Options */}
                        {question.format === 'multiple_choice' && question.options && (
                          <div className="mt-4 pl-4 border-l-2 border-muted">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Các phương án trả lời:</p>
                            <ul className="space-y-2">
                              {question.options.map((option) => (
                                <li 
                                  key={option.id}
                                  className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                                    option.id === question.correctAnswer 
                                      ? 'bg-success/10 text-success font-semibold border border-success/20' 
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  <div className="w-2 h-2 rounded-full bg-current flex-shrink-0"></div>
                                  <span className="flex-1">{option.text}</span>
                                  {option.id === question.correctAnswer && (
                                    <Badge className="bg-success text-success-foreground text-xs">
                                      Đáp án đúng
                                    </Badge>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Chưa có câu hỏi nào</h3>
                  <p className="text-muted-foreground mb-6">
                    Bắt đầu tạo câu hỏi đánh giá cho vị trí {role}
                  </p>
                  <Button className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo câu hỏi đầu tiên
                  </Button>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Question Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Tổng số câu hỏi</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {Object.values(questions).reduce((total, roleQuestions) => total + roleQuestions.length, 0)}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Câu hỏi tự luận</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {Object.values(questions).flat().filter(q => q.format === 'text').length}
              </p>
            </div>
            <div className="p-3 bg-info/10 rounded-xl">
              <Edit3 className="w-6 h-6 text-info" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Câu hỏi trắc nghiệm</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {Object.values(questions).flat().filter(q => q.format === 'multiple_choice').length}
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-xl">
              <div className="w-6 h-6 text-success border-2 border-current rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-current rounded-full"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuestionEditor;