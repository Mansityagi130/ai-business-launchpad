"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && anonKey) {
        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": anonKey,
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error_description || errData.message || "Failed to authenticate.");
        }

        const data = await response.json();
        document.cookie = `sb-access-token=${data.access_token}; path=/; max-age=3600; SameSite=Lax; Secure`;
      } else {
        // Fallback mock session setup for local/offline testing
        document.cookie = "sb-access-token=mock-jwt-token-sprint-2; path=/; max-age=3600";
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(currentOrigin + "/dashboard")}`;
    } else {
      document.cookie = "sb-access-token=mock-jwt-token-google-sprint-2; path=/; max-age=3600";
      router.push("/dashboard");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-400">Sign in to manage your AI Business Launchpad</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-950/50 border border-red-800 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md">
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

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-750 text-amber-500 focus:ring-amber-500 bg-slate-850"
              />
              <label htmlFor="remember-me" className="ml-2 block text-slate-400">Remember me</label>
            </div>
            <a href="#" className="text-amber-500 hover:text-amber-450 font-medium">Forgot password?</a>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-905 hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase">Or continue with</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="flex w-full justify-center items-center gap-2 rounded-md border border-slate-750 bg-slate-850 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-all active:scale-98"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google
        </button>

        <p className="text-center text-sm text-slate-400 mt-4">
          Don't have an account?{" "}
          <button onClick={() => router.push("/signup")} className="text-amber-500 hover:underline font-medium">
            Sign up
          </button>
        </p>
      </div>
    </main>
  );
}
