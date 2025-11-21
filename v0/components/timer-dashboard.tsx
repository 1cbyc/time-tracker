"use client"

import * as React from "react"
import { Play, Pause, Plus, Clock, Tag, MoreHorizontal, BarChart2, Settings, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Types
type TimeEntry = {
  id: string
  description: string
  project: string
  startTime: Date
  endTime?: Date
  duration: number // in seconds
}

type Project = {
  id: string
  name: string
  color: string
}

const PROJECTS: Project[] = [
  { id: "1", name: "Design System", color: "bg-pink-500" },
  { id: "2", name: "Website Redesign", color: "bg-blue-500" },
  { id: "3", name: "Mobile App", color: "bg-purple-500" },
  { id: "4", name: "Marketing", color: "bg-orange-500" },
]

export function TimerDashboard() {
  // State
  const [isRunning, setIsRunning] = React.useState(false)
  const [elapsedTime, setElapsedTime] = React.useState(0)
  const [currentTask, setCurrentTask] = React.useState("")
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  const [entries, setEntries] = React.useState<TimeEntry[]>([
    {
      id: "1",
      description: "Homepage layout",
      project: "2",
      startTime: new Date(Date.now() - 7200000),
      endTime: new Date(Date.now() - 3600000),
      duration: 3600,
    },
    {
      id: "2",
      description: "Icon set refinement",
      project: "1",
      startTime: new Date(Date.now() - 10800000),
      endTime: new Date(Date.now() - 9000000),
      duration: 1800,
    },
    {
      id: "3",
      description: "Client meeting",
      project: "4",
      startTime: new Date(Date.now() - 18000000),
      endTime: new Date(Date.now() - 14400000),
      duration: 3600,
    },
  ])

  // Timer Logic
  React.useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleStartStop = () => {
    if (isRunning) {
      // Stop
      const newEntry: TimeEntry = {
        id: Math.random().toString(36).substr(2, 9),
        description: currentTask || "(No description)",
        project: selectedProject?.id || "0",
        startTime: new Date(Date.now() - elapsedTime * 1000),
        endTime: new Date(),
        duration: elapsedTime,
      }
      setEntries([newEntry, ...entries])
      setElapsedTime(0)
      setIsRunning(false)
      setCurrentTask("")
    } else {
      // Start
      setIsRunning(true)
    }
  }

  const getProject = (id: string) => PROJECTS.find((p) => p.id === id)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card/50 md:flex">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Clock className="h-5 w-5" />
            </div>
            <span>TimeTrack</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid gap-1 px-2">
            <Button variant="ghost" className="justify-start gap-3 bg-accent/50 text-accent-foreground">
              <Clock className="h-4 w-4" />
              Timer
            </Button>
            <Button variant="ghost" className="justify-start gap-3">
              <BarChart2 className="h-4 w-4" />
              Reports
            </Button>
            <Button variant="ghost" className="justify-start gap-3">
              <Folder className="h-4 w-4" />
              Projects
            </Button>
            <Button variant="ghost" className="justify-start gap-3">
              <Tag className="h-4 w-4" />
              Tags
            </Button>
          </nav>

          <Separator className="my-4 mx-2 w-auto" />

          <div className="px-4 py-2">
            <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</h3>
            <div className="grid gap-1">
              {PROJECTS.map((project) => (
                <Button key={project.id} variant="ghost" className="justify-start gap-3 text-sm font-normal">
                  <span className={cn("h-2 w-2 rounded-full", project.color)} />
                  {project.name}
                </Button>
              ))}
              <Button variant="ghost" className="justify-start gap-3 text-muted-foreground">
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header / Timer Bar */}
        <header className="border-b border-border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-4 rounded-lg border border-input bg-background p-2 shadow-sm">
              <Input
                placeholder="What are you working on?"
                className="border-none bg-transparent text-lg shadow-none focus-visible:ring-0"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
              />

              <div className="hidden items-center gap-2 sm:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-2", selectedProject ? "text-foreground" : "text-muted-foreground")}
                  onClick={() => {
                    // Simple toggle for demo - in real app would be a dropdown
                    const nextIndex = selectedProject
                      ? (PROJECTS.findIndex((p) => p.id === selectedProject.id) + 1) % PROJECTS.length
                      : 0
                    setSelectedProject(PROJECTS[nextIndex])
                  }}
                >
                  {selectedProject ? (
                    <>
                      <span className={cn("h-2 w-2 rounded-full", selectedProject.color)} />
                      {selectedProject.name}
                    </>
                  ) : (
                    <>
                      <Folder className="h-4 w-4" />
                      Project
                    </>
                  )}
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="w-24 text-center font-mono text-xl font-medium tabular-nums">
                  {formatTime(elapsedTime)}
                </div>
                <Button
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full transition-all",
                    isRunning ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90",
                  )}
                  onClick={handleStartStop}
                >
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </Button>
              </div>
            </div>

            {/* Mobile Timer Controls */}
            <div className="flex items-center justify-between sm:hidden">
              <div className="font-mono text-2xl font-medium tabular-nums">{formatTime(elapsedTime)}</div>
              <Button
                size="icon"
                className={cn("h-12 w-12 rounded-full", isRunning ? "bg-destructive" : "bg-primary")}
                onClick={handleStartStop}
              >
                {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Stats Overview */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Time Today</div>
                <div className="mt-2 text-2xl font-bold">4h 12m</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Billable Amount</div>
                <div className="mt-2 text-2xl font-bold">$420.00</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Active Projects</div>
                <div className="mt-2 text-2xl font-bold">3</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Most Tracked</div>
                <div className="mt-2 text-lg font-medium truncate">Website Redesign</div>
              </Card>
            </div>

            {/* Time Entries */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Today</h2>
                <div className="text-sm text-muted-foreground">Total: 4h 12m</div>
              </div>

              <div className="rounded-lg border border-border bg-card shadow-sm">
                {entries.map((entry, index) => {
                  const project = getProject(entry.project)
                  return (
                    <div key={entry.id}>
                      <div className="group flex flex-col gap-3 p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center">
                        <div className="flex-1">
                          <div className="font-medium">{entry.description}</div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground sm:hidden">
                            {project && (
                              <span
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1.5",
                                )}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full", project.color)} />
                                {project.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="hidden flex-1 sm:block">
                          {project ? (
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                              <span className={cn("h-2 w-2 rounded-full", project.color)} />
                              {project.name}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">No Project</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                              {entry.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                              {entry.endTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="w-20 text-right font-mono font-medium">{formatTime(entry.duration)}</div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {index < entries.length - 1 && <Separator />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
