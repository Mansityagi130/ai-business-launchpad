"use client";

import React, { useEffect, useState } from "react";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const token = typeof document !== "undefined"
    ? document.cookie.split("; ").find((row) => row.startsWith("sb-access-token="))?.split("=")[1]
    : "";

  useEffect(() => {
    async function loadNotifications() {
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const body = await res.json();
          const list = body.data || [];
          setNotifications(list);
          setUnreadCount(list.filter((n: any) => !n.is_read).length);
        }
      } catch (e) {
        console.warn("Could not query notifications API. Running in offline mock mode.");
        const mockList = [
          { id: "not-1", title: "New Lead Captured 🚀", message: "A visitor named Sophia Lopez submitted a contact inquiry form.", is_read: false, created_at: new Date().toISOString() },
          { id: "not-2", title: "Website Published Live! 🎉", message: "Your website configuration is active at apexrepairs.launchpad.ai.", is_read: true, created_at: new Date().toISOString() }
        ];
        setNotifications(mockList);
        setUnreadCount(mockList.filter((n: any) => !n.is_read).length);
      }
    }
    
    loadNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/internal/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      // Offline fallback state update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all focus:outline-none"
      >
        {/* Bell Icon */}
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
            <h3 className="font-bold text-sm text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-amber-500 font-semibold">{unreadCount} unread</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-850">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No alerts or notifications recorded.
              </div>
            ) : (
              notifications.map((not) => (
                <div
                  key={not.id}
                  onClick={() => !not.is_read && handleMarkAsRead(not.id)}
                  className={`p-4 text-left transition-colors cursor-pointer hover:bg-slate-800/40 ${
                    !not.is_read ? "bg-amber-500/[0.02]" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold text-xs text-slate-200">{not.title}</div>
                    {!not.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{not.message}</p>
                  <span className="text-[10px] text-slate-500 block mt-2">
                    {new Date(not.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
