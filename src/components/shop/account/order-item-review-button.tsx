"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Edit3, Star, X } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { toast } from "@/components/primitives/toast";
import { StarRating } from "@/components/shop/star-rating";
import { submitProductReviewAction } from "@/actions/reviews";
import type { ProductReview } from "@/types/firebase";

interface OrderItemReviewButtonProps {
  productId: string;
  productName: string;
  existingReview?: ProductReview | null;
}

export function OrderItemReviewButton({
  productId,
  productName,
  existingReview = null,
}: OrderItemReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<ProductReview | null>(existingReview);
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [title, setTitle] = useState<string>(existingReview?.title || "");
  const [comment, setComment] = useState<string>(existingReview?.comment || "");
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    if (currentReview) {
      setRating(currentReview.rating);
      setTitle(currentReview.title);
      setComment(currentReview.comment);
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please select a star rating between 1 and 5.");
      return;
    }
    if (title.trim().length < 2) {
      toast.error("Review headline must be at least 2 characters.");
      return;
    }
    if (comment.trim().length < 5) {
      toast.error("Review details must be at least 5 characters.");
      return;
    }

    startTransition(async () => {
      const res = await submitProductReviewAction(productId, {
        rating,
        title,
        comment,
      });

      if (res.success) {
        toast.success(
          currentReview
            ? "Your review has been updated!"
            : "Thank you! Your product review has been submitted.",
        );
        setCurrentReview({
          id: res.reviewId || currentReview?.id || `temp-${Date.now()}`,
          productId,
          userId: "current-user",
          userName: "You",
          rating,
          title,
          comment,
          isVerifiedPurchase: true,
          status: "APPROVED",
          createdAt: currentReview?.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
        setIsOpen(false);
      } else {
        toast.error(res.error || "Failed to save review.");
      }
    });
  };

  return (
    <>
      {currentReview ? (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/70 px-3 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300"
          title="Click to edit your product review"
        >
          <Star className="size-3 text-amber-500 fill-amber-500" />
          <span>{currentReview.rating}★ Reviewed</span>
          <Edit3 className="size-3 text-muted-foreground ml-0.5 opacity-70" />
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="h-8 gap-1.5 rounded-full text-xs font-semibold border-primary/30 hover:border-primary hover:bg-primary/5 text-primary"
        >
          <Star className="size-3.5 text-amber-500 fill-amber-500" />
          Write Review
        </Button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-card-foreground animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/50">
                    <BadgeCheck className="size-3" /> Verified Purchase
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground line-clamp-1">
                  {currentReview ? "Edit Your Review" : "Review This Item"}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1 font-medium mt-0.5">
                  {productName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              {/* Star Rating Picker */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Your Overall Rating</Label>
                <div className="flex items-center gap-3">
                  <StarRating value={rating} onChange={setRating} interactive size="lg" />
                  <span className="text-xs font-bold text-foreground">
                    {rating === 5 && "Excellent (5/5)"}
                    {rating === 4 && "Very Good (4/5)"}
                    {rating === 3 && "Average (3/5)"}
                    {rating === 2 && "Poor (2/5)"}
                    {rating === 1 && "Terrible (1/5)"}
                  </span>
                </div>
              </div>

              {/* Review Headline */}
              <div className="space-y-2">
                <Label htmlFor="review-title" className="text-xs font-semibold">
                  Headline
                </Label>
                <Input
                  id="review-title"
                  placeholder="e.g. Delicious flavor and authentic organic quality!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              {/* Detailed Comments */}
              <div className="space-y-2">
                <Label htmlFor="review-comment" className="text-xs font-semibold">
                  Detailed Feedback
                </Label>
                <textarea
                  id="review-comment"
                  rows={4}
                  className="w-full rounded-2xl border bg-background px-3.5 py-2.5 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  placeholder="Tell us what you loved about the product, its packaging, taste, and benefits..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending
                    ? "Submitting..."
                    : currentReview
                      ? "Update Review"
                      : "Publish Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
