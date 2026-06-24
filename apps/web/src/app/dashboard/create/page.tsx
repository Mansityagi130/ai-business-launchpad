"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
            { id: "temp-1", name: "Consulting Minimalist", description: "Dark sleek layout", category: "Consulting & Professional Services", theme_config: { colors: { primary: "#3B82F6" } } },
            { id: "temp-2", name: "Local Food Bakery", description: "Warm cozy layout", category: "Food & Beverage", theme_config: { colors: { primary: "#D97706" } } }
          ]);
        }
      } catch (e) {
        // Warning fallback
        setBusinesses([{ id: "biz-1", name: "Apex Auto Repairs", category: "Automotive Services" }]);
        setTemplates([
          { id: "temp-1", name: "Consulting Minimalist", description: "Dark sleek layout", category: "Consulting & Professional Services", theme_config: { colors: { primary: "#3B82F6" } } },
          { id: "temp-2", name: "Local Food Bakery", description: "Warm cozy layout", category: "Food & Beverage", theme_config: { colors: { primary: "#D97706" } } }
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

  const stepTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-2xl border border-brand-primary/10 bg-brand-surface/20 rounded-2xl p-8 backdrop-blur-md shadow-lg space-y-8">
        
        {/* Header timeline */}
        <header className="text-center space-y-4">
          <button 
            onClick={() => router.push("/dashboard")} 
            className="text-xs font-bold text-brand-primary hover:text-brand-dark uppercase tracking-wider block mx-auto"
          >
            ← Return to Dashboard
          </button>
          <h1 className="font-serif text-3xl font-extrabold text-brand-dark">Mint Your Site</h1>
          
          <div className="flex justify-between items-center text-xs font-bold text-brand-text/50 max-w-sm mx-auto pt-2">
            <span className={step >= 1 ? "text-brand-primary" : ""}>1. Business</span>
            <span className={step >= 2 ? "text-brand-primary" : ""}>2. Layout</span>
            <span className={step >= 3 ? "text-brand-primary" : ""}>3. Domain</span>
          </div>
          
          <div className="w-full bg-brand-primary/10 h-1.5 rounded-full overflow-hidden max-w-sm mx-auto">
            <motion.div
              className="bg-brand-primary h-full"
              initial={{ width: "33%" }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            ></motion.div>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-700 p-3 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Select Business Profile */}
          {step === 1 && (
            <motion.div
              key="step-1"
              variants={stepTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-brand-dark">Select Business Profile</h3>
                <p className="text-xs text-brand-text/60">Choose which corporate category and descriptions to supply to the copy generator.</p>
              </div>

              <div className="space-y-3">
                {businesses.length === 0 ? (
                  <div className="text-center py-6 text-brand-text/40 text-xs font-semibold">
                    No business profiles registered. Mocks will be applied.
                  </div>
                ) : (
                  businesses.map((biz) => (
                    <label
                      key={biz.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer hover:bg-brand-surface/40 transition-all ${
                        selectedBusiness === biz.id ? "border-brand-primary bg-brand-bg" : "border-brand-primary/5 bg-brand-bg/50"
                      }`}
                      onClick={() => setSelectedBusiness(biz.id)}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-brand-dark text-sm">{biz.name}</div>
                        <div className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">{biz.category}</div>
                      </div>
                      <input
                        type="radio"
                        name="business"
                        checked={selectedBusiness === biz.id}
                        onChange={() => {}}
                        className="accent-brand-primary h-4 w-4"
                      />
                    </label>
                  ))
                )}
              </div>
              <div className="flex justify-end pt-4 border-t border-brand-primary/5">
                <Button
                  label="Continue"
                  onClick={() => {
                    if (selectedBusiness) {
                      setError("");
                      setStep(2);
                    } else {
                      setError("Please select a business profile to proceed.");
                    }
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* STEP 2: Choose Template */}
          {step === 2 && (
            <motion.div
              key="step-2"
              variants={stepTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-brand-dark">Choose Layout Blueprint</h3>
                <p className="text-xs text-brand-text/60">Select an initial visual structure and typography tone for your site pages.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {templates.map((temp) => (
                  <div
                    key={temp.id}
                    onClick={() => setSelectedTemplate(temp.id)}
                    className={`cursor-pointer border-2 rounded-xl overflow-hidden bg-brand-bg hover:border-brand-primary/40 transition-all flex flex-col justify-between ${
                      selectedTemplate === temp.id ? "border-brand-primary" : "border-brand-primary/5"
                    }`}
                  >
                    <div className="h-28 bg-brand-surface/40 flex items-center justify-center text-brand-primary/70 text-xs font-semibold">
                      Layout Skeleton Preview
                    </div>
                    <div className="p-4 space-y-1">
                      <h4 className="font-serif font-bold text-brand-dark text-sm">{temp.name}</h4>
                      <p className="text-[10px] text-brand-text/50 font-medium">{temp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4 border-t border-brand-primary/5">
                <Button label="Back" variant="outline" onClick={() => setStep(1)} />
                <Button
                  label="Continue"
                  onClick={() => {
                    if (selectedTemplate) {
                      setError("");
                      setStep(3);
                    } else {
                      setError("Please choose a starting template layout.");
                    }
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* STEP 3: Subdomain & Launch */}
          {step === 3 && (
            <motion.div
              key="step-3"
              variants={stepTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-brand-dark">Configure Site URL</h3>
                <p className="text-xs text-brand-text/60">Define the subdomain address where your website preview will be active.</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Subdomain Address</label>
                <div className="flex rounded-lg border-2 border-brand-primary/10 bg-brand-bg overflow-hidden focus-within:border-brand-primary transition-colors">
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="my-launch-project"
                    className="flex-grow bg-transparent px-4 py-2.5 text-brand-text placeholder-brand-text/30 focus:outline-none text-sm font-semibold"
                  />
                  <span className="inline-flex items-center px-4 bg-brand-surface text-brand-primary text-xs font-bold font-mono border-l border-brand-primary/10 select-none">
                    .launchpad.ai
                  </span>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-brand-primary/5">
                <Button label="Back" variant="outline" onClick={() => setStep(2)} />
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg font-semibold bg-brand-primary text-brand-bg text-sm hover:bg-brand-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
                >
                  {loading ? "Minting Canvas..." : "Launch Generation Flow"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
