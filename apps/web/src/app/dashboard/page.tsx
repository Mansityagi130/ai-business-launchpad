"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  // Handle billing gate checking when trying to click 'Create New Website'
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div className="text-amber-500 font-bold text-lg">Launchpad Portal</div>
          <nav className="space-y-2">
            <a href="/dashboard" className="block px-3 py-2 rounded-md bg-slate-800 text-white font-medium">Websites</a>
            <a href="/dashboard" className="block px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/40">Businesses</a>
            <button 
              onClick={() => setIsUpgradeOpen(true)}
              className="w-full text-left block px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/40"
            >
              Billing & Subscription
            </button>
          </nav>
        </div>
        <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">Version 1.0.0</div>
      </aside>

      {/* Main dashboard view */}
      <main className="flex-1 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage your active business online presences</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <Button label="Create New Website" onClick={handleCreateWebsiteClick} />
          </div>
        </header>

        {error && (
          <div className="bg-amber-950/20 border border-amber-800/50 text-amber-250 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Quota Limits Dashboard Panel */}
        {billingUsage && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase">Subscription Plan</span>
              <div className="text-xl font-bold text-white flex items-center gap-2">
                <span className="uppercase text-amber-500">{billingUsage.plan}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase">Active Websites</span>
              <div className="text-xl font-bold text-white">
                {billingUsage.usage?.websites} / {billingUsage.limits?.websites === 999999 ? "∞" : billingUsage.limits?.websites}
              </div>
              <div className="text-[10px] text-slate-400">({websitesRemaining} remaining)</div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase">AI Edits Used</span>
              <div className="text-xl font-bold text-white">
                {billingUsage.usage?.ai_edits} / {billingUsage.limits?.ai_edits === 999999 ? "∞" : billingUsage.limits?.ai_edits}
              </div>
              <div className="text-[10px] text-slate-400">({editsRemaining} remaining)</div>
            </div>
            <div className="space-y-1 flex flex-col md:items-end">
              <span className="text-xs text-slate-500 uppercase">Resets on</span>
              <span className="text-sm font-semibold text-white mt-1">
                {billingUsage.billing_cycle_end ? new Date(billingUsage.billing_cycle_end).toLocaleDateString() : "N/A"}
              </span>
              <button
                onClick={() => setIsUpgradeOpen(true)}
                className="mt-2 text-xs font-bold text-amber-500 hover:underline"
              >
                Upgrade Plan &rarr;
              </button>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-200">Active Websites</h2>
          
          {websites.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
              No websites created yet. Click "Create New Website" to bootstrap your site.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {websites.map((site) => (
                <div key={site.id} className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-350 uppercase">
                        {site.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(site.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{site.businesses?.name}</h3>
                    <p className="text-xs text-slate-400">{site.businesses?.category}</p>
                    <a
                      href={`http://${site.domains?.[0]?.domain_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-amber-500 hover:underline block mt-2"
                    >
                      {site.domains?.[0]?.domain_name || "Configure Domain"}
                    </a>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => router.push(`/editor?siteId=${site.id}`)}
                      className="flex-1 px-3 py-1.5 rounded bg-slate-800 text-white font-medium hover:bg-slate-750 text-xs transition-all"
                    >
                      Edit layout
                    </button>
                    <button className="px-3 py-1.5 rounded border border-slate-800 text-slate-400 hover:text-white text-xs transition-all">
                      Analytics
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold text-slate-200">Registered Businesses</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businesses.map((biz) => (
              <div key={biz.id} className="border border-slate-800/80 bg-slate-900/20 rounded-lg p-5 flex items-start gap-4">
                <div className="p-2.5 rounded-md bg-slate-800 text-amber-500 font-bold">Biz</div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-white">{biz.name}</h4>
                  <p className="text-xs text-slate-400">{biz.category}</p>
                  <p className="text-sm text-slate-300 mt-2">{biz.description}</p>
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
    </div>
  );
}
