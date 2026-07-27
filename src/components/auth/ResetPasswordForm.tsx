"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  form?: string;
}

function ExpiredLinkCard() {
  return (
    <div className="text-center">
      <h2 className="text-lg font-semibold text-white">Reset link expired</h2>
      <p className="mt-2 text-sm text-red-400">
        This reset link is invalid or has expired.
      </p>
      <Link
        href="/forgot-password"
        className="mt-4 inline-block text-sm text-slate-300 hover:text-white"
      >
        Request a new reset link
      </Link>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Supabase's recovery links use the implicit flow (tokens in the URL
    // hash), but this client is configured for the PKCE flow, so its
    // automatic detectSessionInUrl won't pick them up — parse the hash and
    // set the session explicitly instead.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          window.history.replaceState(null, "", window.location.pathname);
          if (data.session && !error) {
            setReady(true);
          } else {
            setErrors({ form: "This reset link is invalid or has expired." });
          }
        });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        setErrors({ form: "This reset link is invalid or has expired." });
      }
    });
  }, [supabase]);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.updateUser({ password });

    if (error || !data.user) {
      setErrors({ form: error?.message ?? "Could not reset password." });
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (!ready) {
    if (errors.form) {
      return <ExpiredLinkCard />;
    }
    return <p className="text-sm text-slate-300">Verifying your reset link…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="mb-2 text-center text-lg font-semibold text-white">
        Reset your password
      </h2>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-slate-300">
          New Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-sm text-red-400">{errors.password}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-slate-300">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
          placeholder="••••••••"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-400">{errors.confirmPassword}</p>
        )}
      </div>

      {errors.form && <p className="text-sm text-red-400">{errors.form}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0052CC] text-white hover:bg-[#0052CC]/90"
      >
        {isSubmitting ? "Resetting password..." : "Reset Password"}
      </Button>
    </form>
  );
}
