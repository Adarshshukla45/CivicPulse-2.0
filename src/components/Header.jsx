import React, { useState } from "react";
import { Bell, LogOut, Check, User, Shield, AlertTriangle, Cpu } from "lucide-react";

export default function Header({
  user,
  notifications,
  onLogout,
  onMarkNotificationsRead,
  currentTab,
  onTabChange,
  onSelectComplaint,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  const getRoleBadge = (role) => {
    switch (role) {
      case "super_admin":
        return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><Shield size={12} /> Super Admin</span>;
      case "dept_admin":
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><Cpu size={12} /> Dept Officer</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><User size={12} /> Citizen</span>;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange("portal")}>
            <div className="bg-sky-500 p-2 rounded-lg text-white font-bold tracking-tight text-xl flex items-center justify-center shadow-lg">
              CP
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight leading-none">CivicPulse</h1>
              <p className="text-[10px] text-slate-400 font-mono">Transparency Engine</p>
            </div>
          </div>

          {/* Center Navigation for Authenticated users */}
          {user && (
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => onTabChange("portal")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  currentTab === "portal" ? "bg-slate-800 text-sky-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                Public Portal
              </button>
              {user.role === "citizen" && (
                <button
                  onClick={() => onTabChange("citizen-dashboard")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    currentTab === "citizen-dashboard" ? "bg-slate-800 text-sky-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  My Grievances
                </button>
              )}
              {user.role === "dept_admin" && (
                <button
                  onClick={() => onTabChange("dept-dashboard")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    currentTab === "dept-dashboard" ? "bg-slate-800 text-sky-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  Dept Console
                </button>
              )}
              {user.role === "super_admin" && (
                <button
                  onClick={() => onTabChange("super-dashboard")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    currentTab === "super-dashboard" ? "bg-slate-800 text-sky-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  Admin HQ
                </button>
              )}
            </nav>
          )}

          {/* Right Action Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Active User Badge */}
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium leading-none text-slate-100">{user.name}</span>
                  <div className="mt-1">{getRoleBadge(user.role)}</div>
                </div>

                {/* Notifications Panel Trigger */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (unreadCount > 0 && !showNotifications) {
                        onMarkNotificationsRead();
                      }
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition focus:outline-none relative"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full transform translate-x-1 -translate-y-1">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown Drawer */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-900 overflow-hidden divide-y divide-slate-100">
                      <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-700 flex items-center gap-1"><Bell size={14} className="text-sky-500" /> Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={onMarkNotificationsRead}
                            className="text-xs text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-0.5"
                          >
                            <Check size={12} /> Mark read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {!notifications || notifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div
                              key={notif._id}
                              onClick={() => {
                                if (notif.complaintId) {
                                  onSelectComplaint(notif.complaintId);
                                }
                                setShowNotifications(false);
                              }}
                              className={`p-3 text-xs leading-relaxed hover:bg-slate-50 cursor-pointer transition flex gap-2 ${
                                !notif.read ? "bg-sky-50/50 font-medium" : ""
                              }`}
                            >
                              <div className="mt-0.5 flex-shrink-0 text-amber-500">
                                <AlertTriangle size={14} />
                              </div>
                              <div className="flex-1">
                                <p>{notif.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="bg-slate-800 hover:bg-slate-700 hover:text-red-400 p-2 rounded-lg text-slate-300 transition"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onTabChange("login")}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
