"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@launchpad/ui";

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

  const pageTransition = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
  };

  return (
    <motion.main
      initial="initial"
      animate="animate"
      variants={pageTransition}
      className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-brand-bg text-brand-text select-none"
    >
      {/* Left Pane - Brand Story Panel */}
      <section className="bg-brand-dark text-brand-bg p-8 md:p-16 flex flex-col justify-between relative overflow-hidden hidden md:flex">
        <div className="absolute top-0 right-0 pointer-events-none opacity-10">
          <div className="w-[500px] h-[500px] rounded-full bg-brand-accent blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        </div>
        <div 
          className="font-serif text-2xl font-bold tracking-tight text-white flex items-center gap-1.5 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <span className="h-3.5 w-3.5 rounded-full bg-brand-accent inline-block"></span>
          SiteMint
        </div>
        <div className="space-y-6 relative z-10 max-w-lg">
          <h1 className="font-serif text-4xl lg:text-5xl font-extrabold leading-[1.15]">
            Redefining website generation for modern startups.
          </h1>
          <blockquote className="border-l-2 border-brand-accent/50 pl-4 space-y-2">
            <p className="text-sm text-brand-bg/85 italic leading-relaxed">
              "We generated our landing page and connected our custom domain on SiteMint in under five minutes. The AI edits allowed us to refine sections dynamically on the fly."
            </p>
            <cite className="text-xs font-semibold text-brand-accent not-italic">— Marcus Vance, Founder at Apex Logistics</cite>
          </blockquote>
        </div>
        <div className="text-xs text-brand-bg/40 font-mono">
          SiteMint Cloud Console • Version 1.0.0
        </div>
      </section>

      {/* Right Pane - Credentials Login Panel */}
      <section className="flex items-center justify-center p-8 md:p-16 bg-brand-bg">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            {/* Mobile Logo Fallback */}
            <div className="md:hidden font-serif text-xl font-bold text-brand-dark flex items-center gap-1 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-accent inline-block"></span>
              SiteMint
            </div>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight text-brand-dark">Welcome back</h2>
            <p className="text-sm text-brand-text/65 font-medium">From idea to website in minutes.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border-2 border-brand-primary/10 bg-brand-bg px-4 py-2.5 text-brand-text placeholder-brand-text/30 focus:border-brand-primary focus:outline-none text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border-2 border-brand-primary/10 bg-brand-bg px-4 py-2.5 text-brand-text placeholder-brand-text/30 focus:border-brand-primary focus:outline-none text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-brand-primary/10 text-brand-primary focus:ring-brand-primary bg-brand-bg"
                />
                <label htmlFor="remember-me" className="ml-2 block text-brand-text/60">Remember me</label>
              </div>
              <a href="#" className="text-brand-primary hover:text-brand-dark transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-lg bg-brand-primary text-brand-bg text-sm font-semibold hover:bg-brand-dark active:scale-[0.99] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-brand-primary/10 shadow-sm"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-brand-primary/10"></div>
            <span className="flex-shrink mx-4 text-brand-text/40 text-[10px] uppercase font-bold tracking-widest">Or login with</span>
            <div className="flex-grow border-t border-brand-primary/10"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="flex w-full justify-center items-center gap-2 rounded-lg border-2 border-brand-primary/15 bg-brand-bg px-4 py-2.5 text-sm font-semibold text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all active:scale-[0.99]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            Google Identity Portal
          </button>

          <p className="text-center text-xs text-brand-text/50 font-medium">
            Don't have an account?{" "}
            <button onClick={() => router.push("/signup")} className="text-brand-primary hover:text-brand-dark hover:underline font-bold">
              Sign up
            </button>
          </p>
        </div>
      </section>
    </motion.main>
  );
}
