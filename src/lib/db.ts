import { supabase } from './supabase'

// =========================
// TYPES
// =========================

export type AttendanceStatus = 'present' | 'absent'

export type LogStatus =
  | 'Success'
  | 'Failed'
  | 'Pending'

// =========================
// STUDENTS
// =========================

export async function getStudents() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      users(name, email)
    `)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getStudents:', error.message)
    throw new Error(error.message)
  }

  return data || []
}

export async function getStudentByUserId(
  userId: string
) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error(
      'getStudentByUserId:',
      error.message
    )

    return null
  }

  return data
}

export async function getStudentById(
  studentId: string
) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      users(name, email)
    `)
    .eq('id', studentId)
    .maybeSingle()

  if (error) {
    console.error(
      'getStudentById:',
      error.message
    )

    return null
  }

  return data
}

// =========================
// MARKS
// =========================

export async function getMarksByStudent(
  studentId: string
) {
  const { data, error } = await supabase
    .from('marks')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', {
      ascending: true,
    })

  if (error) {
    console.error(
      'getMarksByStudent:',
      error.message
    )

    throw new Error(error.message)
  }

  return data || []
}

export async function getAllMarks() {
  const { data, error } = await supabase
    .from('marks')
    .select(`
      *,
      students(
        *,
        users(name, email)
      )
    `)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error(
      'getAllMarks:',
      error.message
    )

    throw new Error(error.message)
  }

  return data || []
}

export async function insertMarks(
  entries: {
    student_id: string
    subject: string
    marks_obtained: number
    total_marks: number
    exam_type: string
    entered_by: string
  }[]
) {
  if (entries.length === 0) {
    return true
  }

  // validation
  for (const item of entries) {
    if (item.marks_obtained < 0) {
      throw new Error(
        'Marks cannot be negative'
      )
    }

    if (item.total_marks <= 0) {
      throw new Error(
        'Total marks must be greater than 0'
      )
    }

    if (
      item.marks_obtained >
      item.total_marks
    ) {
      throw new Error(
        'Marks cannot exceed total marks'
      )
    }
  }

  const { error } = await supabase
    .from('marks')
    .insert(entries)

  if (error) {
    console.error(
      'insertMarks:',
      error.message
    )

    throw new Error(error.message)
  }

  return true
}

// =========================
// ATTENDANCE
// =========================

export async function getAttendanceByStudent(
  studentId: string
) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('date', {
      ascending: false,
    })

  if (error) {
    console.error(
      'getAttendanceByStudent:',
      error.message
    )

    throw new Error(error.message)
  }

  return data || []
}

