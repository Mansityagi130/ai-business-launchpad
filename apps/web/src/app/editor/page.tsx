"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { WebsiteRenderer } from "../../components/WebsiteRenderer";
import { Button } from "@launchpad/ui";

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const siteId = searchParams.get("siteId");

  const [website, setWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  
  // Viewport simulator mode
  const [viewportMode, setViewportMode] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Welcome to the SiteMint editor! Type any visual instruction here (e.g. 'make background light' or 'add about section') to edit your layout." }
  ]);

  const token = typeof document !== "undefined"
    ? document.cookie.split("; ").find((row) => row.startsWith("sb-access-token="))?.split("=")[1]
    : "";

  useEffect(() => {
    async function loadWebsite() {
      if (!siteId) {
        setError("Invalid website ID parameter.");
        setLoading(false);
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/websites/${siteId}`, { headers });

        if (res.ok) {
          const body = await res.json();
          setWebsite(body.data);
        } else {
          throw new Error("Could not load website from API server.");
        }
      } catch (e) {
        // Fallback mock site layout conforming to V1.0 WebsiteSchema
        setWebsite({
          id: siteId,
          siteName: "Apex Auto Repairs",
          status: "draft",
          theme: {
            mode: "dark",
            colors: {
              primary: "#3B82F6",
              secondary: "#1E293B",
              accent: "#F59E0B",
              background: "#0F172A",
              surface: "#1E293B",
              text: "#F8FAFC",
              textMuted: "#94A3B8"
            },
            typography: { headingFont: "Outfit", bodyFont: "Inter", baseFontSize: 16 },
            uiConfig: { borderRadius: "md", buttonStyle: "solid" }
          },
          navigation: {
            header: {
              showLogo: true,
              links: [
                { label: "Home", target: "#" },
                { label: "Features", target: "#features" },
                { label: "Contact", target: "#contact" }
              ],
              ctaButton: { id: "nav-cta", label: "Get Quote", actionType: "scroll", target: "#contact" }
            },
            footer: {
              copyrightText: "© 2026 Apex Auto Repairs. Built with SiteMint.",
              links: [{ label: "Privacy Policy", target: "#" }]
            }
          },
          pages: [
            {
              slug: "/",
              title: "Home",
              sections: [
                {
                  id: "hero-section-1",
                  type: "hero",
                  orderIndex: 1.0000,
                  componentVersion: "1.0",
                  title: "Premium Automotive Services",
                  subtitle: "Affordable repairs, alignments, and brake tuning in Boston.",
                  ctaButtons: [
                    { id: "hero-cta-1", label: "Book Appointment", actionType: "scroll", target: "#contact", styleVariant: "primary" }
                  ]
                },
                {
                  id: "features-section-1",
                  type: "features",
                  orderIndex: 2.0000,
                  componentVersion: "1.0",
                  title: "Specialist Workshop Capabilities",
                  subtitle: "We maintain precision standards on all vehicle builds.",
                  items: [
                    { id: "feat-1", title: "Brake Inspections", description: "Standard pad and hydraulic rotor changes." },
                    { id: "feat-2", title: "Engine Diagnostics", description: "Comprehensive sensor parsing and error code clearing." }
                  ]
                },
                {
                  id: "contact-section-1",
                  type: "contact",
                  orderIndex: 3.0000,
                  componentVersion: "1.0",
                  title: "Locate Our Station",
                  subtitle: "Open weekdays from 8:00 AM to 5:00 PM.",
                  address: "456 Auto Drive, Boston, MA",
                  phone: "+1 (555) 019-2834",
                  whatsapp: "+15550192834",
                  showForm: true
                }
              ]
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    }

    loadWebsite();
  }, [siteId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;

    const instruction = chatPrompt;
    const newLog: { sender: "user" | "ai"; text: string }[] = [...chatLog, { sender: "user", text: instruction }];
    setChatLog(newLog);
    setChatPrompt("");

    try {
      if (!token) {
        setChatLog((prev) => [...prev, { sender: "ai", text: "Please log in to edit websites." }]);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiBaseUrl}/api/v1/internal/websites/${siteId}/edit-async`, {
        method: "POST",
        headers,
        body: JSON.stringify({ instruction })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || errData.message || "Failed to submit edit command.");
      }

      const resData = await res.json();
      const jobId = resData.jobId;

      setChatLog((prev) => [
        ...prev,
        { sender: "ai", text: "AI edit command queued in background. Applying changes..." }
      ]);

      // Poll job status every 2 seconds
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${apiBaseUrl}/api/v1/internal/websites/jobs/${jobId}`, { headers });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.data?.status === "completed") {
              clearInterval(pollInterval);
              setChatLog((prev) => [
                ...prev,
                { sender: "ai", text: "AI changes applied successfully! Reloading layout..." }
              ]);
              // Trigger reload of the editor layout
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else if (statusData.data?.status === "failed") {
              clearInterval(pollInterval);
              setChatLog((prev) => [
                ...prev,
                { sender: "ai", text: `AI edit failed: ${statusData.data?.error || "Unknown queue execution failure"}` }
              ]);
            }
          }
        } catch (e) {
          console.error("Error polling job status:", e);
        }
      }, 2000);

    } catch (err: any) {
      setChatLog((prev) => [
        ...prev,
        { sender: "ai", text: `Error: ${err.message || "Something went wrong."}` }
      ]);
    }
  };

  const handlePublish = async () => {
    setPublishLoading(true);
    setPublishMessage("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/websites/${siteId}/publish`, {
        method: "POST",
        headers
      });
      if (res.ok) {
        setWebsite((prev: any) => ({ ...prev, status: "published" }));
        setPublishMessage("Site published successfully!");
      } else {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to publish website.");
      }
    } catch (e: any) {
      setPublishMessage(`Publishing Warning: ${e.message || "Failed to connect to API"}`);
    } finally {
      setPublishLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishLoading(true);
    setPublishMessage("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/websites/${siteId}/unpublish`, {
        method: "POST",
        headers
      });
      if (res.ok) {
        setWebsite((prev: any) => ({ ...prev, status: "draft" }));
        setPublishMessage("Site unpublished successfully.");
      } else {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to unpublish website.");
      }
    } catch (e: any) {
      setPublishMessage(`Unpublishing Warning: ${e.message || "Failed to connect to API"}`);
    } finally {
      setPublishLoading(false);
    }
  };

  const getViewportWidth = () => {
    switch (viewportMode) {
      case "mobile": return "max-w-[375px] h-[667px] rounded-2xl shadow-xl border-4 border-slate-750";
      case "tablet": return "max-w-[768px] h-[1024px] rounded-2xl shadow-xl border-4 border-slate-750";
      default: return "w-full min-h-screen bg-transparent";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-primary font-medium">
        Instantiating live preview canvas...
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center text-brand-text/60 gap-4">
        <div className="font-bold text-brand-dark text-sm">{error || "Failed to initialize editor."}</div>
        <Button label="Return to Dashboard" onClick={() => router.push("/dashboard")} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-brand-bg flex flex-col overflow-hidden">
      {/* Top Header Control bar */}
      <header className="h-16 border-b border-brand-primary/10 bg-brand-bg px-6 flex justify-between items-center z-10 select-none">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-brand-primary hover:text-brand-dark text-xs font-bold uppercase tracking-wider">
            ← Dashboard
          </button>
          <span className="font-serif text-lg font-bold text-brand-dark">{website.siteName}</span>
        </div>

        {/* Viewport size simulator toggles */}
        <div className="flex bg-brand-surface/40 p-1 rounded-lg border border-brand-primary/5">
          {(["desktop", "tablet", "mobile"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewportMode(mode)}
              className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all ${
                viewportMode === mode ? "bg-brand-primary text-brand-bg shadow-sm" : "text-brand-text/50 hover:text-brand-text"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {website.status === "published" ? (
            <Button label="Unpublish Site" variant="outline" onClick={handleUnpublish} disabled={publishLoading} />
          ) : (
            <Button label="Publish Site" onClick={handlePublish} disabled={publishLoading} />
          )}
        </div>
      </header>

      {/* Editor Main Workspace split */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL 1 (Left): Conversational Chat assistant */}
        <aside className="w-80 border-r border-brand-primary/10 bg-brand-dark text-brand-bg flex flex-col justify-between p-4 h-full shrink-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">SiteMint Design Assistant</h3>
            <div className="space-y-4">
              {chatLog.map((chat, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                    chat.sender === "user"
                      ? "bg-brand-primary text-brand-bg ml-auto shadow-sm"
                      : "bg-brand-bg/10 text-brand-bg/90 border border-brand-bg/5"
                  }`}
                >
                  {chat.text}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-brand-bg/10 flex gap-2">
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Change background to light..."
              className="flex-1 bg-brand-bg/10 border border-brand-bg/15 px-3 py-2 rounded-lg text-xs text-brand-bg placeholder-brand-bg/30 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-brand-accent text-brand-text font-bold rounded-lg text-xs hover:bg-brand-accent/90 active:scale-95 transition-all shadow-sm"
            >
              Send
            </button>
          </form>
        </aside>

        {/* PANEL 2 (Center): Interactive Preview simulator */}
        <main className="flex-1 bg-brand-surface/20 overflow-y-auto flex items-center justify-center p-6 relative">
          <div
            className={`w-full transition-all duration-300 ${getViewportWidth()}`}
          >
            <WebsiteRenderer website={website} />
          </div>
        </main>

        {/* PANEL 3 (Right): Site Actions & Rollbacks */}
        <aside className="w-72 border-l border-brand-primary/10 bg-brand-bg p-5 h-full hidden lg:flex flex-col justify-between shrink-0 select-none">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">Publication Details</span>
              <div className="border border-brand-primary/10 rounded-xl p-4 bg-brand-surface/10 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-text/50">Status:</span>
                  <span className="font-bold uppercase text-brand-primary">{website.status}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-text/50">Primary Domain:</span>
                  <span className="font-bold text-brand-dark truncate max-w-[120px]" title={website.domains?.[0]?.domain_name || "N/A"}>
                    {website.domains?.[0]?.domain_name || "N/A"}
                  </span>
                </div>
              </div>
              {publishMessage && (
                <div className="text-[10px] font-semibold text-brand-primary bg-brand-primary/5 p-2 rounded border border-brand-primary/10 mt-2">
                  {publishMessage}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">Visual Rollback History</span>
              <div className="border border-brand-primary/10 rounded-xl p-3 bg-brand-surface/10 text-xs text-brand-text/50 text-center py-6">
                No rollback snapshots available for this layout draft.
              </div>
            </div>
          </div>

          <div className="text-[10px] text-brand-text/30 border-t border-brand-primary/5 pt-4">
            Changes are saved to draft session automatically.
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-brand-bg text-brand-primary p-10 font-semibold text-center">Loading Editor Canvas...</div>}>
      <EditorContent />
    </React.Suspense>
  );
}
