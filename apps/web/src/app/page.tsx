"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@launchpad/ui";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sb-access-token="))
      ?.split("=")[1];
    setIsLoggedIn(!!token);
  }, []);

  const handleCTA = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/signup");
    }
  };

  const pageTransition = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageTransition}
      className="min-h-screen bg-brand-bg text-brand-text flex flex-col selection:bg-brand-primary selection:text-white"
    >
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-brand-bg/85 border-b border-brand-primary/10 px-6 py-4 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <span className="font-serif text-2xl font-bold tracking-tight text-brand-dark flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-brand-accent inline-block"></span>
            SiteMint
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-text/80">
          <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-brand-primary transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-brand-primary transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Button label="Go to Dashboard" onClick={() => router.push("/dashboard")} />
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="text-sm font-semibold text-brand-primary hover:text-brand-dark px-3 py-1.5 transition-colors"
              >
                Sign In
              </button>
              <Button label="Get Started" onClick={() => router.push("/signup")} />
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden px-6">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-brand-surface to-brand-accent/30 blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-primary/10 bg-brand-surface/40 text-xs font-semibold text-brand-dark tracking-wide uppercase"
          >
            ✨ AI Website Generation Portal
          </motion.div>
          <h1 className="font-serif text-5xl md:text-7xl font-extrabold tracking-tight text-brand-dark leading-[1.1]">
            From idea to website <br />
            <span className="text-brand-primary">in minutes.</span>
          </h1>
          <p className="text-base md:text-xl text-brand-text/75 max-w-2xl mx-auto leading-relaxed">
            Create, refine, and host professional website blueprints instantly. Power your online presence with natural language AI edits and premium styled layouts.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-4">
            <button
              onClick={handleCTA}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-primary text-brand-bg font-semibold hover:bg-brand-dark hover:shadow-lg hover:shadow-brand-primary/20 transition-all duration-300 transform active:scale-98"
            >
              Build Your Website Now
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-brand-primary/15 text-brand-primary font-semibold hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all text-center"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-brand-surface/20 border-y border-brand-primary/5 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">Built for ambitious builders</h2>
            <p className="text-sm text-brand-text/70">Everything you need to launch high-converting pages and capture leads without touch coding.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-brand-bg border border-brand-primary/10 rounded-2xl p-8 shadow-sm transition-all space-y-4"
            >
              <div className="h-12 w-12 rounded-xl bg-brand-surface flex items-center justify-center text-brand-primary font-bold text-xl">💡</div>
              <h3 className="font-serif text-xl font-bold text-brand-dark">AI Conversational Edits</h3>
              <p className="text-sm text-brand-text/70 leading-relaxed">Adjust headers, switch theme modes, or modify sections dynamically using natural voice or text instructions.</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-brand-bg border border-brand-primary/10 rounded-2xl p-8 shadow-sm transition-all space-y-4"
            >
              <div className="h-12 w-12 rounded-xl bg-brand-surface flex items-center justify-center text-brand-primary font-bold text-xl">📊</div>
              <h3 className="font-serif text-xl font-bold text-brand-dark">Integrated CRM & Analytics</h3>
              <p className="text-sm text-brand-text/70 leading-relaxed">Capture visitor leads instantly with custom contact forms and view real-time page traffic widgets built into your dashboard.</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-brand-bg border border-brand-primary/10 rounded-2xl p-8 shadow-sm transition-all space-y-4"
            >
              <div className="h-12 w-12 rounded-xl bg-brand-surface flex items-center justify-center text-brand-primary font-bold text-xl">🌐</div>
              <h3 className="font-serif text-xl font-bold text-brand-dark">Custom Domains & SSL</h3>
              <p className="text-sm text-brand-text/70 leading-relaxed">Map custom subdomains or connect top-level domains. Verify DNS and enjoy automated provisioning of active SSL certificates.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">Launch in three quick steps</h2>
            <p className="text-sm text-brand-text/70">From zero to a hosted product page in minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="space-y-4 relative">
              <span className="font-serif text-6xl font-extrabold text-brand-surface">01</span>
              <h4 className="font-serif text-lg font-bold text-brand-dark">Define Profile</h4>
              <p className="text-sm text-brand-text/75 leading-relaxed">Input your business details (description, operational contacts, categorizations) as the copywriting blueprint.</p>
            </div>
            <div className="space-y-4 relative">
              <span className="font-serif text-6xl font-extrabold text-brand-surface">02</span>
              <h4 className="font-serif text-lg font-bold text-brand-dark">AI Generation</h4>
              <p className="text-sm text-brand-text/75 leading-relaxed">Select a minimalist layout structure. The SiteMint builder compiles and codes the initial configuration in seconds.</p>
            </div>
            <div className="space-y-4 relative">
              <span className="font-serif text-6xl font-extrabold text-brand-surface">03</span>
              <h4 className="font-serif text-lg font-bold text-brand-dark">Refine & Go Live</h4>
              <p className="text-sm text-brand-text/75 leading-relaxed">Converse with the editor to tweak typography, colors, and layout blocks, then bind a custom URL and publish live.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-brand-surface/10 border-t border-brand-primary/5 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">Flexible pricing for any creator</h2>
            <p className="text-sm text-brand-text/70">Start free and upgrade as your list of active business domains expands.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Free */}
            <div className="bg-brand-bg border border-brand-primary/10 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-brand-primary/30 transition-all">
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif text-lg font-bold text-brand-dark uppercase">Free</h4>
                  <p className="text-xs text-brand-text/60">For new experimental builders</p>
                </div>
                <div className="text-3xl font-extrabold text-brand-dark">$0</div>
                <ul className="text-xs text-brand-text/85 space-y-2 border-t border-brand-primary/10 pt-4">
                  <li>✓ 1 Active Website</li>
                  <li>✓ 50 AI Edits / month</li>
                  <li>✓ Standard templates</li>
                </ul>
              </div>
              <button onClick={handleCTA} className="mt-8 w-full py-2.5 rounded-lg border-2 border-brand-primary/20 text-brand-primary font-bold hover:bg-brand-primary/5 transition-all text-xs">
                Get Started
              </button>
            </div>
            {/* Pro */}
            <div className="bg-brand-bg border-2 border-brand-primary rounded-2xl p-6 flex flex-col justify-between shadow-md relative">
              <span className="absolute top-0 right-6 -translate-y-1/2 bg-brand-primary text-brand-bg px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">Popular</span>
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif text-lg font-bold text-brand-dark uppercase">Pro</h4>
                  <p className="text-xs text-brand-text/60">For professional freelancers</p>
                </div>
                <div className="text-3xl font-extrabold text-brand-dark">$19</div>
                <ul className="text-xs text-brand-text/85 space-y-2 border-t border-brand-primary/10 pt-4">
                  <li>✓ 3 Active Websites</li>
                  <li>✓ 200 AI Edits / month</li>
                  <li>✓ Custom Domains & SSL</li>
                  <li>✓ Early Access Features</li>
                </ul>
              </div>
              <button onClick={handleCTA} className="mt-8 w-full py-2.5 rounded-lg bg-brand-primary text-brand-bg font-bold hover:bg-brand-dark transition-all text-xs">
                Upgrade to Pro
              </button>
            </div>
            {/* Business */}
            <div className="bg-brand-bg border border-brand-primary/10 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-brand-primary/30 transition-all">
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif text-lg font-bold text-brand-dark uppercase">Business</h4>
                  <p className="text-xs text-brand-text/60">For growing local agencies</p>
                </div>
                <div className="text-3xl font-extrabold text-brand-dark">$49</div>
                <ul className="text-xs text-brand-text/85 space-y-2 border-t border-brand-primary/10 pt-4">
                  <li>✓ 10 Active Websites</li>
                  <li>✓ 1,000 AI Edits / month</li>
                  <li>✓ Priority Generation Queue</li>
                  <li>✓ Multi-Business Profiles</li>
                </ul>
              </div>
              <button onClick={handleCTA} className="mt-8 w-full py-2.5 rounded-lg border-2 border-brand-primary/20 text-brand-primary font-bold hover:bg-brand-primary/5 transition-all text-xs">
                Select Business
              </button>
            </div>
            {/* Agency */}
            <div className="bg-brand-bg border border-brand-primary/10 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-brand-primary/30 transition-all">
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif text-lg font-bold text-brand-dark uppercase">Agency</h4>
                  <p className="text-xs text-brand-text/60">For large scale enterprises</p>
                </div>
                <div className="text-3xl font-extrabold text-brand-dark">$149</div>
                <ul className="text-xs text-brand-text/85 space-y-2 border-t border-brand-primary/10 pt-4">
                  <li>✓ 50 Active Websites</li>
                  <li>✓ Unlimited AI Edits</li>
                  <li>✓ Dedicated Account Manager</li>
                  <li>✓ Whitelabel Dashboard</li>
                </ul>
              </div>
              <button onClick={handleCTA} className="mt-8 w-full py-2.5 rounded-lg border-2 border-brand-primary/20 text-brand-primary font-bold hover:bg-brand-primary/5 transition-all text-xs">
                Select Agency
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 px-6 text-center bg-brand-dark text-brand-bg">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="font-serif text-3xl md:text-5xl font-extrabold tracking-tight">
            Ready to mint your brand online?
          </h2>
          <p className="text-sm md:text-base text-brand-bg/75 max-w-xl mx-auto leading-relaxed">
            Register your profile, setup your business category details, and generate your custom site design in 60 seconds.
          </p>
          <div>
            <button
              onClick={handleCTA}
              className="px-8 py-3.5 rounded-xl bg-brand-accent text-brand-text font-bold hover:bg-brand-accent/90 transition-all transform active:scale-98 shadow-md"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-bg border-t border-brand-primary/10 py-10 px-6 text-center text-xs text-brand-text/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-serif text-sm font-bold text-brand-dark">SiteMint</div>
          <div>© 2026 SiteMint Inc. From idea to website in minutes. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
