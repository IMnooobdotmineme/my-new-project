import type { Habit, HabitCheckIn } from "../types"
import type { Database } from "./types"
import { createClient } from "./client"

type HabitRow = Database['public']['Tables']['habits']['Row']
type CheckInRow = Database['public']['Tables']['habit_checkins']['Row']

// ============================================================
// HABITS OPERATIONS
// ============================================================

export async function getHabits(userId: string): Promise<Habit[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching habits:", error?.message || error?.code || JSON.stringify(error))
    return []
  }

  return (data || []).map(mapRowToHabit)
}

export async function getActiveHabits(userId: string): Promise<Habit[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching active habits:", error?.message || error?.code || JSON.stringify(error))
    return []
  }

  return (data || []).map(mapRowToHabit)
}

export async function getHabitById(habitId: string): Promise<Habit | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("id", habitId)
    .single<HabitRow>()

  if (error) {
    console.error("Error fetching habit:", error?.message || error?.code || JSON.stringify(error))
    return null
  }

  return data ? mapRowToHabit(data) : null
}

export async function createHabit(
  userId: string,
  habit: Omit<Habit, "habit_id" | "created_at">
): Promise<Habit | null> {
  const supabase = createClient()
  const { data, error } = await (supabase
    .from("habits")
    .insert([
      {
        user_id: userId,
        title: habit.title,
        description: habit.description || null,
        frequency_type: habit.frequency_type,
        custom_days: habit.custom_days || null,
        target_count: habit.target_count,
        start_date: habit.start_date,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as any)
    .select() as any)
    .single()

  if (error) {
    console.error("Error creating habit:", error?.message || error?.code || JSON.stringify(error))
    return null
  }

  return data ? mapRowToHabit(data) : null
}

export async function updateHabit(
  habitId: string,
  updates: Partial<Habit>
): Promise<Habit | null> {
  const supabase = createClient()
  const { data, error } = await ((supabase
    .from("habits") as any)
    .update({
      ...(updates.title && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.frequency_type && { frequency_type: updates.frequency_type }),
      ...(updates.custom_days !== undefined && { custom_days: updates.custom_days }),
      ...(updates.target_count && { target_count: updates.target_count }),
      ...(updates.is_active !== undefined && { is_active: updates.is_active }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", habitId)
    .select() as any)
    .single()

  if (error) {
    console.error("Error updating habit:", error?.message || error?.code || JSON.stringify(error))
    return null
  }

  return data ? mapRowToHabit(data) : null
}

export async function archiveHabit(habitId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await (supabase
    .from("habits") as any)
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", habitId)

  if (error) {
    console.error("Error archiving habit:", error?.message || error?.code || JSON.stringify(error))
  }
}

export async function deleteHabit(habitId: string): Promise<void> {
  const supabase = createClient()
  // Delete all check-ins first (cascaded by DB but explicit for clarity)
  const { error: checkInError } = await supabase.from("habit_checkins").delete().eq("habit_id", habitId)
  if (checkInError) {
    console.error("Error deleting check-ins:", checkInError?.message || checkInError?.code || JSON.stringify(checkInError))
  }
  // Delete habit
  const { error: habitError } = await supabase.from("habits").delete().eq("id", habitId)
  if (habitError) {
    console.error("Error deleting habit:", habitError?.message || habitError?.code || JSON.stringify(habitError))
  }
}

export async function getTodaysHabits(userId: string): Promise<Habit[]> {
  const habits = await getActiveHabits(userId)
  const today = new Date()
  return habits.filter((h) => isScheduledDay(h, today))
}

// ============================================================
// CHECK-IN OPERATIONS
// ============================================================

export async function getCheckIns(habitId: string): Promise<HabitCheckIn[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("habit_checkins")
    .select("*")
    .eq("habit_id", habitId)
    .order("checkin_date", { ascending: false })

  if (error) {
    console.error("Error fetching check-ins:", error?.message || error?.code || JSON.stringify(error))
    return []
  }

  return (data || []).map(mapRowToCheckIn)
}

export async function getAllCheckIns(userId: string): Promise<HabitCheckIn[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("habit_checkins")
    .select("*")
    .eq("user_id", userId)
    .order("checkin_date", { ascending: false })

  if (error) {
    console.error("Error fetching all check-ins:", error?.message || error?.code || JSON.stringify(error))
    return []
  }

  return (data || []).map(mapRowToCheckIn)
}

export async function checkIn(
  habitId: string,
  userId: string,
  date: string
): Promise<HabitCheckIn | null> {
  const supabase = createClient()

  // Check if already checked in
  const { data: existing } = await supabase
    .from("habit_checkins")
    .select("id")
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .eq("checkin_date", date)
    .single()

  if (existing) {
    console.warn("Already checked in for this date")
    return null
  }

  const { data, error } = await (supabase
    .from("habit_checkins")
    .insert([
      {
        habit_id: habitId,
        user_id: userId,
        checkin_date: date,
        status: "done",
        created_at: new Date().toISOString(),
      },
    ] as any)
    .select() as any)
    .single()

  if (error) {
    console.error("Error creating check-in:", error?.message || error?.code || JSON.stringify(error))
    return null
  }

  return data ? mapRowToCheckIn(data) : null
}

export async function undoCheckIn(habitId: string, userId: string, date: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("habit_checkins")
    .delete()
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .eq("checkin_date", date)
  
  if (error) {
    console.error("Error undoing check-in:", error?.message || error?.code || JSON.stringify(error))
  }
}

export async function isCheckedIn(habitId: string, userId: string, date: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("habit_checkins")
    .select("id")
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .eq("checkin_date", date)
    .single()

  if (error) {
    // Not found is expected
    if (error.code === "PGRST116") return false
    console.error("Error checking if checked in:", error?.message || error?.code || JSON.stringify(error))
    return false
  }

  return !!data
}

// ============================================================
// ANALYTICS OPERATIONS
// ============================================================

export async function getCurrentStreak(habitId: string): Promise<number> {
  const checkins = await getCheckIns(habitId)
  const habit = await getHabitById(habitId)
  if (!habit || checkins.length === 0) return 0

  const dates = checkins.map((c) => c.checkin_date).sort().reverse()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  let currentDate = new Date(today)

  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(currentDate)
    if (isScheduledDay(habit, currentDate)) {
      if (dates.includes(dateStr)) {
        streak++
      } else {
        if (i === 0) {
          currentDate.setDate(currentDate.getDate() - 1)
          continue
        }
        break
      }
    }
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

export async function getBestStreak(habitId: string): Promise<number> {
  const checkins = await getCheckIns(habitId)
  const habit = await getHabitById(habitId)
  if (!habit || checkins.length === 0) return 0

  const dates = new Set(checkins.map((c) => c.checkin_date))
  const startDate = new Date(habit.start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let best = 0
  let current = 0
  const d = new Date(startDate)

  while (d <= today) {
    if (isScheduledDay(habit, d)) {
      if (dates.has(formatDate(d))) {
        current++
        best = Math.max(best, current)
      } else {
        current = 0
      }
    }
    d.setDate(d.getDate() + 1)
  }

  return best
}

export async function getCompletionRate(habitId: string, days: number): Promise<number> {
  const habit = await getHabitById(habitId)
  if (!habit) return 0

  const checkins = await getCheckIns(habitId)
  const dates = new Set(checkins.map((c) => c.checkin_date))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let scheduled = 0
  let completed = 0

  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (isScheduledDay(habit, d)) {
      scheduled++
      if (dates.has(formatDate(d))) completed++
    }
  }

  return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
}

// ============================================================
// HELPERS
// ============================================================

export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function isScheduledDay(habit: Habit, date: Date): boolean {
  const day = date.getDay()
  if (habit.frequency_type === "daily") return true
  if (habit.frequency_type === "weekly") {
    return day === 1
  }
  if (habit.frequency_type === "custom" && habit.custom_days) {
    return habit.custom_days.includes(day)
  }
  return true
}

// ============================================================
// MAPPERS
// ============================================================

function mapRowToHabit(row: HabitRow): Habit {
  return {
    habit_id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description || undefined,
    frequency_type: row.frequency_type as "daily" | "weekly" | "custom",
    custom_days: row.custom_days || undefined,
    target_count: row.target_count,
    start_date: row.start_date,
    is_active: row.is_active,
    created_at: row.created_at,
  }
}

function mapRowToCheckIn(row: CheckInRow): HabitCheckIn {
  return {
    checkin_id: row.id,
    habit_id: row.habit_id,
    checkin_date: row.checkin_date,
    status: row.status as "done" | "skipped",
  }
}
