import { useState } from 'react';
import { Plus, Edit3, Trash2, FileText, Check, X, Move, Copy, Settings, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data
const mockQuestions = {
  'Content Creator': [
    {
      id: '1',
      text: 'Mô tả quy trình sáng tạo nội dung của bạn từ ý tưởng đến sản phẩm hoàn thiện',
      type: 'Work Sample',
      format: 'text',
      required: true,
      points: 10
    },
    {
      id: '2',
      text: 'Công cụ nào bạn thường sử dụng để tạo nội dung visual?',
      type: 'Problem Solving',
      format: 'multiple_choice',
      required: true,
      points: 5,
      options: [
        { id: 'a', text: 'Adobe Creative Suite' },
        { id: 'b', text: 'Canva' },
        { id: 'c', text: 'Figma' },
        { id: 'd', text: 'Tất cả các công cụ trên' }
      ],
      correctAnswer: 'd'
    }
  ],
  'Marketing Manager': [
    {
      id: '3',
      text: 'Phân tích một chiến dịch marketing thành công mà bạn từng thực hiện',
      type: 'Work Sample',
      format: 'text',
      required: true,
      points: 15
    }
  ],
  'Software Engineer': [
    {
      id: '4',
      text: 'Giải thích khái niệm Big O notation và tại sao nó quan trọng',
      type: 'Problem Solving',
      format: 'text',
      required: true,
      points: 10
    }
  ]
};

const QuestionEditor = () => {
  const [questions, setQuestions] = useState(mockQuestions);
  const [selectedRole, setSelectedRole] = useState('Content Creator');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  
  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'Work Sample',
    format: 'text',
    required: true,
    points: 5,
    options: [{ id: 'a', text: '' }, { id: 'b', text: '' }],
    correctAnswer: 'a'
  });

  const roles = Object.keys(questions);
  const currentQuestions = questions[selectedRole] || [];

  const questionTypes = [
    { value: 'Work Sample', label: 'Mẫu công việc', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'Problem Solving', label: 'Giải quyết vấn đề', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { value: 'Values & Reliability', label: 'Giá trị & Độ tin cậy', color: 'bg-green-50 text-green-700 border-green-200' }
  ];

  const getQuestionTypeInfo = (type) => {
    return questionTypes.find(t => t.value === type) || questionTypes[0];
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

  const handleCreateQuestion = () => {
    if (!newQuestion.text.trim()) return;

    const questionId = Date.now().toString();
    const questionToAdd = {
      ...newQuestion,
      id: questionId,
      options: newQuestion.format === 'multiple_choice' ? newQuestion.options.filter(opt => opt.text.trim()) : undefined
    };

    setQuestions(prev => ({
      ...prev,
      [selectedRole]: [...(prev[selectedRole] || []), questionToAdd]
    }));

    // Reset form
    setNewQuestion({
      text: '',
      type: 'Work Sample',
      format: 'text',
      required: true,
      points: 5,
      options: [{ id: 'a', text: '' }, { id: 'b', text: '' }],
      correctAnswer: 'a'
    });
    setIsCreating(false);
  };

  const handleAddOption = () => {
    const nextId = String.fromCharCode(97 + newQuestion.options.length); // a, b, c, d...
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, { id: nextId, text: '' }]
    }));
  };

  const handleRemoveOption = (optionId) => {
    if (newQuestion.options.length <= 2) return;
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== optionId)
    }));
  };

  const handleOptionChange = (optionId, value) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map(opt => 
        opt.id === optionId ? { ...opt, text: value } : opt
      )
    }));
  };

  const duplicateQuestion = (question) => {
    const duplicated = {
      ...question,
      id: Date.now().toString(),
      text: `${question.text} (Bản sao)`
    };
    setQuestions(prev => ({
      ...prev,
      [selectedRole]: [...(prev[selectedRole] || []), duplicated]
    }));
  };

  const deleteQuestion = (questionId) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      setQuestions(prev => ({
        ...prev,
        [selectedRole]: prev[selectedRole].filter(q => q.id !== questionId)
      }));
    }
  };

  const handleEditQuestion = (questionId) => {
    const question = questions[selectedRole].find(q => q.id === questionId);
    if (question) {
      setEditingQuestion({
        ...question,
        options: question.format === 'multiple_choice' ? [...question.options] : [{ id: 'a', text: '' }, { id: 'b', text: '' }]
      });
      setEditingId(questionId);
    }
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion?.text.trim()) return;

    setQuestions(prev => ({
      ...prev,
      [selectedRole]: prev[selectedRole].map(q => 
        q.id === editingId ? {
          ...editingQuestion,
          options: editingQuestion.format === 'multiple_choice' ? editingQuestion.options.filter(opt => opt.text.trim()) : undefined
        } : q
      )
    }));

    setEditingQuestion(null);
    setEditingId(null);
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
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm câu hỏi mới
            </Button>
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
                {Object.values(questions).flat().filter(q => q.format === 'text').length}
              </div>
              <div className="text-sm text-gray-600">Tự luận</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(questions).flat().filter(q => q.format === 'multiple_choice').length}
              </div>
              <div className="text-sm text-gray-600">Trắc nghiệm</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{roles.length}</div>
              <div className="text-sm text-gray-600">Vị trí</div>
            </div>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full">
            <div className="border-b border-gray-100">
              <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-none h-12">
                {roles.map((role) => (
                  <TabsTrigger 
                    key={role} 
                    value={role}
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
                  >
                    <span className="font-medium">{role}</span>
                    <Badge className="ml-2 bg-gray-200 text-gray-700 text-xs">
                      {(questions[role] || []).length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {roles.map((role) => (
              <TabsContent key={role} value={role} className="p-6 space-y-4 mt-0">
                {/* Create New Question Form */}
                {isCreating && (
                  <Card className="p-6 border-2 border-blue-200 bg-blue-50/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Tạo câu hỏi mới</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreating(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* Question Text */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nội dung câu hỏi *
                        </label>
                        <Textarea
                          placeholder="Nhập nội dung câu hỏi..."
                          value={newQuestion.text}
                          onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                          className="min-h-[80px] resize-none"
                        />
                      </div>

                      {/* Question Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Loại câu hỏi</label>
                          <Select value={newQuestion.type} onValueChange={(value) => setNewQuestion(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Định dạng</label>
                          <Select value={newQuestion.format} onValueChange={(value) => setNewQuestion(prev => ({ ...prev, format: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Tự luận</SelectItem>
                              <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Điểm số</label>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            value={newQuestion.points}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 5 }))}
                          />
                        </div>
                      </div>

                      {/* Multiple Choice Options */}
                      {newQuestion.format === 'multiple_choice' && (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">Các phương án trả lời</label>
                          {newQuestion.options.map((option, index) => (
                            <div key={option.id} className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={newQuestion.correctAnswer === option.id}
                                onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswer: option.id }))}
                                className="text-blue-600"
                              />
                              <div className="flex-1">
                                <Input
                                  placeholder={`Phương án ${option.id.toUpperCase()}`}
                                  value={option.text}
                                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                />
                              </div>
                              {newQuestion.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOption(option.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {newQuestion.options.length < 6 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddOption}
                              className="mt-2"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Thêm phương án
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreating(false)}
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleCreateQuestion}
                          disabled={!newQuestion.text.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Tạo câu hỏi
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Edit Question Form */}
                {editingId && editingQuestion && (
                  <Card className="p-6 border-2 border-yellow-200 bg-yellow-50/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa câu hỏi</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditingQuestion(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* Question Text */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nội dung câu hỏi *
                        </label>
                        <Textarea
                          placeholder="Nhập nội dung câu hỏi..."
                          value={editingQuestion.text}
                          onChange={(e) => setEditingQuestion(prev => ({ ...prev, text: e.target.value }))}
                          className="min-h-[80px] resize-none"
                        />
                      </div>

                      {/* Question Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Loại câu hỏi</label>
                          <Select 
                            value={editingQuestion.type} 
                            onValueChange={(value) => setEditingQuestion(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Định dạng</label>
                          <Select 
                            value={editingQuestion.format} 
                            onValueChange={(value) => setEditingQuestion(prev => ({ ...prev, format: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Tự luận</SelectItem>
                              <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Điểm số</label>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            value={editingQuestion.points}
                            onChange={(e) => setEditingQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 5 }))}
                          />
                        </div>
                      </div>

                      {/* Multiple Choice Options */}
                      {editingQuestion.format === 'multiple_choice' && (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">Các phương án trả lời</label>
                          {editingQuestion.options.map((option, index) => (
                            <div key={option.id} className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="editCorrectAnswer"
                                checked={editingQuestion.correctAnswer === option.id}
                                onChange={() => setEditingQuestion(prev => ({ ...prev, correctAnswer: option.id }))}
                                className="text-blue-600"
                              />
                              <div className="flex-1">
                                <Input
                                  placeholder={`Phương án ${option.id.toUpperCase()}`}
                                  value={option.text}
                                  onChange={(e) => {
                                    const newOptions = [...editingQuestion.options];
                                    newOptions[index] = { ...option, text: e.target.value };
                                    setEditingQuestion(prev => ({ ...prev, options: newOptions }));
                                  }}
                                />
                              </div>
                              {editingQuestion.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (editingQuestion.options.length <= 2) return;
                                    const newOptions = editingQuestion.options.filter(opt => opt.id !== option.id);
                                    setEditingQuestion(prev => ({ ...prev, options: newOptions }));
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {editingQuestion.options.length < 6 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const nextId = String.fromCharCode(97 + editingQuestion.options.length);
                                setEditingQuestion(prev => ({
                                  ...prev,
                                  options: [...prev.options, { id: nextId, text: '' }]
                                }));
                              }}
                              className="mt-2"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Thêm phương án
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditingQuestion(null);
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleUpdateQuestion}
                          disabled={!editingQuestion.text.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Cập nhật
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Questions List */}
                {currentQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {currentQuestions.map((question, index) => {
                      const typeInfo = getQuestionTypeInfo(question.type);
                      const isExpanded = expandedQuestions.has(question.id);
                      
                      return (
                        <Card key={question.id} className="overflow-hidden hover:shadow-md transition-all duration-200">
                          {/* Question Header */}
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
                                  onClick={() => duplicateQuestion(question)}
                                  className="text-gray-500 hover:text-blue-600"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditQuestion(question.id)}
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

                          {/* Question Content */}
                          <div className="p-4">
                            <p className="text-gray-900 font-medium leading-relaxed mb-3">
                              {question.text}
                            </p>

                            {/* Multiple Choice Options */}
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
                  <Card className="p-12 text-center border-2 border-dashed border-gray-200">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có câu hỏi nào</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Bắt đầu tạo câu hỏi đánh giá cho vị trí <strong>{role}</strong> để xây dựng bộ đề thi chuyên nghiệp
                    </p>
                    <Button 
                      onClick={() => setIsCreating(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tạo câu hỏi đầu tiên
                    </Button>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;