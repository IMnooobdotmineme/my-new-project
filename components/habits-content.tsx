"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Archive, Trash2, Flame, RotateCcw } from "lucide-react"
import { getHabits, archiveHabit, deleteHabit, updateHabit, getCurrentStreak, getCompletionRate } from "@/lib/store"
import type { Habit } from "@/lib/types"
import { HabitForm } from "@/components/habit-form"
import { toast } from "sonner"

export function HabitsContent({ userId }: { userId: string }) {
  const [allHabits, setAllHabits] = useState<Habit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadHabits = useCallback(async () => {
    // Guard: userId must be defined
    if (!userId) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const habits = await getHabits(userId)
      setAllHabits(habits)
    } catch (error) {
      console.error("Failed to load habits:", error)
      toast.error("Failed to load habits")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  const activeHabits = allHabits.filter((h) => h.is_active)
  const archivedHabits = allHabits.filter((h) => !h.is_active)
  const displayHabits = showArchived ? archivedHabits : activeHabits

  const handleArchive = async (habit: Habit) => {
    try {
      await archiveHabit(habit.habit_id)
      toast.success(`"${habit.title}" archived`)
      loadHabits()
    } catch (error) {
      toast.error("Failed to archive habit")
    }
  }

  const handleRestore = async (habit: Habit) => {
    try {
      await updateHabit(habit.habit_id, { is_active: true })
      toast.success(`"${habit.title}" restored`)
      loadHabits()
    } catch (error) {
      toast.error("Failed to restore habit")
    }
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteHabit(deleteTarget.habit_id)
        toast.success(`"${deleteTarget.title}" deleted`)
        setDeleteTarget(null)
        loadHabits()
      } catch (error) {
        toast.error("Failed to delete habit")
      }
    }
  }

  const scheduleLabel = (h: Habit) => {
    if (h.frequency_type === "daily") return "Daily"
    if (h.frequency_type === "weekly") return "Weekly"
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return h.custom_days?.map((d) => days[d]).join(", ") || "Custom"
  }

  if (loading && allHabits.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="text-center text-muted-foreground">Loading habits...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          My Habits
        </h1>
        <Button onClick={() => { setEditHabit(null); setShowForm(true) }} className="gap-1">
          <Plus className="size-4" />
          New Habit
        </Button>
      </div>

      {/* Tab Toggles */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={showArchived ? "outline" : "default"}
          size="sm"
          onClick={() => setShowArchived(false)}
        >
          Active ({activeHabits.length})
        </Button>
        <Button
          variant={showArchived ? "default" : "outline"}
          size="sm"
          onClick={() => setShowArchived(true)}
        >
          Archived ({archivedHabits.length})
        </Button>
      </div>

      {/* Habit List */}
      <div className="flex flex-col gap-3">
        {displayHabits.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {showArchived ? "No archived habits." : "No habits yet. Create one to get started!"}
            </CardContent>
          </Card>
        ) : (
          displayHabits.map((habit) => (
            <HabitCard
              key={habit.habit_id}
              habit={habit}
              scheduleLabel={scheduleLabel(habit)}
              isArchived={showArchived}
              onArchive={() => handleArchive(habit)}
              onRestore={() => handleRestore(habit)}
              onDelete={() => setDeleteTarget(habit)}
              onEdit={() => { setEditHabit(habit); setShowForm(true) }}
            />
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editHabit ? "Edit Habit" : "New Habit"}</DialogTitle>
          </DialogHeader>
          <HabitForm
            userId={userId}
            habit={editHabit}
            onClose={() => setShowForm(false)}
            onSaved={loadHabits}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete habit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.title}&quot; and all its check-in history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function HabitCard({
  habit,
  scheduleLabel,
  isArchived,
  onArchive,
  onRestore,
  onDelete,
  onEdit,
}: {
  habit: Habit
  scheduleLabel: string
  isArchived: boolean
  onArchive: () => void
  onRestore: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const [streak, setStreak] = useState(0)
  const [completion, setCompletion] = useState(0)

  useEffect(() => {
    const loadStats = async () => {
      const s = await getCurrentStreak(habit.habit_id)
      const c = await getCompletionRate(habit.habit_id, 30)
      setStreak(s)
      setCompletion(c)
    }
    loadStats()
  }, [habit.habit_id])

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{habit.title}</h3>
            {habit.description && <p className="mt-1 text-sm text-muted-foreground">{habit.description}</p>}
            <div className="mt-3 flex gap-2">
              <Badge variant="outline" className="text-xs">
                {scheduleLabel}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Flame className="size-3" />
                {streak}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {completion}% (30d)
              </Badge>
            </div>
          </div>
          <div className="ml-2 flex flex-col gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="size-4" />
            </Button>
            {isArchived ? (
              <Button variant="ghost" size="sm" onClick={onRestore}>
                <RotateCcw className="size-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onArchive}>
                <Archive className="size-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}