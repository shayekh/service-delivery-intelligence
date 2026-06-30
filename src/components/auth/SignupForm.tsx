"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RoleToggle } from "@/components/auth/RoleToggle";
import type { UserRole } from "@/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
  form?: string;
}

export function SignupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!firstName.trim()) nextErrors.firstName = "Full name is required.";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!email.trim()) {
      nextErrors.email = "Work email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (!role) nextErrors.role = "Select a role.";

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError || !data.user) {
      setErrors({ form: signUpError?.message ?? "Could not create account." });
      setIsSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("users").insert({
      id: data.user.id,
      email: email.trim(),
      full_name: fullName,
      role,
    });

    if (insertError) {
      setErrors({ form: insertError.message });
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-slate-300">
            Full Name
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
            placeholder="John"
          />
          {errors.firstName && (
            <p className="text-sm text-red-400">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-slate-300">
            Last Name
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500"
            placeholder="Smith"
          />
          {errors.lastName && (
            <p className="text-sm text-red-400">{errors.lastName}</p>
          )}
        </div>
      </div>

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
        <Label htmlFor="password" className="text-slate-300">
          Password
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
        <Label className="text-slate-300">Role</Label>
        <RoleToggle value={role} onChange={setRole} />
        {errors.role && <p className="text-sm text-red-400">{errors.role}</p>}
      </div>

      {errors.form && <p className="text-sm text-red-400">{errors.form}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0052CC] text-white hover:bg-[#0052CC]/90"
      >
        {isSubmitting ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
