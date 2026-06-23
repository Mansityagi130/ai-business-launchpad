import React from "react";

interface UsageData {
  plan: string;
  limits: { websites: number; ai_edits: number };
  usage: { websites: number; ai_edits: number };
  billing_cycle_end: string;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageData: UsageData | null;
}

export function UpgradeModal({ isOpen, onClose, usageData }: UpgradeModalProps) {
  if (!isOpen) return null;

  const currentPlan = usageData?.plan || "free";
  const websitesUsed = usageData?.usage?.websites ?? 0;
  const websitesLimit = usageData?.limits?.websites ?? 1;
  const websitesRemaining = Math.max(0, websitesLimit - websitesUsed);

  const editsUsed = usageData?.usage?.ai_edits ?? 0;
  const editsLimit = usageData?.limits?.ai_edits ?? 50;
  const editsRemaining = Math.max(0, editsLimit - editsUsed);

  const billingCycleEnd = usageData?.billing_cycle_end
    ? new Date(usageData.billing_cycle_end).toLocaleDateString()
    : "N/A";

  const plans = [
    {
      name: "free",
      title: "FREE",
      price: "$0",
      websites: "1 Website",
      edits: "50 AI Edits",
      desc: "For testing ideas."
    },
    {
      name: "pro",
      title: "PRO",
      price: "$19",
      websites: "5 Websites",
      edits: "500 AI Edits",
      desc: "For active builders."
    },
    {
      name: "business",
      title: "BUSINESS",
      price: "$49",
      websites: "20 Websites",
      edits: "5,000 AI Edits",
      desc: "For scaling agencies."
    },
    {
      name: "agency",
      title: "AGENCY",
      price: "$129",
      websites: "Unlimited Websites",
      edits: "Unlimited AI Edits",
      desc: "For power publishers."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8 flex flex-col gap-6 text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 uppercase tracking-widest">
              Upgrade Subscription
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Unlock Professional SaaS Capabilities
            </h2>
            <p className="text-slate-400 text-sm">
              Your action was blocked because your active plan has reached its limits. Upgrade to proceed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all text-2xl font-bold p-1"
          >
            &times;
          </button>
        </div>

        {/* Current Quota Stats Dashboard Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/40 p-4 border border-slate-850 rounded-xl text-center">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 uppercase">Current Plan</div>
            <div className="text-lg font-bold text-amber-500 uppercase">{currentPlan}</div>
          </div>
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-850 pt-2 md:pt-0">
            <div className="text-xs text-slate-500 uppercase">Websites Created</div>
            <div className="text-lg font-bold text-white">
              {websitesUsed} <span className="text-xs text-slate-400">/ {websitesLimit === 999999 ? "∞" : websitesLimit}</span>
            </div>
            <div className="text-[10px] text-slate-400">({websitesRemaining} remaining)</div>
          </div>
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-850 pt-2 md:pt-0">
            <div className="text-xs text-slate-500 uppercase">AI Edits Used</div>
            <div className="text-lg font-bold text-white">
              {editsUsed} <span className="text-xs text-slate-400">/ {editsLimit === 999999 ? "∞" : editsLimit}</span>
            </div>
            <div className="text-[10px] text-slate-400">({editsRemaining} remaining)</div>
          </div>
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-850 pt-2 md:pt-0">
            <div className="text-xs text-slate-500 uppercase">Billing Cycle Resets</div>
            <div className="text-sm font-semibold text-white mt-1">{billingCycleEnd}</div>
          </div>
        </div>

        {/* Plan Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {plans.map((p) => {
            const isCurrent = currentPlan.toLowerCase() === p.name;
            return (
              <div
                key={p.name}
                className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                  isCurrent 
                    ? "border-amber-500 ring-1 ring-amber-500/20" 
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white text-md uppercase">{p.title}</h4>
                    {isCurrent && (
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{p.desc}</p>
                  <div className="text-2xl font-extrabold text-white mt-2">
                    {p.price}
                    <span className="text-xs text-slate-400 font-normal">/mo</span>
                  </div>
                  <ul className="text-xs space-y-2 text-slate-300 pt-3 border-t border-slate-850">
                    <li>💻 {p.websites}</li>
                    <li>🤖 {p.edits}</li>
                  </ul>
                </div>
                <button
                  disabled={isCurrent}
                  className={`w-full mt-6 py-2 rounded font-bold text-xs transition-all ${
                    isCurrent
                      ? "bg-slate-800 text-slate-500 cursor-default"
                      : "bg-amber-500 text-slate-950 hover:bg-amber-450"
                  }`}
                >
                  {isCurrent ? "Current Plan" : "Upgrade CTA"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
