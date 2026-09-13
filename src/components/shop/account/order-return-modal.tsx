"use client";

import { useState, useTransition } from "react";
import { RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/primitives/button";
import { toast } from "@/components/primitives/toast";
import { RETURN_REASONS, type ReturnInput } from "@/validations/return";
import { requestOrderReturnAction } from "@/actions/returns";

interface OrderReturnModalProps {
  orderId: string;
}

export function OrderReturnModal({ orderId }: OrderReturnModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReturnInput["reason"]>("damaged");
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await requestOrderReturnAction(orderId, {
          reason,
          comments: comments.trim() || undefined,
        });

        if (res.success) {
          toast.success("Return request submitted successfully. We will review it shortly.");
          setIsOpen(false);
        } else {
          setError(res.error || "Failed to submit return request");
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300"
      >
        <RotateCcw className="size-3.5" />
        Request Return
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <RotateCcw className="size-5 text-primary" />
                Request Return
              </h2>
              <p className="text-xs text-muted-foreground">
                Order #{orderId.slice(-8).toUpperCase()} · Select a reason for returning this item.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="return-reason" className="text-xs font-semibold text-foreground">
                  Reason for Return
                </label>
                <select
                  id="return-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReturnInput["reason"])}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="return-comments" className="text-xs font-semibold text-foreground">
                  Additional Details / Comments (Optional)
                </label>
                <textarea
                  id="return-comments"
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Please describe the issue or reason in detail…"
                  className="w-full rounded-xl border bg-background p-3 text-xs focus-visible:ring-2 focus-visible:ring-primary shadow-xs resize-none"
                  maxLength={500}
                />
                <span className="text-[10px] text-muted-foreground block text-right">
                  {comments.length}/500
                </span>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  What happens next?
                </p>
                <p>
                  Our team will review your request within 24 hours. Once approved, pickup or return instructions will be shared.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "Submitting…" : "Submit Return Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
