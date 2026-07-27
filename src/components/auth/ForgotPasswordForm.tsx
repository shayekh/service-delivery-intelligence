"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction } from "@/app/(auth)/forgot-password/actions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(undefined);
    setIsSubmitting(true);

    await requestPasswordResetAction(trimmed);

    setIsSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">Check your email</h2>
        <p className="mt-2 text-sm text-slate-300">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-slate-400 hover:text-slate-300"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="mb-2 text-center text-lg font-semibold text-white">
        Forgot your password?
      </h2>
      <p className="mb-2 text-center text-sm text-slate-400">
        Enter your work email and we&apos;ll send you a link to reset it.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-slate-300">
          Work Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
          placeholder="john.smith@selise.ch"
        />
        {emailError && <p className="text-sm text-red-400">{emailError}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0052CC] text-white hover:bg-[#0052CC]/90"
      >
        {isSubmitting ? "Sending..." : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-slate-400">
        <Link href="/login" className="hover:text-slate-300">
          Back to Login
        </Link>
      </p>
    </form>
  );
}
