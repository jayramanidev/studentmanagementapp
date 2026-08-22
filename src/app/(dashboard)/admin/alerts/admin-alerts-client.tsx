"use client";

import * as React from "react";
import { useState } from "react";
import { AlertLogTable } from "@/components/alerts/alert-log-table";
import { AlertComposerModal } from "@/components/alerts/alert-composer-modal";
import { Button } from "@/components/ui/button";
import { type AlertLogItem } from "@/actions/alerts";
import { type BatchItem } from "@/actions/batches";
import { MessageSquare, Send, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminAlertsClientProps {
  logs: AlertLogItem[];
  batches: BatchItem[];
}

export function AdminAlertsClient({ logs, batches }: AdminAlertsClientProps) {
  const router = useRouter();
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            Parent SMS & WhatsApp Notification Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track automated score alerts, absent notifications, and dispatch custom parent broadcasts.
          </p>
        </div>

        <Button
          onClick={() => setComposerOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9 shadow-xs"
        >
          <Send className="h-4 w-4" /> Compose Parent Broadcast
        </Button>
      </div>

      {/* Log History */}
      <AlertLogTable logs={logs} />

      {/* Composer Modal */}
      <AlertComposerModal
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        batches={batches}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
