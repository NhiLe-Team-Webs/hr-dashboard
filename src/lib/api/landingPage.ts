import { supabase } from '../supabaseClient';
import type { LandingPage } from '../../types/landingPage';

export const getLandingPageData = async (): Promise<LandingPage> => {
  const { data, error } = await supabase
    .from('landing_page')
    .select('*')
    .single();

  if (error) {
    console.error('Failed to load landing page data:', error);
    throw new Error('Unable to load landing page data.');
  }

  return data as LandingPage;
};

export const updateLandingPageData = async (payload: Partial<LandingPage>): Promise<void> => {
  const { error } = await supabase
    .from('landing_page')
    .update(payload);

  if (error) {
    console.error('Failed to update landing page data:', error);
    throw new Error('Unable to update landing page data.');
  }
};
