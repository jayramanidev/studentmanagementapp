"use client";

import * as React from "react";
import { useState, useMemo, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { deleteNoticeAction, type NoticeListItem } from "@/actions/notices";
import { NoticePriority, NoticeAudience } from "@prisma/client";
import {
  Megaphone,
  Pin,
  AlertTriangle,
  Info,
  AlertCircle,
  Search,
  Trash2,
  Calendar,
  Users,
  Layers,
} from "lucide-react";

interface NoticeFeedProps {
  notices: NoticeListItem[];
  canDelete?: boolean;
  onRefresh?: () => void;
}

const PRIORITY_CONFIG: Record<
  NoticePriority,
  { label: string; badgeClass: string; cardClass: string; icon: any }
> = {
  INFO: {
    label: "Info",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    cardClass: "border-l-4 border-l-blue-500",
    icon: Info,
  },
  IMPORTANT: {
    label: "Important",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    cardClass: "border-l-4 border-l-amber-500 bg-amber-500/5",
    icon: AlertTriangle,
  },
  URGENT: {
    label: "Urgent Alert",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse",
    cardClass: "border-l-4 border-l-rose-500 bg-rose-500/5",
    icon: AlertCircle,
  },
};

const AUDIENCE_LABELS: Record<NoticeAudience, string> = {
  ALL: "General Notice (All)",
  STUDENTS_ONLY: "Students Only",
  PARENTS_ONLY: "Parents Only",
  FACULTY_ONLY: "Faculty Only",
};

export function NoticeFeed({
  notices,
  canDelete = false,
  onRefresh,
}: NoticeFeedProps) {
  const [search, setSearch] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return notices.filter((n) => {
      if (selectedPriority !== "ALL" && n.priority !== selectedPriority) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.batch && n.batch.name.toLowerCase().includes(q))
      );
    });
  }, [notices, search, selectedPriority]);

  const handleDelete = (notice: NoticeListItem) => {
    if (!confirm(`Delete announcement "${notice.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteNoticeAction(notice.id);
      if (res.success) {
        toast.success("Notice deleted successfully");
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to delete notice");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Urgency Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements, dates, schedules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedPriority("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              selectedPriority === "ALL"
                ? "bg-indigo-600 text-white font-semibold shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Notices ({notices.length})
          </button>
          {Object.entries(PRIORITY_CONFIG).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedPriority(key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                selectedPriority === key
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notice List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border shadow-xs space-y-2">
          <Megaphone className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-sm">No announcements posted</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || selectedPriority !== "ALL"
              ? "Try clearing your search query or urgency filter."
              : "Official notices and alerts from the academy will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const config = PRIORITY_CONFIG[n.priority];
            const Icon = config.icon;
            const dateStr = new Date(n.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card
                key={n.id}
                className={`shadow-xs transition hover:shadow-md ${config.cardClass}`}
              >
                <CardHeader className="pb-2 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {n.isPinned && (
                        <Badge className="bg-indigo-600 text-white gap-1 text-[10px] font-bold">
                          <Pin className="h-3 w-3" /> PINNED
                        </Badge>
                      )}
                      <Badge className={`${config.badgeClass} text-[10px] font-semibold gap-1`}>
                        <Icon className="h-3 w-3" /> {config.label}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground font-medium">
                        {AUDIENCE_LABELS[n.audience]}
                      </Badge>
                      {n.batch && (
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          {n.batch.name}
                        </Badge>
                      )}
                    </div>

                    {canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(n)}
                        disabled={isPending}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                        title="Delete notice"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <CardTitle className="text-base font-bold leading-snug">
                    {n.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="py-2 text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {n.content}
                </CardContent>

                <CardFooter className="pt-2 text-[11px] text-muted-foreground flex items-center justify-between border-t mt-2">
                  <span>Posted: {dateStr}</span>
                  {n.publisher && (
                    <span>
                      By {n.publisher.fullName} ({n.publisher.role})
                    </span>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
