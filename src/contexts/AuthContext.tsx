import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { httpClient } from '@/lib/api/httpClient';

type AuthStatus = 'loading' | 'ready';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  user: User;
}

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  userRole: string | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const toFriendlyMessage = () => 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.';

const ALLOWED_ROLES = ['manager', 'admin', 'owner'];

const AUTH_STORAGE_KEY = 'hr-dashboard-auth';

export const AuthProvider = ({ children }: PropsWithChildren<unknown>) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const isLoggingOutRef = useRef(false);

  // Load session from localStorage on mount
  useEffect(() => {
    let isMounted = true;

    console.log('[AuthContext] Initializing...');

    const initializeAuth = async () => {
      try {
        // Try to load session from localStorage
        const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

        if (!isMounted) {
          return;
        }

        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession) as Session;

            // Check if token is expired
            const now = Date.now() / 1000;
            if (parsedSession.expires_at && parsedSession.expires_at > now) {
              setSession(parsedSession);
              setUser(parsedSession.user);
              setUserRole(parsedSession.user.role);
              console.log('[AuthContext] Restored session from storage');
            } else {
              console.log('[AuthContext] Stored session expired');
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          } catch (parseError) {
            console.error('[AuthContext] Failed to parse stored session:', parseError);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }

        setStatus('ready');
        console.log('[AuthContext] Initialization complete');
      } catch (error) {
        console.error('[AuthContext] Unexpected error in initializeAuth:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setStatus('ready');
        }
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    try {
      // Reset logout flag when attempting new login
      isLoggingOutRef.current = false;

      // Call backend API for login
      const response = await httpClient.post<{
        user: User;
        session: {
          access_token: string;
          refresh_token: string;
          expires_in: number;
          expires_at: number;
        };
      }>('/hr/auth/admin/login', {
        email,
        password,
      });

      const { user: userData, session: sessionData } = response;

      // Check user role
      if (!userData.role) {
        return { error: 'Tài khoản chưa được phân quyền. Vui lòng liên hệ quản trị viên.' };
      }

      if (!ALLOWED_ROLES.includes(userData.role)) {
        return { error: 'Từ chối truy cập. Bạn không có quyền truy cập vào hệ thống.' };
      }

      // Create session object
      const newSession: Session = {
        ...sessionData,
        user: userData,
      };

      // Store session in localStorage
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));

      // Update state
      setSession(newSession);
      setUser(userData);
      setUserRole(userData.role);

      console.log('[AuthContext] Login successful');
      return {};
    } catch (error) {
      console.error('Sign-in error:', error);
      const errorMessage = error instanceof Error ? error.message : toFriendlyMessage();
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut called');

    // Set logging out flag
    isLoggingOutRef.current = true;

    // Clear state immediately
    setUserRole(null);
    setSession(null);
    setUser(null);

    // Clear storage
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.clear();
      console.log('[AuthContext] Storage cleared');
    } catch (storageError) {
      console.error('[AuthContext] Error clearing storage:', storageError);
    }

    console.log('[AuthContext] Sign out complete');
  };

  const value = useMemo(
    () => ({
      status,
      session,
      user,
      userRole,
      signInWithPassword,
      signOut,
    }),
    [session, status, user, userRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
