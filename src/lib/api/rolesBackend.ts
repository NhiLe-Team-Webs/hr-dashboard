/**
 * Roles API - Backend Version
 * Uses the centralized backend API instead of direct Supabase access
 */

import { httpClient } from './httpClient';
import type { RoleSummary } from '../../types/question';

/**
 * Get all available roles
 */
export const getRoles = async (): Promise<RoleSummary[]> => {
  try {
    console.log('DEBUG: Fetching roles from backend...');
    // httpClient already unwraps data.data, so we get { roles: [...] } directly
    const response = await httpClient.get<{ roles: unknown[] }>('/hr/roles');
    console.log('DEBUG: Raw response from backend:', response);

    // Check if response exists and has roles property
    if (!response || !response.roles) {
      console.error('DEBUG: Invalid response structure - missing roles property:', response);
      throw new Error('Invalid response structure from backend');
    }

    console.log('DEBUG: Roles array:', response.roles);
    console.log('DEBUG: Roles array length:', response.roles.length);

    // Map backend response to frontend format
    return response.roles.map((role: unknown) => {
      const roleData = role as Record<string, unknown>;
      console.log('DEBUG: Processing role:', roleData);
      return {
        id: roleData.id as string,
        name: roleData.name as string,
        duration: roleData.duration_minutes ? (roleData.duration_minutes as number) * 60 : 1800, // Convert minutes to seconds
      };
    });
  } catch (error) {
    console.error('DEBUG: Failed to fetch roles from backend:', error);
    console.error('DEBUG: Error details:', JSON.stringify(error, null, 2));
    throw new Error('Unable to load roles');
  }
};

/**
 * Create a new role
 */
export const createRole = async (roleName: string, durationSeconds: number): Promise<RoleSummary> => {
  try {
    console.log('createRole called with:', { roleName, durationSeconds });
    const payload = {
      name: roleName,
      description: `Assessment for ${roleName}`,
      duration_minutes: Math.floor(durationSeconds / 60), // Convert seconds to minutes
    };
    console.log('createRole payload:', payload);

    // httpClient already unwraps data.data, so we get { role: {...} } directly
    const response = await httpClient.post<{ role: Record<string, unknown> }>('/hr/roles', payload);
    const roleData = response.role;

    return {
      id: roleData.id as string,
      name: roleData.name as string,
      duration: roleData.duration_minutes ? (roleData.duration_minutes as number) * 60 : durationSeconds,
    };
  } catch (error) {
    console.error('Failed to create role:', error);
    throw new Error('Unable to create role');
  }
};

/**
 * Update role duration
 */
export const updateRoleDuration = async (roleName: string, durationSeconds: number): Promise<void> => {
  try {
    // First, get the role ID
    const roles = await getRoles();
    const role = roles.find(r => r.name === roleName);

    if (!role || !role.id) {
      console.error('Role not found:', roleName, 'Available roles:', roles);
      throw new Error('Role not found');
    }

    const payload = {
      duration_minutes: Math.floor(durationSeconds / 60), // Convert seconds to minutes
    };
    console.log('updateRoleDuration payload:', payload, 'for role ID:', role.id);

    await httpClient.put(`/hr/roles/${role.id}`, payload);
  } catch (error) {
    console.error('Failed to update role duration:', error);
    throw new Error('Unable to update role duration');
  }
};

/**
 * Delete a role
 */
export const deleteRole = async (roleName: string): Promise<void> => {
  try {
    // First, get the role ID
    const roles = await getRoles();
    console.log('All roles:', roles);
    const role = roles.find(r => r.name === roleName);
    console.log('Found role to delete:', role, 'searching for:', roleName);

    if (!role || !role.id) {
      console.error('Role not found:', roleName, 'Available roles:', roles);
      throw new Error('Role not found');
    }

    console.log('Deleting role with ID:', role.id);
    await httpClient.delete(`/hr/roles/${role.id}`);
  } catch (error: any) {
    console.error('Failed to delete role:', error);
    
    // Check if error message indicates existing attempts
    if (error?.message?.includes('existing assessment attempts')) {
      throw new Error('Không thể xóa vị trí này vì đã có ứng viên làm bài test. Vui lòng xóa các bài test liên quan trước.');
    }
    
    throw error;
  }
};
