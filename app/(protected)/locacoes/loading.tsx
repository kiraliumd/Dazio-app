"use client"

import { AppSidebar } from "../../components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search } from "lucide-react"

export default function LocacoesLoading() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-56 mt-2" />
            </div>
            <Button disabled className="bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 bg-gray-50">
          {/* Filters Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-60 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Skeleton className="h-10 w-full pl-10" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>

          {/* Table Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-80 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">Período</TableHead>
                      <TableHead className="font-semibold">Horários</TableHead>
                      <TableHead className="font-semibold">Valor Total</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}