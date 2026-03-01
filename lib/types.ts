export interface User {
  id: string
  email: string
  name: string
  timezone: string
  created_at: string
}

export type ScheduleType = "daily" | "weekly" | "custom"

export interface Habit {
  habit_id: string
  user_id: string
  title: string
  description?: string
  frequency_type: ScheduleType
  custom_days?: number[] // 0=Sun, 1=Mon, ..., 6=Sat
  target_count: number
  start_date: string
  is_active: boolean
  created_at: string
}

export interface HabitCheckIn {
  checkin_id: string
  habit_id: string
  checkin_date: string // YYYY-MM-DD
  status: "done" | "skipped"
}

export interface Reminder {
  reminder_id: string
  habit_id: string
  remind_time: string
  remind_days: number[]
  enabled: boolean
}
