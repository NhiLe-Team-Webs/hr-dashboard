// src/hooks/useLandingPageEditor.ts
import { useState, useEffect, useCallback } from 'react';
import { LandingPage, ViewportType } from '../types/landingPage';
import { getLandingPageData, updateLandingPageData, preloadImages, trackEditorAction } from '../lib/mockApi';

interface UseLandingPageEditorOptions {
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface UseLandingPageEditorReturn {
  // Data state
  data: LandingPage | null;
  isLoading: boolean;
  error: string | null;
  
  // Editor state
  hasChanges: boolean;
  isPreviewMode: boolean;
  viewport: ViewportType;
  
  // History state
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  updateData: (updates: Partial<LandingPage>) => void;
  save: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  setPreviewMode: (enabled: boolean) => void;
  setViewport: (viewport: ViewportType) => void;
  reset: () => void;
}

export const useLandingPageEditor = (
  options: UseLandingPageEditorOptions = {}
): UseLandingPageEditorReturn => {
  const { autoSave = false, autoSaveDelay = 2000 } = options;
  
  // Data state
  const [data, setData] = useState<LandingPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Editor state
  const [hasChanges, setHasChanges] = useState(false);
  const [isPreviewMode, setPreviewMode] = useState(false);
  const [viewport, setViewport] = useState<ViewportType>('desktop');
  
  // History state
  const [history, setHistory] = useState<LandingPage[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Auto-save timer
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const landingPageData = await getLandingPageData();
        setData(landingPageData);
        setHistory([landingPageData]);
        setHistoryIndex(0);
        
        // Preload images for better UX
        await preloadImages(landingPageData);
        
        trackEditorAction('dữ liệu đã tải', { 
          heroTitle: landingPageData.heroTitle 
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Tải dữ liệu thất bại';
        setError(errorMessage);
        console.error('Tải dữ liệu trang đích thất bại:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !hasChanges || !data) return;

    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        await updateLandingPageData(data);
        setHasChanges(false);
        trackEditorAction('tự động lưu');
        console.log('🔄 Tự động lưu thay đổi');
      } catch (err) {
        console.error('Tự động lưu thất bại:', err);
      }
    }, autoSaveDelay);

    setAutoSaveTimer(timer);

    // Cleanup
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [data, hasChanges, autoSave, autoSaveDelay, autoSaveTimer]);

  // Add to history helper
  const addToHistory = useCallback((newData: LandingPage) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newData);
      
      // Limit history size to prevent memory issues
      const maxHistorySize = 50;
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        setHistoryIndex(prev => prev - 1);
        return newHistory;
      }
      
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  // Update data function
  const updateData = useCallback((updates: Partial<LandingPage>) => {
    if (!data) return;
    
    const newData = { ...data, ...updates };
    setData(newData);
    setHasChanges(true);
    addToHistory(newData);
    
    trackEditorAction('dữ liệu đã cập nhật', { 
      fields: Object.keys(updates),
      timestamp: new Date().toISOString()
    });
  }, [data, addToHistory]);

  // Save function
  const save = useCallback(async () => {
    if (!data || !hasChanges) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await updateLandingPageData(data);
      setHasChanges(false);
      trackEditorAction('lưu thủ công');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lưu thất bại';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [data, hasChanges]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setData(history[newIndex]);
      setHasChanges(true);
      trackEditorAction('hoàn tác');
    }
  }, [history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setData(history[newIndex]);
      setHasChanges(true);
      trackEditorAction('làm lại');
    }
  }, [history, historyIndex]);

  // Reset function
  const reset = useCallback(async () => {
    try {
      const defaultData = await getLandingPageData();
      setData(defaultData);
      setHistory([defaultData]);
      setHistoryIndex(0);
      setHasChanges(false);
      trackEditorAction('đặt lại');
    } catch (err) {
      console.error('Đặt lại thất bại:', err);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            if (hasChanges) {
              save().catch(console.error);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, save, hasChanges]);

  return {
    // Data state
    data,
    isLoading,
    error,
    
    // Editor state
    hasChanges,
    isPreviewMode,
    viewport,
    
    // History state
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    
    // Actions
    updateData,
    save,
    undo,
    redo,
    setPreviewMode,
    setViewport,
    reset,
  };
};
