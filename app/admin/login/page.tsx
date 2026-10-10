"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { ArrowRight } from "@/components/icons";
import { useAdminPaths } from "../AdminPathProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const admin = useAdminPaths();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      // Keep the friendly wording for a bad password, but surface anything
      // else (e.g. "Email not confirmed") so it can actually be fixed.
      setError(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message
      );
      return;
    }
    router.push(admin.href());
    router.refresh();
  }

  return (
    <div className="px-5 py-12 md:px-10 md:py-20">
      <div className="max-w-sm">
        <div className="kicker mb-2">Studio</div>
        <h1 className="m-0 text-[40px] leading-[0.95] tracking-[-0.04em] md:text-[56px]">Sign in</h1>
        {isDemoMode && (
          <p className="mt-3 text-sm opacity-65">
            Demo mode: sign-in is disabled and{" "}
            <a href={admin.href()}>the studio</a> is open directly. Connect a real
            Supabase project (see README) to require a password.
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          {error && <p className="m-0 text-sm text-accent-700">{error}</p>}
          <button type="submit" className="btn btn-primary">
            Sign in <ArrowRight />
          </button>
        </form>
      </div>
    </div>
  );
}
