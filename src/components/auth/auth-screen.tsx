"use client";

import { FormEvent, useState } from "react";
import {
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/supabase/auth";

type AuthMode = "sign-in" | "sign-up";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const result = isSignUp
        ? await signUpWithEmail(email.trim(), password)
        : await signInWithEmail(email.trim(), password);

      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }

      if (isSignUp && !result.data.session) {
        setSuccessMessage("Check your email to confirm your account.");
        return;
      }

      setSuccessMessage(isSignUp ? "Account ready." : "Signed in.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b12] px-4 py-8 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_26%)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl shadow-black/30 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-slate-800 bg-slate-900/60 p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              D&D Encounter Builder
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-white">
              Sign in for beta
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in to save encounters, creatures, and imports. Account
              storage is being connected during beta.
            </p>
            <div className="mt-6 rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50/90">
              Beta persistence is being connected in stages. Some screens may
              still use local session state while saved data is verified.
            </div>
          </div>

          <form className="p-6" onSubmit={handleSubmit}>
            <div className="flex gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-1">
              <button
                className={`h-10 flex-1 rounded-lg text-sm font-black transition ${
                  mode === "sign-in"
                    ? "bg-cyan-300 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
                type="button"
                onClick={() => {
                  setMode("sign-in");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
              >
                Sign In
              </button>
              <button
                className={`h-10 flex-1 rounded-lg text-sm font-black transition ${
                  mode === "sign-up"
                    ? "bg-cyan-300 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
                type="button"
                onClick={() => {
                  setMode("sign-up");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
              >
                Sign Up
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Email
              </span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Password
              </span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                minLength={6}
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {errorMessage ? (
              <p className="mt-4 rounded-xl border border-red-300/25 bg-red-400/10 p-3 text-sm font-semibold text-red-100">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm font-semibold text-emerald-100">
                {successMessage}
              </p>
            ) : null}

            <button
              className="mt-5 h-11 w-full rounded-xl border border-cyan-300/50 bg-cyan-300 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
              disabled={loading}
              type="submit"
            >
              {loading ? "Working..." : isSignUp ? "Create Account" : "Sign In"}
            </button>

            <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
              Password reset will be added after the beta auth foundation is
              stable.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
