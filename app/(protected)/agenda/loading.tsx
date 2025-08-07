"use client"

import { AppSidebar } from "../../../components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"

export default function AgendaLoading() {
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-52 mt-2" />
            </div>
            <Button disabled variant="outline">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Hoje
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 bg-gray-50">
          {/* Calendar Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-3 w-64 mt-2" />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
                {/* Day headers */}
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="bg-gray-100 border-b border-gray-200 p-3 text-center text-sm font-medium text-gray-700"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days skeleton */}
                {Array.from({ length: 35 }).map((_, index) => (
                  <div key={index} className="h-32 border border-gray-200 bg-background p-2">
                    <Skeleton className="h-4 w-6 mb-2" />
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-full rounded" />
                      <Skeleton className="h-5 w-full rounded" />
                      <Skeleton className="h-5 w-full rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend Skeleton */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}