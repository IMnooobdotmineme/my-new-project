"use client"

import Link from "next/link"
import { CheckCircle2, BarChart3, Zap, Target, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: CheckCircle2,
    title: "One-Tap Check-ins",
    description: "Mark habits done in a single tap. Quick, effortless daily tracking.",
  },
  {
    icon: Zap,
    title: "Streak Tracking",
    description: "Watch your streaks grow. Stay motivated by keeping your chain alive.",
  },
  {
    icon: BarChart3,
    title: "Visual Progress",
    description: "Calendar heatmaps and completion rates to see how far you have come.",
  },
  {
    icon: Target,
    title: "Flexible Scheduling",
    description: "Daily, weekly, or custom days. Set habits that fit your life.",
  },
]

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <Target className="size-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            HabitFlow
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center lg:py-24">
        <div className="mx-auto max-w-2xl">
          <h1
            className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Track your habits.
            <br />
            <span className="text-primary">Build your best self.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
            A simple, focused habit tracker to help you stay consistent. 
            Check in daily, build streaks, and watch your progress grow.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Tracking
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                I have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <h2
            className="text-center text-2xl font-bold text-foreground sm:text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Everything you need
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-muted-foreground">
            Simple tools to help you build and maintain positive habits every day.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-xl border border-border bg-background p-5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
        HabitFlow &mdash; Build better habits, one day at a time.
      </footer>
    </div>
  )
}
