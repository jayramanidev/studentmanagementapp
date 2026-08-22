"use client";

import * as React from "react";
import { ParentScorecard } from "@/components/parent/parent-scorecard";
import { type ParentChildSummary } from "@/actions/performance";
import { Users, GraduationCap } from "lucide-react";

interface ParentClientProps {
  childrenData: ParentChildSummary[];
}

export function ParentClient({ childrenData }: ParentClientProps) {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            Parent Monitoring Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time offline test reports, attendance status, and competition rank trajectories for your ward.
          </p>
        </div>
      </div>

      {/* Main Scorecard Component */}
      <ParentScorecard childrenData={childrenData} />
    </div>
  );
}
