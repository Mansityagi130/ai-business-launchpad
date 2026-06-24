"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@launchpad/ui";
import { NotificationCenter } from "../../components/NotificationCenter";
import { UpgradeModal } from "../../components/UpgradeModal";

export default function DashboardPage() {
  const router = useRouter();
  const [websites, setWebsites] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [billingUsage, setBillingUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("sb-access-token="))
          ?.split("=")[1];

        if (!token) {
          router.push("/login");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch websites, businesses, and billing usage concurrently
        const [webRes, bizRes, billingRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/websites`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/businesses`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/billing/usage`, { headers }),
        ]);

        if (webRes.ok && bizRes.ok) {
          const webData = await webRes.json();
          const bizData = await bizRes.json();
          setWebsites(webData.data || []);
          setBusinesses(bizData.data || []);
        } else {
          // Fallback mocks
          setWebsites([
            {
              id: "site-1",
              status: "published",
              created_at: "2026-06-23T12:00:00Z",
              businesses: { name: "Apex Auto Repairs", category: "Automotive Services" },
              domains: [{ domain_name: "apexrepairs.launchpad.ai", type: "subdomain" }]
            }
          ]);
          setBusinesses([
            {
              id: "biz-1",
              name: "Apex Auto Repairs",
              category: "Automotive Services",
              description: "Full service auto repair workshop in Boston."
            }
          ]);
        }

        if (billingRes.ok) {
          const usageData = await billingRes.json();
          setBillingUsage(usageData);
        } else {
          // Fallback billing mock
          setBillingUsage({
            plan: "free",
            limits: { websites: 1, ai_edits: 50 },
            usage: { websites: 1, ai_edits: 34 },
            billing_cycle_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      } catch (err: any) {
        setError("API connection warning. Displaying offline workspace.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [router]);

  const handleLogout = () => {
    // Clear access token cookie
    document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };

  const handleCreateWebsiteClick = () => {
    if (billingUsage) {
      const websitesUsed = billingUsage.usage?.websites ?? 0;
      const websitesLimit = billingUsage.limits?.websites ?? 1;
      if (websitesUsed >= websitesLimit) {
        setIsUpgradeOpen(true);
        return;
      }
    }
    router.push("/dashboard/create");
  };

  const websitesRemaining = billingUsage 
    ? Math.max(0, (billingUsage.limits?.websites ?? 1) - (billingUsage.usage?.websites ?? 0))
    : 0;

  const editsRemaining = billingUsage
    ? Math.max(0, (billingUsage.limits?.ai_edits ?? 50) - (billingUsage.usage?.ai_edits ?? 0))
    : 0;

  const pageTransition = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-primary/80 font-medium">
        Loading SiteMint Console...
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageTransition}
      className="min-h-screen bg-brand-bg text-brand-text flex"
    >
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-brand-primary/10 bg-brand-dark text-brand-bg p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div className="font-serif text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-brand-accent inline-block"></span>
            SiteMint
          </div>
          <nav className="space-y-1">
            <a href="/dashboard" className="block px-3 py-2.5 rounded-lg bg-brand-primary text-brand-bg font-semibold text-sm">
              Websites
            </a>
            <a href="/dashboard" className="block px-3 py-2.5 rounded-lg text-brand-bg/70 hover:text-white hover:bg-brand-primary/20 text-sm font-medium transition-all">
              Businesses
            </a>
            <button 
              onClick={() => setIsUpgradeOpen(true)}
              className="w-full text-left block px-3 py-2.5 rounded-lg text-brand-bg/70 hover:text-white hover:bg-brand-primary/20 text-sm font-medium transition-all"
            >
              Subscription Limits
            </button>
          </nav>
        </div>
        <div className="space-y-4">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-lg border border-brand-bg/25 text-xs font-semibold text-brand-bg/70 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all"
          >
            Logout Session
          </button>
          <div className="text-[10px] text-brand-bg/40 font-mono border-t border-brand-bg/10 pt-4">SiteMint v1.0.0</div>
        </div>
      </aside>

      {/* Main dashboard view */}
      <main className="flex-1 p-6 md:p-10 space-y-8 max-w-7xl mx-auto overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Workspace Dashboard</span>
            <h1 className="font-serif text-3xl font-extrabold text-brand-dark mt-1">Console</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <Button label="Mint New Website" onClick={handleCreateWebsiteClick} />
          </div>
        </header>

        {error && (
          <div className="bg-brand-accent/15 border border-brand-accent/30 text-brand-dark p-3 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Quota Limits Dashboard Panel */}
        {billingUsage && (
          <section className="bg-brand-surface/40 border border-brand-primary/10 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-4 gap-6 items-center shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] text-brand-text/50 font-bold uppercase tracking-wider">Tier Plan</span>
              <div className="text-lg font-bold text-brand-dark flex items-center gap-2">
                <span className="uppercase text-brand-primary font-serif font-extrabold">{billingUsage.plan}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-brand-text/50 font-bold uppercase tracking-wider">Active Websites</span>
              <div className="text-lg font-bold text-brand-dark">
                {billingUsage.usage?.websites} / {billingUsage.limits?.websites === 999999 ? "∞" : billingUsage.limits?.websites}
              </div>
              <div className="text-[10px] text-brand-text/40 font-medium">({websitesRemaining} remaining)</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-brand-text/50 font-bold uppercase tracking-wider">AI Edits Used</span>
              <div className="text-lg font-bold text-brand-dark">
                {billingUsage.usage?.ai_edits} / {billingUsage.limits?.ai_edits === 999999 ? "∞" : billingUsage.limits?.ai_edits}
              </div>
              <div className="text-[10px] text-brand-text/40 font-medium">({editsRemaining} remaining)</div>
            </div>
            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] text-brand-text/50 font-bold uppercase tracking-wider">Resets on</span>
              <div className="text-sm font-semibold text-brand-dark mt-1">
                {billingUsage.billing_cycle_end ? new Date(billingUsage.billing_cycle_end).toLocaleDateString() : "N/A"}
              </div>
              <button
                onClick={() => setIsUpgradeOpen(true)}
                className="mt-1 text-xs font-bold text-brand-primary hover:underline"
              >
                Upgrade Plan &rarr;
              </button>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-brand-dark">Active Websites</h2>
          
          {websites.length === 0 ? (
            <div className="border-2 border-dashed border-brand-primary/10 bg-brand-surface/10 rounded-2xl p-16 text-center text-brand-text/50 font-medium">
              No websites created yet. Click "Mint New Website" to launch your first configuration.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {websites.map((site) => (
                <motion.div
                  key={site.id}
                  whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(47, 105, 102, 0.05)" }}
                  className="border border-brand-primary/10 bg-brand-bg rounded-2xl p-6 flex flex-col justify-between shadow-sm transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-surface text-brand-primary uppercase border border-brand-primary/5">
                        {site.status}
                      </span>
                      <span className="text-xs text-brand-text/50 font-medium">
                        {new Date(site.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-brand-dark">{site.businesses?.name}</h3>
                    <p className="text-xs text-brand-text/60 font-semibold">{site.businesses?.category}</p>
                    <a
                      href={`http://${site.domains?.[0]?.domain_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-brand-primary hover:underline block mt-2"
                    >
                      {site.domains?.[0]?.domain_name || "Configure Custom Domain"}
                    </a>
                  </div>
                  <div className="mt-6 flex gap-2 border-t border-brand-primary/5 pt-4">
                    <button
                      onClick={() => router.push(`/editor?siteId=${site.id}`)}
                      className="flex-1 px-3 py-2 rounded-lg bg-brand-primary text-brand-bg font-bold hover:bg-brand-dark text-xs transition-all active:scale-98 shadow-sm"
                    >
                      Edit Canvas
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/analytics?siteId=${site.id}`)}
                      className="px-3 py-2 rounded-lg border-2 border-brand-primary/20 text-brand-primary hover:border-brand-primary/40 font-bold text-xs transition-all active:scale-98"
                    >
                      Analytics
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/leads?siteId=${site.id}`)}
                      className="px-3 py-2 rounded-lg bg-brand-surface text-brand-text hover:bg-brand-surface/80 font-bold text-xs transition-all active:scale-98"
                    >
                      Leads
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 pt-4">
          <h2 className="font-serif text-xl font-bold text-brand-dark">Registered Businesses</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businesses.map((biz) => (
              <div key={biz.id} className="border border-brand-primary/10 bg-brand-surface/20 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-brand-primary text-brand-bg font-serif font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                  Biz
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-brand-dark">{biz.name}</h4>
                  <p className="text-xs text-brand-text/50 font-bold uppercase tracking-wider">{biz.category}</p>
                  <p className="text-sm text-brand-text/75 mt-2 leading-relaxed">{biz.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Upgrade Subscription Modal */}
      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        usageData={billingUsage} 
      />
    </motion.div>
  );
}
