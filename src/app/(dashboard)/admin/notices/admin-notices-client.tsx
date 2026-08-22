"use client";

import * as React from "react";
import { useState } from "react";
import { NoticeFeed } from "@/components/notices/notice-feed";
import { NoticeModal } from "@/components/notices/notice-modal";
import { Button } from "@/components/ui/button";
import { type NoticeListItem } from "@/actions/notices";
import { type BatchItem } from "@/actions/batches";
import { Megaphone, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminNoticesClientProps {
  initialNotices: NoticeListItem[];
  batches: BatchItem[];
}

export function AdminNoticesClient({
  initialNotices,
  batches,
}: AdminNoticesClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Megaphone className="h-6 w-6" />
            </div>
            Notice Board & Broadcast Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Broadcast academy announcements, exam alerts, holiday schedules, and ground practice notices.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs h-9 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Post New Announcement
        </Button>
      </div>

      {/* Feed View */}
      <NoticeFeed
        notices={initialNotices}
        canDelete={true}
        onRefresh={() => router.refresh()}
      />

      {/* Modal */}
      <NoticeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        batches={batches}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
