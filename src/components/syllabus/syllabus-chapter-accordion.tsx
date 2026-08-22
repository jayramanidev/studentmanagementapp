"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  upsertTopicProgressAction,
  markChapterTaughtAction,
  type SyllabusChapter,
  type SyllabusTopicItem,
  type SubjectSyllabusOverview,
} from "@/actions/syllabus";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  BookCheck,
  Loader2,
  ListChecks,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SyllabusChapterAccordionProps {
  subjects: SubjectSyllabusOverview[];
  mode: "student" | "faculty" | "admin";
  batchId: string;
}

const STATUS_ICON = {
  NOT_STARTED: <Circle className="h-4 w-4 text-muted-foreground/50" />,
  IN_PROGRESS: <Clock className="h-4 w-4 text-amber-500" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
};

const STATUS_COLORS = {
  NOT_STARTED: "border-muted-foreground/20 hover:border-muted-foreground/40",
  IN_PROGRESS: "border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/20",
  COMPLETED: "border-emerald-400/40 bg-emerald-50/30 dark:bg-emerald-950/20",
};

export function SyllabusChapterAccordion({
  subjects,
  mode,
  batchId,
}: SyllabusChapterAccordionProps) {
  const router = useRouter();
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [updatingTopicId, setUpdatingTopicId] = useState<string | null>(null);
  const [markingChapter, setMarkingChapter] = useState<string | null>(null);

  const toggleChapter = (key: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const cycleStatus = (topic: SyllabusTopicItem) => {
    const nextMap: Record<string, "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"> = {
      NOT_STARTED: "IN_PROGRESS",
      IN_PROGRESS: "COMPLETED",
      COMPLETED: "NOT_STARTED",
    };
    const nextStatus = nextMap[topic.status];

    setUpdatingTopicId(topic.id);
    startTransition(async () => {
      const res = await upsertTopicProgressAction(topic.id, nextStatus);
      setUpdatingTopicId(null);
      if (res.success) {
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleMarkTaught = (chapter: SyllabusChapter, subjectId: string) => {
    const key = `${subjectId}:${chapter.chapterName}`;
    setMarkingChapter(key);
    startTransition(async () => {
      const res = await markChapterTaughtAction(
        batchId,
        chapter.chapterName,
        subjectId !== "general" ? subjectId : undefined
      );
      setMarkingChapter(null);
      if (res.success) {
        toast.success(`Marked "${chapter.chapterName}" as taught for all students!`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  if (subjects.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <ListChecks className="h-12 w-12 mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">
          No syllabus topics have been added to this batch yet.
        </p>
        {mode !== "student" && (
          <p className="text-xs text-muted-foreground">
            Use the "Add Topics" button above to create chapter-wise syllabus entries.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {subjects.map((sub) => (
        <div key={sub.subjectId} className="space-y-3">
          {/* Subject Header */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                <BookCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{sub.subjectName}</div>
                <div className="text-[11px] text-muted-foreground">
                  {sub.completedTopics} / {sub.totalTopics} topics completed
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                  {sub.completionPct}%
                </div>
              </div>
              <div className="w-24 h-2 rounded-full bg-muted overflow-hidden hidden sm:block">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${sub.completionPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Chapters */}
          <div className="space-y-2 pl-2">
            {sub.chapters.map((ch) => {
              const chKey = `${sub.subjectId}:${ch.chapterName}`;
              const isExpanded = expandedChapters.has(chKey);
              const isMarkingThis = markingChapter === chKey;

              return (
                <div
                  key={chKey}
                  className="rounded-xl border bg-card text-card-foreground shadow-2xs overflow-hidden"
                >
                  {/* Chapter Row */}
                  <button
                    onClick={() => toggleChapter(chKey)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/30 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-semibold text-sm truncate">
                        {ch.chapterName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ch.completedCount === ch.totalCount && ch.totalCount > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px]">
                          ✓ ALL DONE
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground font-medium">
                        {ch.completedCount}/{ch.totalCount}
                      </span>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${ch.completionPct}%` }}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Topics */}
                  {isExpanded && (
                    <div className="border-t bg-muted/10 px-3 pb-3 pt-2 space-y-1.5">
                      {ch.topics.map((topic) => {
                        const isUpdating = updatingTopicId === topic.id;

                        return (
                          <div
                            key={topic.id}
                            className={`flex items-center justify-between p-2 rounded-lg border transition ${STATUS_COLORS[topic.status]}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                              ) : (
                                STATUS_ICON[topic.status]
                              )}
                              <span className="text-xs font-medium truncate">
                                {topic.topicName}
                              </span>
                            </div>

                            {(mode === "student" || mode === "faculty") && (
                              <button
                                onClick={() => cycleStatus(topic)}
                                disabled={isPending}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer disabled:opacity-50"
                              >
                                {topic.status === "NOT_STARTED"
                                  ? "Start"
                                  : topic.status === "IN_PROGRESS"
                                  ? "Complete"
                                  : "Reset"}
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Faculty: Mark Chapter Taught */}
                      {mode === "faculty" && ch.completedCount < ch.totalCount && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkTaught(ch, sub.subjectId)}
                          disabled={isPending}
                          className="w-full mt-2 h-8 text-xs gap-1.5 text-emerald-600 hover:text-emerald-700 border-emerald-300"
                        >
                          {isMarkingThis ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <BookCheck className="h-3.5 w-3.5" />
                          )}
                          Mark Entire Chapter as Taught for All Students
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
