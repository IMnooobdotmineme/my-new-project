"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Habit, ScheduleType } from "@/lib/types"
import { createHabit, updateHabit, formatDate } from "@/lib/store"
import { toast } from "sonner"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface HabitFormProps {
  userId: string
  habit?: Habit | null
  onClose: () => void
  onSaved: () => void
}

export function HabitForm({ userId, habit, onClose, onSaved }: HabitFormProps) {
  const [title, setTitle] = useState(habit?.title || "")
  const [description, setDescription] = useState(habit?.description || "")
  const [frequencyType, setFrequencyType] = useState<ScheduleType>(habit?.frequency_type || "daily")
  const [customDays, setCustomDays] = useState<number[]>(habit?.custom_days || [1, 2, 3, 4, 5])
  const [targetCount, setTargetCount] = useState(habit?.target_count || 1)
  const [startDate, setStartDate] = useState(habit?.start_date || formatDate(new Date()))

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    setIsLoading(true)
    try {
      if (habit) {
        const result = await updateHabit(habit.habit_id, {
          title: title.trim(),
          description: description.trim() || undefined,
          frequency_type: frequencyType,
          custom_days: frequencyType === "custom" ? customDays : undefined,
          target_count: targetCount,
          start_date: startDate,
          is_active: habit.is_active,
        })
        if (result) {
          toast.success("Habit updated!")
        } else {
          toast.error("Failed to update habit")
        }
      } else {
        const result = await createHabit(userId, {
          user_id: userId,
          title: title.trim(),
          description: description.trim() || undefined,
          frequency_type: frequencyType,
          custom_days: frequencyType === "custom" ? customDays : undefined,
          target_count: targetCount,
          start_date: startDate,
          is_active: true,
        })
        if (result) {
          toast.success("Habit created!")
        } else {
          toast.error("Failed to create habit")
        }
      }
      onSaved()
      onClose()
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g. Read for 30 minutes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          placeholder="A short note about this habit"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Schedule</Label>
        <Select value={frequencyType} onValueChange={(v) => setFrequencyType(v as ScheduleType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Every day</SelectItem>
            <SelectItem value="weekly">Once a week (Monday)</SelectItem>
            <SelectItem value="custom">Custom days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {frequencyType === "custom" && (
        <div className="flex flex-col gap-2">
          <Label>Select days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day, idx) => (
              <label
                key={day}
                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={customDays.includes(idx)}
                  onCheckedChange={() => toggleDay(idx)}
                />
                {day}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="target">Target per day</Label>
          <Input
            id="target"
            type="number"
            min={1}
            max={10}
            value={targetCount}
            onChange={(e) => setTargetCount(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? "Saving..." : habit ? "Save Changes" : "Create Habit"}
        </Button>
      </div>
    </form>
  )
}