export async function getAllAttendance() {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      students(
        *,
        users(name, email)
      )
    `)
    .order('date', {
      ascending: false,
    })

  if (error) {
    console.error(
      'getAllAttendance:',
      error.message
    )

    throw new Error(error.message)
  }

  return data || []
}

export async function saveAttendance(
  entries: {
    student_id: string
    date: string
    status: AttendanceStatus
    marked_by: string
  }[]
) {
  if (entries.length === 0) {
    return true
  }

  // validation
  for (const item of entries) {
    if (
      item.status !== 'present' &&
      item.status !== 'absent'
    ) {
      throw new Error(
        'Invalid attendance status'
      )
    }
  }

  const { error } = await supabase
    .from('attendance')
    .upsert(entries, {
      onConflict: 'student_id,date',
    })

  if (error) {
    console.error(
      'saveAttendance:',
      error.message
    )

    throw new Error(error.message)
  }

  return true
}

// =========================
// NOTIFICATIONS
// =========================

export async function getNotifications(
  userId: string
) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error(
      'getNotifications:',
      error.message
    )

    throw new Error(error.message)
  }

  return data || []
}

export async function markAllNotificationsRead(
  userId: string
) {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
    })
    .eq('user_id', userId)

  if (error) {
    console.error(
      'markAllNotificationsRead:',
      error.message
    )

    throw new Error(error.message)
  }

  return true
}

// =========================
// USERS
// =========================

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error(
      'getAllUsers:',
      error.message
    )

    throw new Error(error.message)
  }

  return data || []
}

export async function getCurrentUser() {
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser()

  if (
    authError ||
    !authData?.user
  ) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (error) {
    console.error(
      'getCurrentUser:',
      error.message
    )

    return null
  }

  return data
}

// =========================
// LOGS
// =========================

export async function getLogs() {
  const { data, error } = await supabase
    .from('logs')
    .select(`
      *,
      users(name, role)
    `)
    .order('created_at', {
      ascending: false,
    })
    .limit(100)

  if (error) {
    console.error(
      'getLogs:',
      error.message
    )

    throw new Error(error.message)
  }

  return data || []
}

export async function insertLog(entry: {
  user_id?: string | null
  action: string
  status: LogStatus
}) {
  try {
    if (!entry.action?.trim()) {
      console.error(
        'insertLog: action required'
      )

      return false
    }

    const payload = {
      user_id:
        entry.user_id ?? null,
      action:
        entry.action.trim(),
      status: entry.status,
      created_at:
        new Date().toISOString(),
    }

    const { error } =
      await supabase
        .from('logs')
        .insert([payload])

    if (error) {
      console.error(
        'insertLog failed:',
        error.message
      )

      return false
    }

    return true
  } catch (err) {
    console.error(
      'Unexpected insertLog error:',
      err
    )

    return false
  }
}

// =========================
// HELPERS
// =========================

export function scoreToGrade(
  avg: number
): string {
  if (avg >= 90) return 'A+'
  if (avg >= 80) return 'A'
  if (avg >= 70) return 'B+'
  if (avg >= 60) return 'B'
  if (avg >= 50) return 'C'
  if (avg >= 40) return 'D'

  return 'F'
}

export async function getCurrentStudent() {
  const user =
    await getCurrentUser()

  if (!user) {
    return null
  }

  return getStudentByUserId(
    user.id
  )
}

export async function getMarksByStudentId(
  studentId: string
) {
  return getMarksByStudent(
    studentId
  )
}

export async function getMarksOverTime(studentId: string) {
  const marks = await getMarksByStudent(studentId)
  const byWeek: Record<string, Record<string, { total: number; count: number }>> = {}
  for (const m of marks) {
    const d = m.created_at ? new Date(m.created_at) : new Date()
    const week = `W${Math.ceil(d.getDate() / 7)}-${d.getMonth() + 1}`
    if (!byWeek[week]) byWeek[week] = {}
    if (!byWeek[week][m.subject]) byWeek[week][m.subject] = { total: 0, count: 0 }
    byWeek[week][m.subject].total += (m.marks_obtained / m.total_marks) * 100
    byWeek[week][m.subject].count++
  }
  return Object.entries(byWeek).map(([week, subs]) => {
    const row: Record<string, number | string> = { week }
    for (const [sub, v] of Object.entries(subs)) row[sub] = Math.round(v.total / v.count)
    return row
  })
}

export async function getAttendancePercent(
  studentId: string
): Promise<number | null> {
  const records =
    await getAttendanceByStudent(
      studentId
    )

  if (records.length === 0) {
    return null
  }

  const present =
    records.filter(
      (r) =>
        r.status === 'present'
    ).length

  return Math.round(
    (present / records.length) *
      100
  )
}

export async function getSubjectAverages(
  studentId: string
) {
  const marks =
    await getMarksByStudent(
      studentId
    )

  const bySubject: Record<
    string,
    {
      total: number
      count: number
    }
  > = {}

  for (const mark of marks) {
    if (!bySubject[mark.subject]) {
      bySubject[mark.subject] = {
        total: 0,
        count: 0,
      }
    }

    bySubject[
      mark.subject
    ].total +=
      (mark.marks_obtained /
        mark.total_marks) *
      100

    bySubject[
      mark.subject
    ].count += 1
  }

  return Object.entries(
    bySubject
  ).map(([subject, value]) => ({
    subject,
    avg: Math.round(
      value.total / value.count
    ),
  }))
}
