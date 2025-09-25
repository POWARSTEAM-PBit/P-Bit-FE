// src/api/classMembers.js
import client from './client';

/**
 * Fetch class members with optional sorting parameters.
 * @param {string|number} classId
 * @param {{ sort_by?: 'joined_at'|'first_name'|'user_id', order?: 'asc'|'desc' }} params
 * @returns {Promise<any[]>}
 */
export async function fetchClassMembers(classId, params = {}) {
  if (!classId) throw new Error('classId is required');

  const query = {
    sort_by: params.sort_by || 'joined_at',
    order: params.order || 'asc',
  };

  // backticks are required for template string
  const res = await client.get(`/class/${classId}/members`, { params: query });

  const body = res?.data;
  if (!body || body.success === false) {
    throw new Error(body?.message || 'Failed to fetch class members');
  }

  // Allow array or { members: [...] }
  const data = body.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.members)) return data.members;
  return [];
}

//  No default export here — keep only named export to match the import style.
