"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && anonKey) {
        const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": anonKey,
          },
          body: JSON.stringify({
            email,
            password,
            data: { name }
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to create account.");
        }

        const data = await response.json();
        if (data.access_token) {
          document.cookie = `sb-access-token=${data.access_token}; path=/; max-age=3600; SameSite=Lax; Secure`;
        } else {
          setError("Confirmation email sent! Please verify your email to log in.");
          setLoading(false);
          return;
        }
      } else {
        // Fallback mock session setup for local/offline testing
        document.cookie = "sb-access-token=mock-jwt-token-sprint-2; path=/; max-age=3600";
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">Create Account</h2>
          <p className="mt-2 text-sm text-slate-400">Join AI Business Launchpad to build your site</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-950/50 border border-red-800 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="space-y-4 rounded-md">
            <div>
              <label className="block text-sm font-medium text-slate-350 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-350 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-350 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-800/80 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-905 hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? "Registering account..." : "Sign Up"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-slate-400 mt-4">
          Already have an account?{" "}
          <button onClick={() => router.push("/login")} className="text-amber-500 hover:underline font-medium">
            Login
          </button>
        </p>
      </div>
    </main>
  );
}
