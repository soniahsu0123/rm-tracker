export type Role = 'admin' | 'manager' | 'employee'
export type Status = 'active' | 'delayed' | 'completed'

export interface Profile {
  id: string
  name: string
  role: Role
  banned: boolean
  created_at: string
}

export interface Project {
  id: string
  name: string
  owner_id: string
  status: Status
  progress_percent: number
  description: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface ProgressUpdate {
  id: string
  project_id: string
  week_date: string
  description: string
  progress_percent: number | null
  issues: string | null
  next_steps: string | null
  created_by: string
  created_at: string
  profiles?: Profile
}
