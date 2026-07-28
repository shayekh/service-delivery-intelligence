"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!email.trim()) nextErrors.email = "Work email is required.";
    if (!password) nextErrors.password = "Password is required.";

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setErrors({ form: "Invalid email or password" });
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-slate-300">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-slate-400 hover:text-slate-300"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-slate-600 bg-slate-900/50 pr-10 text-white placeholder:text-slate-500"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-400">{errors.password}</p>
        )}
      </div>

      {errors.form && <p className="text-sm text-red-400">{errors.form}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-500/90 hover:to-blue-600/90"
      >
        {isSubmitting ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}
