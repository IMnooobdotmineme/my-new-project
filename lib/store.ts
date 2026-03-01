import type { User, Habit, HabitCheckIn } from "./types"

// All operations now use Supabase
// Import and re-export from supabase/habits for backward compatibility
export {
  // Habits
  getHabits,
  getActiveHabits,
  getHabitById,
  createHabit,
  updateHabit,
  archiveHabit,
  deleteHabit,
  getTodaysHabits,
  // Check-ins
  getCheckIns,
  getAllCheckIns,
  checkIn,
  undoCheckIn,
  isCheckedIn,
  // Analytics
  getCurrentStreak,
  getBestStreak,
  getCompletionRate,
  // Helpers
  formatDate,
  isScheduledDay,
} from "./supabase/habits"
