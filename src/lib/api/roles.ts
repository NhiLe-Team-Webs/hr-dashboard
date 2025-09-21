import { supabase } from '../supabaseClient';
import type { RoleSummary } from '../../types/question';

interface SupabaseRoleData {
  target_role: string;
  duration?: number | null;
}

export const getRoles = async (): Promise<RoleSummary[]> => {
  const { data, error } = await supabase
    .from('assessments')
    .select('target_role, duration');

  if (error) {
    console.error('Failed to load roles:', error);
    return [];
  }

  const roles = (data as SupabaseRoleData[] | null) ?? [];
  const roleMap = new Map<string, number>();

  roles.forEach((item) => {
    if (!item.target_role) {
      return;
    }

    if (!roleMap.has(item.target_role)) {
      roleMap.set(item.target_role, item.duration ?? 1800);
    }
  });

  return Array.from(roleMap.entries()).map(([name, duration]) => ({
    name,
    duration,
  }));
};

export const createRole = async (roleName: string, durationSeconds: number): Promise<RoleSummary> => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const { data, error } = await supabase
    .from('assessments')
    .insert([
      {
        target_role: roleName,
        title: `Assessment for ${roleName}`,
        description: `Assessment tailored for the ${roleName} role`,
        duration: durationSeconds,
        is_active: true,
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
      },
    ])
    .select('target_role, duration')
    .single();

  if (error) {
    console.error('Failed to create role assessment:', error);
    throw new Error('Unable to create role.');
  }

  return {
    name: data?.target_role ?? roleName,
    duration: data?.duration ?? durationSeconds,
  };
};

export const updateRoleDuration = async (roleName: string, durationSeconds: number): Promise<void> => {
  const { error } = await supabase
    .from('assessments')
    .update({ duration: durationSeconds })
    .eq('target_role', roleName);

  if (error) {
    console.error('Failed to update role duration:', error);
    throw new Error('Unable to update role duration.');
  }
};

export const deleteRole = async (roleName: string): Promise<void> => {
  const { error } = await supabase
    .from('assessments')
    .delete()
    .eq('target_role', roleName);

  if (error) {
    console.error('Failed to delete role:', error);
    throw new Error('Unable to delete role.');
  }
};
