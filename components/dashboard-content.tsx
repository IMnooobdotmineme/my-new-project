"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Flame, Target, TrendingUp, Plus } from "lucide-react"
import { getTodaysHabits, isCheckedIn, checkIn, undoCheckIn, formatDate, getCurrentStreak, getActiveHabits } from "@/lib/store"
import type { Habit } from "@/lib/types"
import Link from "next/link"
import { toast } from "sonner"

export function DashboardContent({ userId, userName }: { userId: string; userName: string }) {
  const [todaysHabits, setTodaysHabits] = useState<Habit[]>([])
  const [allActive, setAllActive] = useState<Habit[]>([])
  const [checkedCount, setCheckedCount] = useState(0)
  const [bestCurrentStreak, setBestCurrentStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayStr = formatDate(today)

  const loadData = useCallback(async () => {
    // Guard: userId must be defined
    if (!userId) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const todays = await getTodaysHabits(userId)
      const active = await getActiveHabits(userId)
      setTodaysHabits(todays)
      setAllActive(active)

      // Count checked-in habits for today
      let checked = 0
      for (const h of todays) {
        if (await isCheckedIn(h.habit_id, userId, todayStr)) {
          checked++
        }
      }
      setCheckedCount(checked)

      // Find best current streak
      let bestStreak = 0
      for (const h of active) {
        const s = await getCurrentStreak(h.habit_id)
        if (s > bestStreak) bestStreak = s
      }
      setBestCurrentStreak(bestStreak)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [userId, todayStr])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalToday = todaysHabits.length
  const progress = totalToday === 0 ? 0 : Math.round((checkedCount / totalToday) * 100)

  const handleToggle = async (habit: Habit) => {
    try {
      const done = await isCheckedIn(habit.habit_id, userId, todayStr)
      if (done) {
        await undoCheckIn(habit.habit_id, userId, todayStr)
        toast.info(`Undid check-in for "${habit.title}"`)
      } else {
        await checkIn(habit.habit_id, userId, todayStr)
        toast.success(`Completed "${habit.title}"!`)
      }
      loadData()
    } catch (error) {
      toast.error("Failed to toggle check-in")
    }
  }

  const greeting = () => {
    const hour = today.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          {greeting()}, {userName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Target className="mb-1 size-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{checkedCount}/{totalToday}</span>
            <span className="text-xs text-muted-foreground">Today</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Flame className="mb-1 size-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{bestCurrentStreak}</span>
            <span className="text-xs text-muted-foreground">Best Streak</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <TrendingUp className="mb-1 size-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{progress}%</span>
            <span className="text-xs text-muted-foreground">Done</span>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {totalToday > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{"Today's progress"}</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      )}

      {/* Today's Habits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">{"Today's Habits"}</CardTitle>
          <Link href="/habits">
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="size-3.5" />
              Add
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {totalToday === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No habits scheduled for today.</p>
              <Link href="/habits">
                <Button variant="link" className="mt-2 text-primary">
                  Create your first habit
                </Button>
              </Link>
            </div>
          ) : (
            todaysHabits.map((habit) => {
              const done = isCheckedIn(habit.habit_id, todayStr)
              const streak = getCurrentStreak(habit.habit_id)
              return (
                <button
                  key={habit.habit_id}
                  onClick={() => handleToggle(habit)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    done
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="size-6 shrink-0 text-primary" />
                  ) : (
                    <Circle className="size-6 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${done ? "text-primary line-through" : "text-foreground"}`}>
                      {habit.title}
                    </span>
                    {habit.description && (
                      <p className="text-xs text-muted-foreground">{habit.description}</p>
                    )}
                  </div>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="size-3.5 text-primary" />
                      {streak}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
