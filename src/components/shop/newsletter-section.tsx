"use client";

import { Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "@/components/primitives/toast";

import { Input } from "@/components/primitives/input";
import { Button } from "@/components/primitives/button";

/**
 * Newsletter signup. Persists the email via a server action; no real
 * email-sending infrastructure is required at this stage.
 */
export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function subscribe(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("Please enter a valid email address");
      return;
    }
    startTransition(async () => {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      toast.success("You're subscribed! Welcome to the Talbeena family.");
      setEmail("");
    });
  }

  return (
    <section className="border-y bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary-foreground/10">
            <Mail className="size-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Get healthy recipes &amp; offers
            </h2>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/80">
              Subscribe for nourishing tips, new arrivals and exclusive discounts.
            </p>
          </div>
          <form
            onSubmit={subscribe}
            className="flex w-full max-w-md gap-2"
            noValidate
          >
            <Input
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              className="border-primary-foreground/20 bg-primary-foreground text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              disabled={isPending}
              variant="secondary"
              className="shrink-0"
            >
              {isPending ? "Subscribing…" : "Subscribe"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}