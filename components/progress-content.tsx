"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Flame, Trophy, TrendingUp, Calendar } from "lucide-react"
import { getActiveHabits, getCheckIns, getCurrentStreak, getBestStreak, getCompletionRate, formatDate, isScheduledDay } from "@/lib/store"
import type { Habit, HabitCheckIn } from "@/lib/types"
import { cn } from "@/lib/utils"

function HabitCalendar({ habit }: { habit: Habit }) {
  const [checkinDates, setCheckinDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true

    const loadCheckIns = async () => {
      const checkins = await getCheckIns(habit.habit_id)
      if (mounted) {
        setCheckinDates(new Set(checkins.map((c) => c.checkin_date)))
      }
    }

    loadCheckIns()

    return () => {
      mounted = false
    }
  }, [habit.habit_id])

  // Show last 35 days (5 weeks)
  const days: { date: Date; dateStr: string; inMonth: boolean }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 34; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push({
      date: d,
      dateStr: formatDate(d),
      inMonth: d.getMonth() === today.getMonth(),
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="mb-1 flex gap-1 text-xs text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={`${d}-${i}`} className="flex size-7 items-center justify-center">
            {d}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {days.map((day) => {
          const isToday = day.dateStr === formatDate(today)
          const isDone = checkinDates.has(day.dateStr)
          const isScheduled = isScheduledDay(habit, day.date)
          return (
            <div
              key={day.dateStr}
              title={`${day.dateStr}${isDone ? " - Done" : isScheduled ? " - Missed" : ""}`}
              className={cn(
                "size-7 rounded-md text-xs flex items-center justify-center",
                isDone && "bg-primary text-primary-foreground font-medium",
                !isDone && isScheduled && day.date < today && "bg-destructive/15 text-destructive",
                !isDone && !isScheduled && "bg-muted/50 text-muted-foreground/50",
                !isDone && isScheduled && day.date >= today && "bg-muted text-muted-foreground",
                isToday && !isDone && "ring-1 ring-primary",
              )}
            >
              {day.date.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ProgressContent({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true)
  const [activeHabits, setActiveHabits] = useState<Habit[]>([])
  const [selectedHabitId, setSelectedHabitId] = useState<string>("")
  const [selectedStats, setSelectedStats] = useState<{
    streak: number
    bestStreak: number
    rate7: number
    rate30: number
  }>({ streak: 0, bestStreak: 0, rate7: 0, rate30: 0 })
  const [overallStats, setOverallStats] = useState({ rate7: 0, rate30: 0 })
  const [habitRates, setHabitRates] = useState<{ habitId: string; rate: number }[]>([])

  // Load active habits on component mount
  useEffect(() => {
    let mounted = true

    const loadActiveHabits = async () => {
      // Guard: userId must be defined
      if (!userId) {
        setLoading(false)
        return
      }
      
      setLoading(true)
      const habits = await getActiveHabits(userId)
      if (mounted) {
        setActiveHabits(habits)
        if (habits.length > 0) {
          setSelectedHabitId(habits[0].habit_id)
        }
        setLoading(false)
      }
    }

    loadActiveHabits()

    return () => {
      mounted = false
    }
  }, [userId])

  // Load overall stats and habit rates
  useEffect(() => {
    let mounted = true

    const loadOverallStats = async () => {
      if (activeHabits.length === 0) {
        setOverallStats({ rate7: 0, rate30: 0 })
        setHabitRates([])
        return
      }

      const rates7 = await Promise.all(activeHabits.map((h) => getCompletionRate(h.habit_id, 7)))
      const rates30 = await Promise.all(activeHabits.map((h) => getCompletionRate(h.habit_id, 30)))

      if (mounted) {
        const overallRate7 = Math.round(rates7.reduce((sum, r) => sum + r, 0) / activeHabits.length)
        const overallRate30 = Math.round(rates30.reduce((sum, r) => sum + r, 0) / activeHabits.length)

        setOverallStats({ rate7: overallRate7, rate30: overallRate30 })

        // Calculate habit rates for leaderboard
        const habitRatesData = activeHabits.map((habit, idx) => ({
          habitId: habit.habit_id,
          rate: rates7[idx],
        }))
        setHabitRates(habitRatesData)
      }
    }

    loadOverallStats()

    return () => {
      mounted = false
    }
  }, [activeHabits])

  // Load selected habit stats
  useEffect(() => {
    let mounted = true

    const loadSelectedHabitStats = async () => {
      if (!selectedHabitId) {
        setSelectedStats({ streak: 0, bestStreak: 0, rate7: 0, rate30: 0 })
        return
      }

      const streak = await getCurrentStreak(selectedHabitId)
      const bestStreak = await getBestStreak(selectedHabitId)
      const rate7 = await getCompletionRate(selectedHabitId, 7)
      const rate30 = await getCompletionRate(selectedHabitId, 30)

      if (mounted) {
        setSelectedStats({ streak, bestStreak, rate7, rate30 })
      }
    }

    loadSelectedHabitStats()

    return () => {
      mounted = false
    }
  }, [selectedHabitId])

  // Show loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          Progress
        </h1>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading your progress...
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show empty state
  if (activeHabits.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          Progress
        </h1>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No active habits to show progress for. Create some habits first!
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedHabit = activeHabits.find((h) => h.habit_id === selectedHabitId) || null

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
        Progress
      </h1>

      {/* Overall Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <TrendingUp className="mb-1 size-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{overallStats.rate7}%</span>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Calendar className="mb-1 size-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{overallStats.rate30}%</span>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </CardContent>
        </Card>
      </div>

      {/* Habit Selector */}
      <div className="mb-4">
        <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a habit" />
          </SelectTrigger>
          <SelectContent>
            {activeHabits.map((h) => (
              <SelectItem key={h.habit_id} value={h.habit_id}>
                {h.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedHabit && (
        <>
          {/* Habit Stats */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="flex flex-col items-center p-3">
                <Flame className="mb-1 size-4 text-primary" />
                <span className="text-lg font-bold text-foreground">{selectedStats.streak}</span>
                <span className="text-xs text-muted-foreground">Current</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-3">
                <Trophy className="mb-1 size-4 text-primary" />
                <span className="text-lg font-bold text-foreground">{selectedStats.bestStreak}</span>
                <span className="text-xs text-muted-foreground">Best</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-3">
                <span className="text-lg font-bold text-foreground">{selectedStats.rate7}%</span>
                <span className="text-xs text-muted-foreground">7-day rate</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-3">
                <span className="text-lg font-bold text-foreground">{selectedStats.rate30}%</span>
                <span className="text-xs text-muted-foreground">30-day rate</span>
              </CardContent>
            </Card>
          </div>

          {/* Completion Bar */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">7-Day Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={selectedStats.rate7} className="h-3" />
              <p className="mt-2 text-xs text-muted-foreground">{selectedStats.rate7}% of scheduled days completed</p>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Last 35 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <HabitCalendar habit={selectedHabit} />
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block size-3 rounded bg-primary" /> Done
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-3 rounded bg-destructive/15" /> Missed
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-3 rounded bg-muted" /> Not scheduled
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Per-Habit Leaderboard */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Habit Consistency (7 days)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {habitRates
            .sort((a, b) => b.rate - a.rate)
            .map(({ habitId, rate }) => {
              const habit = activeHabits.find((h) => h.habit_id === habitId)
              if (!habit) return null
              return (
                <div key={habitId} className="flex items-center gap-3">
                  <span className="flex-1 truncate text-sm text-foreground">{habit.title}</span>
                  <div className="w-24">
                    <Progress value={rate} className="h-2" />
                  </div>
                  <span className="w-10 text-right text-xs font-medium text-muted-foreground">{rate}%</span>
                </div>
              )
            })}
        </CardContent>
      </Card>
    </div>
  )
}
