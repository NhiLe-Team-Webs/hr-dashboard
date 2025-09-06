// src/lib/mockApi.ts
import type { LandingPage } from '../types/landingPage';

// Mock data với ảnh thực tế từ Unsplash
const defaultLandingPageData: LandingPage = {
  heroTitle: 'Welcome to Our Company',
  heroSubtitle: 'Find your perfect role and thrive with us! Join our team of innovative professionals.',
  heroImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop&crop=center',
  features: [
    {
      title: 'Personalized Test',
      description: 'Take a test that matches your personality and skills.',
      icon: '🌟'
    },
    {
      title: 'Culture Fit',
      description: 'See how well you align with our company culture.',
      icon: '🌱'
    }
  ],
  callToAction: { 
    text: 'Start Your Assessment', 
    link: '/assessment' 
  },
  aPlayerCandidate: {
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    name: 'Nguyễn Văn A',
    description: 'Senior Developer with 5+ years experience in full-stack development',
    fitScore: '97%'
  }
};

// Simulate localStorage để lưu data persistent trong session
const STORAGE_KEY = 'landing_page_data';

// Helper function để simulate network delay
const simulateNetworkDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Helper function để random simulate errors (5% chance)
const shouldSimulateError = () => Math.random() < 0.05;

export const getLandingPageData = async (): Promise<LandingPage> => {
  await simulateNetworkDelay(300);

  if (shouldSimulateError()) {
    throw new Error('Network error: Failed to fetch landing page data');
  }

  try {
    // Thử lấy data từ localStorage trước
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Validate data structure
      if (isValidLandingPageData(parsedData)) {
        return parsedData;
      }
    }

    // Fallback: thử fetch từ public folder
    const response = await fetch('/landingPageData.json');
    if (response.ok) {
      const data = await response.json();
      if (isValidLandingPageData(data)) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Error loading saved data:', error);
  }

  // Final fallback: return default data
  console.log('Using default landing page data');
  return defaultLandingPageData;
};

export const updateLandingPageData = async (data: LandingPage): Promise<void> => {
  await simulateNetworkDelay(800);

  if (shouldSimulateError()) {
    throw new Error('Network error: Failed to save landing page data');
  }

  if (!isValidLandingPageData(data)) {
    throw new Error('Invalid data format');
  }

  try {
    // Lưu vào localStorage để persistent trong session
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Simulate API call success
    console.log('✅ Landing page data saved successfully:', {
      heroTitle: data.heroTitle,
      timestamp: new Date().toISOString(),
      hasImage: !!data.heroImage,
      candidateName: data.aPlayerCandidate.name
    });

    // Trong production, đây sẽ là API call thực tế:
    // const response = await fetch('/api/landing-page', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // if (!response.ok) throw new Error('Failed to save');

  } catch (error) {
    console.error('Error saving landing page data:', error);
    throw error;
  }
};

// Validation function
const isValidLandingPageData = (data: unknown): data is LandingPage => {
  if (data === null || typeof data !== 'object') {
    return false;
  }
  const d = data as LandingPage;
  return (
    d.heroTitle !== undefined &&
    typeof d.heroTitle === 'string' &&
    d.heroSubtitle !== undefined &&
    typeof d.heroSubtitle === 'string' &&
    d.heroImage !== undefined &&
    typeof d.heroImage === 'string' &&
    d.features !== undefined &&
    Array.isArray(d.features) &&
    d.callToAction !== undefined &&
    typeof d.callToAction.text === 'string' &&
    typeof d.callToAction.link === 'string' &&
    d.aPlayerCandidate !== undefined &&
    typeof d.aPlayerCandidate.name === 'string' &&
    typeof d.aPlayerCandidate.image === 'string' &&
    typeof d.aPlayerCandidate.description === 'string' &&
    typeof d.aPlayerCandidate.fitScore === 'string'
  );
};

// Additional utility functions for better UX
export const preloadImages = async (data: LandingPage): Promise<void> => {
  const imageUrls = [data.heroImage, data.aPlayerCandidate.image];
  
  const preloadPromises = imageUrls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });

  try {
    await Promise.all(preloadPromises);
    console.log('✅ All images preloaded successfully');
  } catch (error) {
    console.warn('⚠️ Some images failed to preload:', error);
    // Don't throw error, just warn - the app should still work
  }
};

export const resetToDefault = async (): Promise<LandingPage> => {
  localStorage.removeItem(STORAGE_KEY);
  return defaultLandingPageData;
};

export const exportLandingPageData = (data: LandingPage): string => {
  return JSON.stringify(data, null, 2);
};

export const importLandingPageData = (jsonString: string): LandingPage => {
  try {
    const parsed = JSON.parse(jsonString);
    if (isValidLandingPageData(parsed)) {
      return parsed;
    }
    throw new Error('Invalid data structure');
  } catch (error) {
    throw new Error('Invalid JSON format or data structure');
  }
};

// Analytics/tracking helper (for future use)
export const trackEditorAction = (action: string, details?: Record<string, unknown>) => {
  console.log(`📊 Editor Action: ${action}`, details);
  // In production, this would send to analytics service
};