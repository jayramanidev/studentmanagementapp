"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sendCustomBroadcastAction } from "@/actions/alerts";
import { type BatchItem } from "@/actions/batches";
import {
  Send,
  MessageSquare,
  Smartphone,
  Layers,
  Phone,
  Loader2,
  Sparkles,
} from "lucide-react";

interface AlertComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: BatchItem[];
  onSuccess?: () => void;
}

const TEMPLATES = [
  {
    title: "Ground Fitness Reminder",
    text: "🏃 *Ground Training Reminder*\nDear {recipient_name},\nTomorrow's 5000m physical fitness trial starts at 06:00 AM at the academy ground. Ensure {student_name} arrives in full sports gear.",
  },
  {
    title: "OMR Mock Test Alert",
    text: "📝 *Mock Exam Schedule*\nDear {recipient_name},\nThe Gujarat Police PSI Full-Length 100-Mark OMR Mock Test is scheduled this Sunday 10:00 AM to 12:00 PM.",
  },
  {
    title: "Parent Progress Meeting",
    text: "📢 *Parent-Teacher Briefing*\nDear {recipient_name},\nYou are cordially invited for the offline academic progress meeting this Saturday to review {student_name}'s recent mock test ranks.",
  },
];

export function AlertComposerModal({
  isOpen,
  onClose,
  batches,
  onSuccess,
}: AlertComposerModalProps) {
  const [isPending, startTransition] = useTransition();

  const [channel, setChannel] = useState<"WHATSAPP" | "SMS">("WHATSAPP");
  const [dispatchType, setDispatchType] = useState<"BATCH" | "DIRECT">("BATCH");
  const [batchId, setBatchId] = useState(batches[0]?.id || "");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState(TEMPLATES[0].text);

  const insertTag = (tag: string) => {
    setMessage((prev) => prev + tag);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Message content is required");
      return;
    }
    if (dispatchType === "DIRECT" && !recipientPhone.trim()) {
      toast.error("Recipient phone number is required");
      return;
    }

    startTransition(async () => {
      const res = await sendCustomBroadcastAction({
        batchId: dispatchType === "BATCH" ? batchId : undefined,
        recipientPhone: dispatchType === "DIRECT" ? recipientPhone.trim() : undefined,
        recipientName: dispatchType === "DIRECT" ? recipientName.trim() : undefined,
        message: message.trim(),
        channel,
        alertType: "CUSTOM_BROADCAST",
      });

      if (res.success) {
        toast.success(`Dispatched ${res.data.count} alerts via ${channel}!`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to broadcast alert");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[88vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            Dispatch Parent WhatsApp & SMS Broadcast
          </DialogTitle>
          <DialogDescription>
            Send automated announcements and score updates to parents and candidates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Channel Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setChannel("WHATSAPP")}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                channel === "WHATSAPP"
                  ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30 font-semibold"
                  : "border-input bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-600 text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold">WhatsApp Gateway</div>
                <div className="text-[10px] text-muted-foreground">Rich formatting & instant read</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setChannel("SMS")}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                channel === "SMS"
                  ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/30 font-semibold"
                  : "border-input bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="p-2 rounded-lg bg-indigo-600 text-white">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Direct SMS Gateway</div>
                <div className="text-[10px] text-muted-foreground">Standard carrier cellular SMS</div>
              </div>
            </button>
          </div>

          {/* Dispatch Mode: Entire Batch vs Individual */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Recipient Target</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={dispatchType === "BATCH" ? "default" : "outline"}
                size="sm"
                onClick={() => setDispatchType("BATCH")}
                className="text-xs h-8"
              >
                All Parents in Batch
              </Button>
              <Button
                type="button"
                variant={dispatchType === "DIRECT" ? "default" : "outline"}
                size="sm"
                onClick={() => setDispatchType("DIRECT")}
                className="text-xs h-8"
              >
                Individual Phone Number
              </Button>
            </div>
          </div>

          {dispatchType === "BATCH" ? (
            <div className="space-y-1.5">
              <Label htmlFor="bSelect" className="text-xs font-semibold flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Select Batch
              </Label>
              <select
                id="bSelect"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.targetExam})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rPhone" className="text-xs font-semibold flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Recipient Phone (10 digits) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rPhone"
                  placeholder="e.g. 9876543210"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  required={dispatchType === "DIRECT"}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rName" className="text-xs font-semibold">
                  Recipient Name (Optional)
                </Label>
                <Input
                  id="rName"
                  placeholder="e.g. Mr. Patel"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Preset Templates */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Quick Templates</Label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  type="button"
                  onClick={() => setMessage(t.text)}
                  className="px-2.5 py-1 rounded-md border text-[11px] bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Message Composer & Dynamic Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="msgContent" className="text-xs font-semibold">
                Message Body <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => insertTag(" {student_name} ")}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  +{`{student_name}`}
                </button>
                <span className="text-[10px] text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={() => insertTag(" {recipient_name} ")}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  +{`{recipient_name}`}
                </button>
              </div>
            </div>

            <Textarea
              id="msgContent"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              disabled={isPending}
              className="font-sans text-xs leading-relaxed"
            />
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Dispatch {channel} Alert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
