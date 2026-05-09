import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.SUPABASE_URL as string)

const supabaseKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string)

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// =========================
// TYPES
// =========================

export type Role =
  | 'student'
  | 'teacher'
  | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  created_at: string
}

export interface Student {
  id: string
  user_id: string
  student_id_number: string
  class: string
  section: string
  created_at?: string
}

export interface Marks {
  id: string
  student_id: string
  subject: string
  marks_obtained: number
  total_marks: number
  exam_type: string
  entered_by?: string
  created_at?: string
}

export interface Attendance {
  id: string
  student_id: string
  date: string
  status:
    | 'present'
    | 'absent'
  marked_by?: string
}

export interface Prediction {
  id: string
  student_id: string
  predicted_score: number
  prediction_date: string
}

export interface Notification {
  id: string
  user_id: string
  message: string
  type:
    | 'email'
    | 'push'
    | 'system'
  is_read: boolean
  created_at?: string
}

export interface Log {
  id: string
  user_id?: string | null
  action: string
  status:
    | 'Success'
    | 'Failed'
    | 'Pending'
  created_at?: string
}
