// src/types/landingPage.ts
export interface Feature {
  title: string;
  description: string;
  icon?: string;
}

export interface CallToAction {
  text: string;
  link: string;
}

export interface APlayerCandidate {
  image: string;
  name: string;
  description: string;
  fitScore: string;
}

export interface LandingPage {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  features: Feature[];
  callToAction: CallToAction;
  aPlayerCandidate: APlayerCandidate;
}

// Additional types for editor functionality
export interface EditorHistory {
  past: LandingPage[];
  present: LandingPage;
  future: LandingPage[];
}

export interface EditorState {
  data: LandingPage;
  isEditing: boolean;
  hasChanges: boolean;
  isLoading: boolean;
  viewport: 'desktop' | 'mobile';
  isPreviewMode: boolean;
}

export type ViewportType = 'desktop' | 'mobile';
export type EditableField = keyof LandingPage;
export type NestedEditableField = keyof APlayerCandidate | keyof CallToAction;