import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from './ui/use-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithPassword, session, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (status === 'ready' && session) {
      navigate('/', { replace: true });
    }
  }, [status, session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signInWithPassword(email, password);

      if (error) {
        setError(error);
        toast({
          title: 'Đăng nhập thất bại',
          description: error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Đăng nhập thành công',
          description: 'Chào mừng bạn đến với HR Dashboard',
        });
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
      toast({
        title: 'Đăng nhập thất bại',
        description: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative bg-slate-50">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-cyan-500/20 pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-[2.5rem] p-8 md:p-12 relative z-10 shadow-2xl border border-white/40">
        <div className="text-center pb-8">
          <div className="mx-auto mb-6 h-20 w-20 rounded-[2rem] bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-white/50 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Chào mừng!</h1>
          <p className="text-slate-500 mt-2 font-medium">Đăng nhập HR Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-bold ml-1">Email</Label>
            <div className="relative group">
              <Input
                id="email"
                type="email"
                placeholder="ten@congty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-4 h-12 rounded-2xl bg-white/50 border-white/50 focus:bg-white focus:ring-4 focus:ring-primary/20 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-bold ml-1">Mật khẩu</Label>
            <div className="relative group">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-4 pr-12 h-12 rounded-2xl bg-white/50 border-white/50 focus:bg-white focus:ring-4 focus:ring-primary/20 transition-all font-medium text-slate-800"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25 text-lg font-bold tracking-wide transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Đăng nhập'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
