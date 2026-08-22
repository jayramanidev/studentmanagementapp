"use client";

import * as React from "react";
import { useState, useMemo, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { deleteMaterialAction, type MaterialListItem } from "@/actions/materials";
import { MaterialCategory } from "@prisma/client";
import {
  BookOpen,
  Download,
  ExternalLink,
  Search,
  Layers,
  Calendar,
  Trash2,
  FileText,
  Bookmark,
  Sparkles,
} from "lucide-react";

interface MaterialGridProps {
  materials: MaterialListItem[];
  canDelete?: boolean;
  onRefresh?: () => void;
}

const CATEGORY_BADGES: Record<
  MaterialCategory,
  { label: string; color: string; icon: string }
> = {
  CLASS_NOTES: {
    label: "Class Notes",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    icon: "📝",
  },
  PYQ_PAPER: {
    label: "PYQ Paper",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    icon: "📄",
  },
  REFERENCE_BOOK: {
    label: "Reference Book",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    icon: "📚",
  },
  SYLLABUS_COPY: {
    label: "Syllabus Copy",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    icon: "🎯",
  },
};

export function MaterialGrid({
  materials,
  canDelete = false,
  onRefresh,
}: MaterialGridProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      if (selectedCategory !== "ALL" && m.category !== selectedCategory) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.subject && m.subject.name.toLowerCase().includes(q)) ||
        m.batch.name.toLowerCase().includes(q)
      );
    });
  }, [materials, search, selectedCategory]);

  const handleDelete = (material: MaterialListItem) => {
    if (!confirm(`Delete resource "${material.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteMaterialAction(material.id);
      if (res.success) {
        toast.success("Study material deleted successfully");
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to delete material");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes, PYQs, subjects, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              selectedCategory === "ALL"
                ? "bg-indigo-600 text-white font-semibold shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Resources ({materials.length})
          </button>
          {Object.entries(CATEGORY_BADGES).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                selectedCategory === key
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {info.icon} {info.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Materials */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border shadow-xs space-y-2">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-sm">No study materials found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || selectedCategory !== "ALL"
              ? "Try clearing your search query or filters."
              : "Resources uploaded by faculty will appear here for download."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const cat = CATEGORY_BADGES[m.category];
            const dateStr = new Date(m.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <Card
                key={m.id}
                className="shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition flex flex-col justify-between"
              >
                <CardHeader className="pb-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={`${cat.color} text-[10px] font-semibold`}>
                      {cat.icon} {cat.label}
                    </Badge>
                    {canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(m)}
                        disabled={isPending}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete material"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold leading-snug line-clamp-2">
                    {m.title}
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-2">
                    <span>{m.batch.name}</span>
                    {m.subject && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          {m.subject.name}
                        </span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="py-2 space-y-2 text-xs">
                  {m.description && (
                    <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                      {m.description}
                    </p>
                  )}

                  <div className="p-2 rounded-lg bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Uploaded: {dateStr}</span>
                    {m.uploader && <span>By {m.uploader.fullName}</span>}
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t">
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button
                      size="sm"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-8 shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" /> Download / View Resource
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
