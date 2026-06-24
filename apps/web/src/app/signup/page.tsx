"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@launchpad/ui";

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
            Bootstrap your landing page in seconds.
          </h1>
          <p className="text-sm text-brand-bg/75 leading-relaxed">
            SiteMint automates copywriting, layout structuring, and hosting configurations. Register your account and begin minting sites today.
          </p>
        </div>
        <div className="text-xs text-brand-bg/40 font-mono">
          SiteMint Cloud Console • Version 1.0.0
        </div>
      </section>

      {/* Right Pane - Credentials Signup Panel */}
      <section className="flex items-center justify-center p-8 md:p-16 bg-brand-bg">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            {/* Mobile Logo Fallback */}
            <div className="md:hidden font-serif text-xl font-bold text-brand-dark flex items-center gap-1 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-accent inline-block"></span>
              SiteMint
            </div>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight text-brand-dark">Create Account</h2>
            <p className="text-sm text-brand-text/65 font-medium">Join SiteMint to build your site</p>
          </div>

          {error && (
            <div className={`rounded-lg p-4 text-xs font-semibold ${
              error.includes("Confirmation email") 
                ? "bg-brand-primary/10 border border-brand-primary/20 text-brand-primary" 
                : "bg-red-500/10 border border-red-500/20 text-red-700"
            }`}>
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSignup}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border-2 border-brand-primary/10 bg-brand-bg px-4 py-2.5 text-brand-text placeholder-brand-text/30 focus:border-brand-primary focus:outline-none text-sm transition-colors"
                  placeholder="John Doe"
                />
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-lg bg-brand-primary text-brand-bg text-sm font-semibold hover:bg-brand-dark active:scale-[0.99] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-brand-primary/10 shadow-sm"
            >
              {loading ? "Registering account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-xs text-brand-text/50 font-medium">
            Already have an account?{" "}
            <button onClick={() => router.push("/login")} className="text-brand-primary hover:text-brand-dark hover:underline font-bold">
              Login
            </button>
          </p>
        </div>
      </section>
    </motion.main>
  );
}
