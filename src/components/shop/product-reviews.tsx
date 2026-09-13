"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BadgeCheck, MessageSquarePlus, Star, X } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { toast } from "@/components/primitives/toast";
import { StarRating } from "@/components/shop/star-rating";
import { submitProductReviewAction } from "@/actions/reviews";
import type { ProductReview } from "@/types/firebase";
import type { ProductReviewsSummary } from "@/queries/shop";

interface ProductReviewsProps {
  productId: string;
  productName: string;
  initialSummary: ProductReviewsSummary;
  isLoggedIn: boolean;
  isVerifiedBuyer: boolean;
}

export function ProductReviews({
  productId,
  productName,
  initialSummary,
  isLoggedIn,
  isVerifiedBuyer,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialSummary.reviews);
  const [summary, setSummary] = useState(initialSummary);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please select a rating.");
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
        toast.success("Thank you! Your review has been published.");
        setIsModalOpen(false);
        // Optimistically add review to top
        const newReview: ProductReview = {
          id: res.reviewId || `temp-${Date.now()}`,
          productId,
          userId: "current-user",
          userName: "You",
          rating,
          title,
          comment,
          isVerifiedPurchase: isVerifiedBuyer,
          status: "APPROVED",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const updated = [newReview, ...reviews];
        setReviews(updated);

        // Recalculate summary
        const newTotal = summary.totalReviews + 1;
        const newSum = summary.averageRating * summary.totalReviews + rating;
        const newAvg = Number((newSum / newTotal).toFixed(1));
        const newDist = { ...summary.distribution };
        const rounded = Math.min(5, Math.max(1, Math.round(rating))) as 1 | 2 | 3 | 4 | 5;
        newDist[rounded] = (newDist[rounded] || 0) + 1;

        setSummary({
          reviews: updated,
          averageRating: newAvg,
          totalReviews: newTotal,
          distribution: newDist,
        });

        // Reset form
        setTitle("");
        setComment("");
        setRating(5);
      } else {
        toast.error(res.error || "Failed to submit review.");
      }
    });
  };

  return (
    <div className="pt-12 border-t space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real feedback from verified Talbeena customers
          </p>
        </div>

        {isLoggedIn ? (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <MessageSquarePlus className="size-4" /> Write a Review
          </Button>
        ) : (
          <Button
            variant="outline"
            render={<Link href={`/login?from=/products/${productId}`} />}
            className="inline-flex items-center gap-2 self-start sm:self-auto"
          >
            Sign in to Review
          </Button>
        )}
      </div>

      {/* Ratings Breakdown Grid */}
      <div className="grid gap-6 rounded-3xl border bg-card/60 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
        {/* Left: Overall score */}
        <div className="text-center lg:col-span-4 lg:border-r lg:pr-8">
          <div className="text-5xl font-extrabold tracking-tight text-foreground">
            {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "—"}
          </div>
          <div className="mt-2 flex justify-center">
            <StarRating value={summary.averageRating} size="lg" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium">
            Based on {summary.totalReviews} customer {summary.totalReviews === 1 ? "rating" : "ratings"}
          </p>
          {isVerifiedBuyer && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <BadgeCheck className="size-3.5" />
              Verified Buyer Eligible
            </div>
          )}
        </div>

        {/* Right: Star breakdown bars */}
        <div className="space-y-2 lg:col-span-8 lg:pl-4">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 w-12 font-medium text-muted-foreground">
                  {stars} <Star className="size-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">No reviews yet</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Be the first customer to review &ldquo;{productName}&rdquo; and share your experience with wholesome food lovers!
          </p>
          {isLoggedIn && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="mt-2"
            >
              Write First Review
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-3xl border bg-card p-6 shadow-xs space-y-3 transition hover:border-primary/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {rev.userName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {rev.userName}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                          <BadgeCheck className="size-3" />
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <StarRating value={rev.rating} size="sm" />
              </div>

              <div>
                <h4 className="font-semibold text-sm text-foreground">{rev.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1 whitespace-pre-line">
                  {rev.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-2xl space-y-6 sm:p-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold">Write a Review</h3>
                <p className="text-xs text-muted-foreground">{productName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Rating Selector */}
              <div className="space-y-2 text-center py-2 bg-muted/20 rounded-2xl border">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Overall Rating
                </Label>
                <div className="flex justify-center">
                  <StarRating
                    value={rating}
                    onChange={setRating}
                    size="lg"
                    interactive
                  />
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  {["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1]}
                </span>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="review-title" className="text-xs font-semibold">
                  Headline / Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="review-title"
                  placeholder="e.g. Delicious & authentic natural taste!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              {/* Details */}
              <div className="space-y-2">
                <Label htmlFor="review-comment" className="text-xs font-semibold">
                  Detailed Review <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="review-comment"
                  rows={4}
                  placeholder="Share what you liked about the quality, packaging, and health benefits..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  required
                  className="w-full rounded-2xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {comment.length} / 1000 characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
