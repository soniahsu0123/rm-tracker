import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jylwszoaqqpbzcukfbcm.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ACTIONS = [
  'projects.read_all',
  'projects.create',
  'projects.update_own',
  'projects.update_all',
  'projects.status_change',
  'projects.delete',
  'updates.create',
  'updates.update_own',
  'updates.update_all',
  'updates.delete',
]

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Set all manager permissions to true
const managerRows = ACTIONS.map(action => ({ role: 'manager', action, allowed: true }))
const { error: e1 } = await admin.from('permissions').upsert(managerRows, { onConflict: 'role,action' })
if (e1) { console.error('manager error:', e1.message); process.exit(1) }

// Also create user_permissions table if needed (handled by migration)
console.log('Done: all manager permissions set to true')
