"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { WebsiteRenderer } from "../../components/WebsiteRenderer";
import { Button } from "@launchpad/ui";

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const siteId = searchParams.get("siteId");

  const [website, setWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Viewport state
  const [viewportMode, setViewportMode] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hello! I am your design assistant. Describe any adjustments you'd like to make (e.g. 'make background dark' or 'add pricing section')." }
  ]);

  useEffect(() => {
    async function loadWebsite() {
      if (!siteId) {
        setError("Invalid website ID parameter.");
        setLoading(false);
        return;
      }

      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("sb-access-token="))
          ?.split("=")[1];

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
              copyrightText: "© 2026 Apex Auto Repairs. Built with Launchpad.",
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
                  subtitle: "Affordable repairs, custom alignments, and expert brake tuning in Boston.",
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
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sb-access-token="))
        ?.split("=")[1];

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

  const getViewportWidth = () => {
    switch (viewportMode) {
      case "mobile": return "max-w-[375px] h-[667px]";
      case "tablet": return "max-w-[768px] h-[1024px]";
      default: return "w-full min-h-screen";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Instantiating live preview canvas...
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div>{error || "Failed to initialize editor."}</div>
        <Button label="Return to Dashboard" onClick={() => router.push("/dashboard")} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      {/* Top Header Control bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 px-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-slate-400 hover:text-white text-sm">
            ← Dashboard
          </button>
          <span className="text-white font-bold">{website.siteName}</span>
        </div>

        {/* Viewport size simulator toggles */}
        <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700/50">
          {(["desktop", "tablet", "mobile"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewportMode(mode)}
              className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-all ${
                viewportMode === mode ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div>
          <Button label="Publish Site" onClick={() => alert("Publishing scheduled for Sprint 6!")} />
        </div>
      </header>

      {/* Editor Main Workspace split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Conversational Chat logs */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/30 flex flex-col justify-between p-4 h-full">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Conversational Assistant</h3>
            {chatLog.map((chat, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-sm max-w-[85%] ${
                  chat.sender === "user"
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-100 self-end ml-auto"
                    : "bg-slate-800 text-slate-200"
                }`}
              >
                {chat.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Change hero title to..."
              className="flex-1 bg-slate-800 border border-slate-750 px-3 py-2 rounded text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-amber-500 text-slate-950 font-bold rounded text-xs hover:bg-amber-600 active:scale-95"
            >
              Send
            </button>
          </form>
        </aside>

        {/* Right Side: Interactive Preview simulator */}
        <main className="flex-1 bg-slate-900 overflow-y-auto flex items-center justify-center p-6">
          <div
            className={`w-full border border-slate-800 bg-slate-950 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${getViewportWidth()}`}
          >
            <WebsiteRenderer website={website} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 p-10">Loading Editor Canvas...</div>}>
      <EditorContent />
    </React.Suspense>
  );
}
