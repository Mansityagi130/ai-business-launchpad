"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@launchpad/ui";

export default function CreateWebsiteWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Selected state
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subdomain, setSubdomain] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
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

        const [bizRes, tempRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/businesses`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/templates`, { headers }),
        ]);

        if (bizRes.ok && tempRes.ok) {
          const bizData = await bizRes.json();
          const tempData = await tempRes.json();
          setBusinesses(bizData.data || []);
          setTemplates(tempData.data || []);
        } else {
          // Fallback mocks
          setBusinesses([{ id: "biz-1", name: "Apex Auto Repairs", category: "Automotive Services" }]);
          setTemplates([
            { id: "temp-1", name: "Consulting Minimalist", description: "Dark sleek layout", category: "Consulting", thumbnail_url: "" },
            { id: "temp-2", name: "Local Food Bakery", description: "Warm cozy layout", category: "Food & Beverage", thumbnail_url: "" }
          ]);
        }
      } catch (e) {
        // Warning fallback
        setBusinesses([{ id: "biz-1", name: "Apex Auto Repairs", category: "Automotive Services" }]);
        setTemplates([
          { id: "temp-1", name: "Consulting Minimalist", description: "Dark sleek layout", category: "Consulting", thumbnail_url: "" },
          { id: "temp-2", name: "Local Food Bakery", description: "Warm cozy layout", category: "Food & Beverage", thumbnail_url: "" }
        ]);
      }
    }
    loadData();
  }, [router]);

  const handleSubmit = async () => {
    if (!selectedBusiness || !selectedTemplate || !subdomain) {
      setError("Please complete all configurations before launching.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sb-access-token="))
        ?.split("=")[1];

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/websites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          businessId: selectedBusiness,
          templateId: selectedTemplate,
          subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")
        })
      });

      if (res.ok) {
        const body = await res.json();
        // Redirect to editor canvas passing website ID
        router.push(`/editor?siteId=${body.data.websiteId}`);
      } else {
        const errBody = await res.json();
        throw new Error(errBody.error?.message || "Failed to instantiate website configuration.");
      }
    } catch (e: any) {
      setError(e.message || "Could not instantiate website layout. Returning mock dashboard redirect.");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl border border-slate-800 bg-slate-900/50 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create Your Website</h1>
          <p className="text-sm text-slate-400">Step {step} of 3</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </header>

        {error && (
          <div className="bg-red-950/30 border border-red-800 text-red-200 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: Select Business Profile */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Business Profile</h3>
            <p className="text-sm text-slate-400">Select which business details the AI should use to write your text copy.</p>
            <div className="space-y-3">
              {businesses.map((biz) => (
                <label
                  key={biz.id}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:bg-slate-800/20 transition-all ${
                    selectedBusiness === biz.id ? "border-amber-500 bg-amber-500/5" : "border-slate-850 bg-slate-900/30"
                  }`}
                  onClick={() => setSelectedBusiness(biz.id)}
                >
                  <div>
                    <div className="font-semibold text-white">{biz.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{biz.category}</div>
                  </div>
                  <input
                    type="radio"
                    name="business"
                    checked={selectedBusiness === biz.id}
                    onChange={() => {}}
                    className="accent-amber-500 h-4 w-4"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button
                label="Continue"
                onClick={() => {
                  if (selectedBusiness) setStep(2);
                  else setError("Please select a business profile to proceed.");
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Select Curation Template Skeletons */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Starting Layout</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map((temp) => (
                <div
                  key={temp.id}
                  onClick={() => setSelectedTemplate(temp.id)}
                  className={`cursor-pointer border rounded-xl overflow-hidden bg-slate-900/30 hover:border-slate-700 transition-all flex flex-col justify-between ${
                    selectedTemplate === temp.id ? "border-amber-500 bg-amber-500/5" : "border-slate-850"
                  }`}
                >
                  <div className="h-32 bg-slate-800 flex items-center justify-center text-slate-600 text-xs">
                    {/* Placeholder image */}
                    Thumbnail Preview
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold text-white">{temp.name}</h4>
                    <p className="text-xs text-slate-400">{temp.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button label="Back" variant="outline" onClick={() => setStep(1)} />
              <Button
                label="Continue"
                onClick={() => {
                  if (selectedTemplate) setStep(3);
                  else setError("Please choose a starting template layout.");
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Subdomain Details & Launch */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configure Website Name</h3>
            <p className="text-sm text-slate-400">Choose a platform subdomain for your website address.</p>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-350">Subdomain address</label>
              <div className="flex rounded-md shadow-sm border border-slate-750 bg-slate-805 overflow-hidden">
                <input
                  type="text"
                  required
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="my-business-name"
                  className="flex-1 bg-transparent px-3 py-2 text-white placeholder-slate-600 focus:outline-none text-sm"
                />
                <span className="inline-flex items-center px-3 border-l border-slate-750 bg-slate-900 text-slate-500 text-xs font-mono">
                  .launchpad.ai
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button label="Back" variant="outline" onClick={() => setStep(2)} />
              <Button
                label={loading ? "Bootstrapping..." : "Launch Website Config"}
                onClick={handleSubmit}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
