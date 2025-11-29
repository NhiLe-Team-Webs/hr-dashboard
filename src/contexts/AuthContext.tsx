import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

type AuthStatus = 'loading' | 'ready';

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

export const AuthProvider = ({ children }: PropsWithChildren<unknown>) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const isLoggingOutRef = useRef(false);
  const roleCacheRef = useRef<Map<string, { role: string; timestamp: number }>>(new Map());
  const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  useEffect(() => {
    let isMounted = true;

    console.log('[AuthContext] Initializing...');

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!isMounted) {
          return;
        }
        
        if (error) {
          console.error('[AuthContext] Supabase session error:', error);
          setSession(null);
          setUser(null);
          setUserRole(null);
          setStatus('ready');
          return;
        }
        
        const currentSession = data?.session ?? null;
        const currentUser = data?.session?.user ?? null;
        
        setSession(currentSession);
        setUser(currentUser);
        
        // Fetch user role from database
        if (currentUser) {
          try {
            await fetchUserRole(currentUser.id);
          } catch (roleError) {
            console.error('[AuthContext] Failed to fetch user role:', roleError);
            setUserRole(null);
          }
        } else {
          setUserRole(null);
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

    const { data } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      console.log('[AuthContext] Auth state changed:', event);
      
      if (!isMounted) {
        return;
      }
      
      // Skip INITIAL_SESSION event - we already handled it in initializeAuth
      if (event === 'INITIAL_SESSION') {
        console.log('[AuthContext] Skipping INITIAL_SESSION event');
        return;
      }
      
      // Handle SIGNED_OUT event first
      if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out');
        setSession(null);
        setUser(null);
        setUserRole(null);
        isLoggingOutRef.current = false;
        return;
      }
      
      // Ignore SIGNED_IN events during logout (but allow after SIGNED_OUT)
      if (isLoggingOutRef.current && event === 'SIGNED_IN') {
        console.log('[AuthContext] Ignoring spurious SIGNED_IN during logout');
        return;
      }
      
      // Handle SIGNED_IN and TOKEN_REFRESHED events
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      
      // Fetch user role when session changes
      // For TOKEN_REFRESHED, use cache; for SIGNED_IN, force refresh
      if (nextSession?.user) {
        try {
          const shouldForceRefresh = event === 'SIGNED_IN';
          await fetchUserRole(nextSession.user.id, shouldForceRefresh);
        } catch (roleError) {
          console.error('[AuthContext] Failed to fetch user role:', roleError);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    });

    const subscription = data?.subscription;

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string, forceRefresh = false): Promise<void> => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = roleCacheRef.current.get(userId);
        if (cached && Date.now() - cached.timestamp < ROLE_CACHE_DURATION) {
          console.log('[AuthContext] Using cached role for user:', userId);
          setUserRole(cached.role);
          return;
        }
      }
      
      // Add timeout to prevent hanging (increased to 5 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
      );
      
      const fetchPromise = supabase
        .from('users')
        .select('role')
        .eq('auth_id', userId)
        .single();
      
      const result = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]).catch(err => {
        // If timeout or error, check cache one more time as fallback
        const cached = roleCacheRef.current.get(userId);
        if (cached) {
          console.warn('[AuthContext] Using stale cache due to fetch error:', err);
          return { data: { role: cached.role }, error: null };
        }
        throw err;
      });
      
      const { data, error } = result;
      
      if (error) {
        console.error('[AuthContext] Error fetching user role:', {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        
        // Try to use cached value even if expired
        const cached = roleCacheRef.current.get(userId);
        if (cached) {
          console.warn('[AuthContext] Using expired cache due to fetch error');
          setUserRole(cached.role);
          return;
        }
        
        setUserRole(null);
        return;
      }
      
      const role = data?.role ?? null;
      
      // Cache the role
      if (role) {
        roleCacheRef.current.set(userId, { role, timestamp: Date.now() });
        console.log('[AuthContext] Cached role for user:', userId);
      }
      
      setUserRole(role);
    } catch (error) {
      console.error('[AuthContext] Unexpected error fetching user role:', error);
      
      // Last resort: try to use any cached value
      const cached = roleCacheRef.current.get(userId);
      if (cached) {
        console.warn('[AuthContext] Using cached role as last resort');
        setUserRole(cached.role);
      } else {
        setUserRole(null);
      }
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      // Reset logout flag when attempting new login
      isLoggingOutRef.current = false;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase sign-in error:', error);
        return { error: error.message || toFriendlyMessage() };
      }

      // Check user role
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', data.user.id)
          .single();
        
        if (userError) {
          console.error('[AuthContext] Error fetching user role:', {
            code: userError.code,
            message: userError.message,
            details: userError.details,
            hint: userError.hint,
          });
          
          // Check if user doesn't exist in users table
          if (userError.code === 'PGRST116') {
            await supabase.auth.signOut();
            return { error: 'Không tìm thấy hồ sơ người dùng. Vui lòng liên hệ quản trị viên.' };
          }
          
          await supabase.auth.signOut();
          return { error: 'Không thể xác minh quyền truy cập. Vui lòng thử lại.' };
        }
        
        const role = userData?.role;
        
        if (!role) {
          await supabase.auth.signOut();
          return { error: 'Tài khoản chưa được phân quyền. Vui lòng liên hệ quản trị viên.' };
        }
        
        if (!ALLOWED_ROLES.includes(role)) {
          await supabase.auth.signOut();
          return { error: 'Từ chối truy cập. Bạn không có quyền truy cập vào hệ thống.' };
        }
        
        // Cache the role after successful login
        roleCacheRef.current.set(data.user.id, { role, timestamp: Date.now() });
        setUserRole(role);
      }

      return {};
    } catch (error) {
      console.error('Unexpected sign-in error:', error);
      return { error: toFriendlyMessage() };
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut called');
    
    // Set logging out flag to ignore spurious SIGNED_IN events
    isLoggingOutRef.current = true;
    
    // Clear state immediately
    setUserRole(null);
    setSession(null);
    setUser(null);
    
    // Clear role cache
    roleCacheRef.current.clear();
    
    // Clear ALL storage immediately - including all Supabase keys
    try {
      // Clear specific keys
      localStorage.removeItem('hr-dashboard-auth');
      localStorage.removeItem('supabase.auth.token');
      
      // Clear all keys that start with 'sb-'
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      sessionStorage.clear();
      console.log('[AuthContext] All storage cleared');
    } catch (storageError) {
      console.error('[AuthContext] Error clearing storage:', storageError);
    }
    
    // Sign out from Supabase with timeout (use global scope to clear everywhere)
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signout timeout')), 3000)
      );
      
      const signOutPromise = supabase.auth.signOut({ scope: 'global' });
      
      await Promise.race([signOutPromise, timeoutPromise]);
      console.log('[AuthContext] Supabase signOut successful');
    } catch (error) {
      console.error('[AuthContext] signOut error (continuing anyway):', error);
      // Continue anyway - we've already cleared local state
    }
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
