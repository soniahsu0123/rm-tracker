import { createAdminClient } from './supabase/admin'

export type Action =
  | 'projects.read_all'
  | 'projects.create'
  | 'projects.update_own'
  | 'projects.update_all'
  | 'projects.status_change'
  | 'projects.delete'
  | 'updates.create'
  | 'updates.update_own'
  | 'updates.update_all'
  | 'updates.delete'

interface Profile {
  id: string
  role: 'admin' | 'manager' | 'employee' | string
}

/**
 * Check whether a user is allowed to perform an action.
 * Resolution order:
 *   1. Admin → always allowed
 *   2. user_permissions override → use that value
 *   3. role-level permissions → use that value
 *   4. Default → false
 */
export async function canUser(profile: Profile, action: Action): Promise<boolean> {
  if (profile.role === 'admin') return true

  const admin = createAdminClient()

  // 1. Check user-level override (table may not exist yet → ignore error)
  const { data: userOverride } = await admin
    .from('user_permissions')
    .select('allowed')
    .eq('user_id', profile.id)
    .eq('action', action)
    .maybeSingle()

  if (userOverride) return userOverride.allowed

  // 2. Check role-level permission
  const { data: rolePerm } = await admin
    .from('permissions')
    .select('allowed')
    .eq('role', profile.role)
    .eq('action', action)
    .maybeSingle()

  return rolePerm?.allowed ?? false
}

/**
 * Bulk-fetch effective permissions for a single user, used to gate UI elements.
 */
export async function getEffectivePermissions(profile: Profile): Promise<Record<Action, boolean>> {
  const actions: Action[] = [
    'projects.read_all', 'projects.create', 'projects.update_own', 'projects.update_all',
    'projects.status_change', 'projects.delete',
    'updates.create', 'updates.update_own', 'updates.update_all', 'updates.delete',
  ]

  if (profile.role === 'admin') {
    return Object.fromEntries(actions.map(a => [a, true])) as Record<Action, boolean>
  }

  const admin = createAdminClient()
  const [{ data: roles }, { data: overrides }] = await Promise.all([
    admin.from('permissions').select('action, allowed').eq('role', profile.role),
    admin.from('user_permissions').select('action, allowed').eq('user_id', profile.id),
  ])

  const result = {} as Record<Action, boolean>
  for (const a of actions) {
    const override = overrides?.find(o => o.action === a)
    if (override) {
      result[a] = override.allowed
    } else {
      const role = roles?.find(r => r.action === a)
      result[a] = role?.allowed ?? false
    }
  }
  return result
}
