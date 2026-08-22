"use client";

import * as React from "react";
import { DailyAttendanceSheet } from "@/components/attendance/daily-attendance-sheet";
import { MonthlyAttendanceSummary } from "@/components/attendance/monthly-attendance-summary";
import { type BatchItem } from "@/actions/batches";
import { CalendarCheck, Calendar } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface AdminAttendanceClientProps {
  batches: BatchItem[];
}

export function AdminAttendanceClient({ batches }: AdminAttendanceClientProps) {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CalendarCheck className="h-6 w-6" />
          </div>
          Academy Attendance Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review daily attendance across all branches, identify high-risk absence patterns, and verify batch registers.
        </p>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="daily" className="text-xs font-semibold gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5" /> Daily Register
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs font-semibold gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Monthly Summary Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-0">
          <DailyAttendanceSheet batches={batches} />
        </TabsContent>

        <TabsContent value="monthly" className="mt-0">
          <MonthlyAttendanceSummary batches={batches} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
