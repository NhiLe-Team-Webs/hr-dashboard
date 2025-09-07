import { useState } from 'react';
import { Plus, Edit3, Trash2, FileText, Check, X, Move, Copy, Settings, Eye, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast'; // Giả sử bạn có toast component cho thông báo

// Initial data
const initialQuestions = {
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

const initialQuestionTypes = [
  { value: 'Work Sample', label: 'Mẫu công việc', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Problem Solving', label: 'Giải quyết vấn đề', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'Values & Reliability', label: 'Giá trị & Độ tin cậy', color: 'bg-green-50 text-green-700 border-green-200' }
];

// Sub-component: Question Form (reusable for create/edit)
const QuestionForm = ({ 
  question = null, 
  onSubmit, 
  onCancel, 
  questionTypes, 
  setQuestionTypes,
  isEdit = false,
  currentQuestions = [] 
}) => {
  interface FormErrors {
    text?: string;
    duplicate?: string;
    options?: string;
    correctAnswer?: string;
  }

  const [formData, setFormData] = useState({
    text: question?.text || '',
    type: question?.type || questionTypes[0]?.value || 'Work Sample',
    format: question?.format || 'text',
    required: question?.required !== undefined ? question.required : true,
    points: question?.points || 5,
    options: question?.format === 'multiple_choice' ? [...(question.options || [])] : [{ id: 'a', text: '' }, { id: 'b', text: '' }],
    correctAnswer: question?.correctAnswer || 'a'
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.text.trim()) {
      newErrors.text = 'Nội dung câu hỏi không được để trống';
    }
    if (currentQuestions.some(q => q.text.toLowerCase() === formData.text.toLowerCase())) {
      newErrors.duplicate = 'Câu hỏi này đã tồn tại';
    }
    if (formData.format === 'multiple_choice') {
      const hasOptions = formData.options.some(opt => opt.text.trim());
      if (!hasOptions) {
        newErrors.options = 'Ít nhất một phương án phải có nội dung';
      }
      if (!formData.correctAnswer || !formData.options.find(opt => opt.id === formData.correctAnswer)?.text.trim()) {
        newErrors.correctAnswer = 'Phải chọn đáp án đúng hợp lệ';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const processedData = {
        ...formData,
        options: formData.format === 'multiple_choice' ? formData.options.filter(opt => opt.text.trim()) : undefined,
        id: question?.id || Date.now().toString()
      };
      onSubmit(processedData);
    }
  };

  const addOption = () => {
    const nextId = String.fromCharCode(97 + formData.options.length);
    setFormData(prev => ({ ...prev, options: [...prev.options, { id: nextId, text: '' }] }));
  };

  const removeOption = (optionId) => {
    if (formData.options.length <= 2) return;
    setFormData(prev => ({ ...prev, options: prev.options.filter(opt => opt.id !== optionId) }));
    // If removing the correct answer, reset it
    if (formData.correctAnswer === optionId) {
      setFormData(prev => ({ ...prev, correctAnswer: formData.options[0]?.id || 'a' }));
    }
  };

  const updateOption = (optionId, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === optionId ? { ...opt, text: value } : opt)
    }));
  };

  const setCorrectAnswer = (optionId) => {
    setFormData(prev => ({ ...prev, correctAnswer: optionId }));
  };

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.text && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.text}</div>}
      {errors.duplicate && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.duplicate}</div>}
      {errors.options && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.options}</div>}
      {errors.correctAnswer && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.correctAnswer}</div>}

      {/* Question Text */}
      <div>
        <Label htmlFor="text">Nội dung câu hỏi *</Label>
        <Textarea
          id="text"
          placeholder="Nhập nội dung câu hỏi..."
          value={formData.text}
          onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Loại câu hỏi</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
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
          <Label>Định dạng</Label>
          <Select value={formData.format} onValueChange={(value) => {
            setFormData(prev => ({ 
              ...prev, 
              format: value,
              options: value === 'multiple_choice' ? prev.options : undefined 
            }));
          }}>
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
          <Label>Điểm số</Label>
          <Input
            type="number"
            min="1"
            max="20"
            value={formData.points}
            onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 5 }))}
          />
        </div>
      </div>

      {/* Multiple Choice Options */}
      {formData.format === 'multiple_choice' && (
        <div className="space-y-3">
          <Label>Các phương án trả lời</Label>
          {formData.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-3">
              <input
                type="radio"
                checked={formData.correctAnswer === option.id}
                onChange={() => setCorrectAnswer(option.id)}
                className="text-blue-600"
              />
              <div className="flex-1">
                <Input
                  placeholder={`Phương án ${option.id.toUpperCase()}`}
                  value={option.text}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                />
              </div>
              {formData.options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {formData.options.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm phương án
            </Button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(errors).length > 0 || !formData.text.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Check className="w-4 h-4 mr-2" />
          {isEdit ? 'Cập nhật' : 'Tạo'}
        </Button>
      </div>
    </div>
  );
};

// Sub-component: Role Manager Dialog
const RoleManager = ({ roles, questions, setRoles, setQuestions, onClose }) => {
  const [newRoleName, setNewRoleName] = useState('');

  const addRole = () => {
    if (!newRoleName.trim() || roles.includes(newRoleName.trim())) {
      toast({ title: 'Lỗi', description: 'Tên vị trí không hợp lệ hoặc đã tồn tại' });
      return;
    }
    setRoles([...roles, newRoleName.trim()]);
    setQuestions(prev => ({ ...prev, [newRoleName.trim()]: [] }));
    setNewRoleName('');
    toast({ title: 'Thành công', description: `Đã thêm vị trí "${newRoleName.trim()}"` });
  };

  const deleteRole = (role) => {
    if (confirm(`Xóa vị trí "${role}"? Tất cả câu hỏi sẽ bị xóa.`)) {
      setRoles(roles.filter(r => r !== role));
      const newQuestions = { ...questions };
      delete newQuestions[role];
      setQuestions(newQuestions);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Quản lý Vị trí</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {/* Add Role */}
        <div className="space-y-2">
          <Label>Thêm vị trí mới</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nhập tên vị trí..."
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
            <Button onClick={addRole} disabled={!newRoleName.trim()}>Thêm</Button>
          </div>
        </div>

        {/* List Roles */}
        <div>
          <Label>Danh sách vị trí</Label>
          <div className="space-y-2 mt-2">
            {roles.map(role => (
              <div key={role} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{role} ({(questions[role] || []).length} câu hỏi)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRole(role)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Button onClick={onClose} className="mt-4">Đóng</Button>
    </DialogContent>
  );
};

// Sub-component: Type Manager Dialog
const TypeManager = ({ questionTypes, setQuestionTypes, onClose }) => {
  const [newType, setNewType] = useState({ value: '', label: '', color: 'bg-gray-50 text-gray-700 border-gray-200' });

  const addType = () => {
    if (!newType.value.trim() || !newType.label.trim() || questionTypes.some(t => t.value === newType.value.trim())) {
      toast({ title: 'Lỗi', description: 'Loại câu hỏi không hợp lệ hoặc đã tồn tại' });
      return;
    }
    setQuestionTypes([...questionTypes, { ...newType, value: newType.value.trim(), label: newType.label.trim() }]);
    setNewType({ value: '', label: '', color: 'bg-gray-50 text-gray-700 border-gray-200' });
    toast({ title: 'Thành công', description: `Đã thêm loại "${newType.label.trim()}"` });
  };

  const deleteType = (value) => {
    if (confirm(`Xóa loại "${value}"?`)) {
      setQuestionTypes(questionTypes.filter(t => t.value !== value));
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Quản lý Loại Câu Hỏi</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {/* Add Type */}
        <div className="space-y-2">
          <Label>Thêm loại mới</Label>
          <Input
            placeholder="Tên loại (value)"
            value={newType.value}
            onChange={(e) => setNewType(prev => ({ ...prev, value: e.target.value }))}
          />
          <Input
            placeholder="Nhãn hiển thị"
            value={newType.label}
            onChange={(e) => setNewType(prev => ({ ...prev, label: e.target.value }))}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Màu (ví dụ: bg-red-50 text-red-700 border-red-200)"
              value={newType.color}
              onChange={(e) => setNewType(prev => ({ ...prev, color: e.target.value }))}
            />
            <Button onClick={addType} disabled={!newType.value.trim() || !newType.label.trim()}>Thêm</Button>
          </div>
        </div>

        {/* List Types */}
        <div>
          <Label>Danh sách loại</Label>
          <div className="space-y-2 mt-2">
            {questionTypes.map(type => (
              <div key={type.value} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className={type.color}>{type.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteType(type.value)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Button onClick={onClose} className="mt-4">Đóng</Button>
    </DialogContent>
  );
};

// Main Component
const QuestionEditor = () => {
  const [questions, setQuestions] = useState(initialQuestions);
  const [roles, setRoles] = useState(Object.keys(initialQuestions));
  const [questionTypes, setQuestionTypes] = useState(initialQuestionTypes);
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);

  const currentQuestions = questions[selectedRole] || [];

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

  const handleCreateQuestion = (data) => {
    setQuestions(prev => ({
      ...prev,
      [selectedRole]: [...(prev[selectedRole] || []), data]
    }));
    setIsCreating(false);
    toast({ title: 'Thành công', description: 'Đã tạo câu hỏi mới' });
  };

  const handleUpdateQuestion = (data) => {
    setQuestions(prev => ({
      ...prev,
      [selectedRole]: prev[selectedRole].map(q => q.id === data.id ? data : q)
    }));
    setEditingQuestion(null);
    toast({ title: 'Thành công', description: 'Đã cập nhật câu hỏi' });
  };

  const duplicateQuestion = (question) => {
    const duplicated = { ...question, id: Date.now().toString(), text: `${question.text} (Bản sao)` };
    setQuestions(prev => ({
      ...prev,
      [selectedRole]: [...(prev[selectedRole] || []), duplicated]
    }));
    toast({ title: 'Thành công', description: 'Đã sao chép câu hỏi' });
  };

  const deleteQuestion = (questionId) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      setQuestions(prev => ({
        ...prev,
        [selectedRole]: prev[selectedRole].filter(q => q.id !== questionId)
      }));
      toast({ title: 'Thành công', description: 'Đã xóa câu hỏi' });
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
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
            <div className="flex gap-2">
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
                  setQuestions={setQuestions} 
                  onClose={() => setShowRoleManager(false)} 
                />
              </Dialog>
              <Dialog open={showTypeManager} onOpenChange={setShowTypeManager}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Quản lý loại câu hỏi
                  </Button>
                </DialogTrigger>
                <TypeManager 
                  questionTypes={questionTypes} 
                  setQuestionTypes={setQuestionTypes} 
                  onClose={() => setShowTypeManager(false)} 
                />
              </Dialog>
              <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
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
                {/* Create New Question Modal */}
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Tạo câu hỏi mới</DialogTitle>
                    </DialogHeader>
                    <QuestionForm
                      questionTypes={questionTypes}
                      setQuestionTypes={setQuestionTypes}
                      currentQuestions={currentQuestions}
                      onSubmit={handleCreateQuestion}
                      onCancel={() => setIsCreating(false)}
                    />
                  </DialogContent>
                </Dialog>

                {/* Edit Question Modal */}
                {editingQuestion && (
                  <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Chỉnh sửa câu hỏi</DialogTitle>
                      </DialogHeader>
                      <QuestionForm
                        question={editingQuestion}
                        questionTypes={questionTypes}
                        setQuestionTypes={setQuestionTypes}
                        currentQuestions={currentQuestions}
                        isEdit={true}
                        onSubmit={handleUpdateQuestion}
                        onCancel={() => setEditingQuestion(null)}
                      />
                    </DialogContent>
                  </Dialog>
                )}

                {/* Questions List */}
                {currentQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {currentQuestions.map((question, index) => {
                      const typeInfo = getQuestionTypeInfo(question.type);
                      const isExpanded = expandedQuestions.has(question.id);
                      
                      return (
                        <Card key={question.id} className="overflow-hidden hover:shadow-md transition-all duration-200">
                          {/* Header */}
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
                                  onClick={() => handleEditQuestion(question)}
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

                          {/* Content */}
                          <div className="p-4">
                            <p className="text-gray-900 font-medium leading-relaxed mb-3">
                              {question.text}
                            </p>

                            {/* Expanded Options */}
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
                    <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
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