import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { X, Shield, Clock, HelpCircle, CheckCircle, AlertTriangle, ArrowUpRight, Star } from "lucide-react";

import Header from "./components/Header.jsx";
import LandingPortal from "./components/LandingPortal.jsx";
import Login from "./components/Login.jsx";
import CitizenDashboard from "./components/CitizenDashboard.jsx";
import DeptAdminDashboard from "./components/DeptAdminDashboard.jsx";
import SuperAdminDashboard from "./components/SuperAdminDashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState("portal");
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditId, setAuditId] = useState(null);
  const [auditItem, setAuditItem] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);

  // Initialize: Check session
  useEffect(() => {
    checkAuthSession();
    fetchPublicAnalytics();
    fetchPublicDepartments();
  }, []);

  // Sync data when authenticated user changes
  useEffect(() => {
    if (user) {
      fetchUserComplaints();
      fetchUserNotifications();
    } else {
      setComplaints([]);
      setNotifications([]);
    }
  }, [user]);

  // Sync audit item details if modal is open
  useEffect(() => {
    if (auditId) {
      fetchAuditItem(auditId);
      setShowEscalateConfirm(false);
    } else {
      setAuditItem(null);
      setShowEscalateConfirm(false);
    }
  }, [auditId]);

  const checkAuthSession = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("/api/auth/me", { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Default tab based on role
        if (data.user.role === "citizen") setCurrentTab("citizen-dashboard");
        else if (data.user.role === "dept_admin") setCurrentTab("dept-dashboard");
        else if (data.user.role === "super_admin") setCurrentTab("super-dashboard");
      } else {
        localStorage.removeItem("accessToken");
      }
    } catch (err) {
      console.log("No active credentials/session.");
    }
  };

  const fetchPublicAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPublicDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserComplaints = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("/api/complaints", { headers });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserNotifications = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("/api/notifications", { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditItem = async (id) => {
    setLoadingAudit(true);
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`/api/complaints/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAuditItem(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
        }
        setUser(data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        
        // Navigate
        if (data.user.role === "citizen") setCurrentTab("citizen-dashboard");
        else if (data.user.role === "dept_admin") setCurrentTab("dept-dashboard");
        else if (data.user.role === "super_admin") setCurrentTab("super-dashboard");
        
        fetchPublicAnalytics();
        return true;
      } else {
        toast.error(data.error || "Authentication failed.");
        return false;
      }
    } catch (err) {
      toast.error("Network connection error.");
      return false;
    }
  };

  const handleRegister = async (payload) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
        }
        setUser(data.user);
        toast.success(`Account registered! Welcome ${data.user.name}.`);
        setCurrentTab("citizen-dashboard");
        fetchPublicAnalytics();
        return true;
      } else {
        toast.error(data.error || "Registration failed.");
        return false;
      }
    } catch (err) {
      toast.error("Registration failed.");
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      await fetch("/api/auth/logout", { method: "POST", headers });
      localStorage.removeItem("accessToken");
      setUser(null);
      setCurrentTab("portal");
      toast.success("Successfully logged out.");
    } catch (err) {
      localStorage.removeItem("accessToken");
      setUser(null);
      setCurrentTab("portal");
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("/api/notifications/mark-read", { method: "POST", headers });
      if (res.ok) {
        fetchUserNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateComplaint = async (complaintData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      };
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers,
        body: JSON.stringify(complaintData),
      });
      if (res.ok) {
        fetchUserComplaints();
        fetchPublicAnalytics();
        return true;
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to file grievance.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network connection error.");
    }
    return false;
  };

  const handleUpdateStatus = async (id, status, remark) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/complaints/${id}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status, remark }),
      });
      if (res.ok) {
        fetchUserComplaints();
        fetchPublicAnalytics();
        fetchPublicDepartments();
        if (auditId === id) fetchAuditItem(id);
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleUpdateSla = async (deptId, payload) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/departments/${deptId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchPublicDepartments();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleEscalateManual = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`/api/complaints/${id}/escalate`, { method: "POST", headers });
      const data = await res.json();
      if (res.ok) {
        toast.success("Ticket manually escalated to next Higher Authority tier!");
        fetchUserComplaints();
        fetchPublicAnalytics();
        fetchPublicDepartments();
        if (auditId === id) fetchAuditItem(id);
      } else {
        toast.error(data.error || "Failed to escalate ticket.");
      }
    } catch (err) {
      toast.error("Error submitting escalation.");
    }
  };

  const handleOverrideComplaint = async (id, { status, remark }) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/complaints/${id}/override`, {
        method: "POST",
        headers,
        body: JSON.stringify({ status, remark }),
      });
      if (res.ok) {
        toast.success("Super Admin Override applied.");
        fetchUserComplaints();
        fetchPublicAnalytics();
        fetchPublicDepartments();
        if (auditId === id) fetchAuditItem(id);
      }
    } catch (err) {
      toast.error("Override failed.");
    }
  };

  const handleRateResolution = async (id, rating) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/complaints/${id}/rate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ rating }),
      });
      if (res.ok) {
        toast.success(`Thank you! Submitted ${rating}-star resolution feedback.`);
        fetchUserComplaints();
        fetchPublicAnalytics();
        fetchPublicDepartments();
        if (auditId === id) fetchAuditItem(id);
      }
    } catch (err) {
      toast.error("Rating submission failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Header element */}
      <Header
        user={user}
        notifications={notifications}
        onLogout={handleLogout}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onSelectComplaint={setAuditId}
      />

      {/* Core Pages / View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === "portal" && (
          <LandingPortal
            analytics={analytics}
            publicComplaints={complaints ? complaints.filter(c => c.isPublic) : []}
            onSelectComplaint={setAuditId}
            onNavigate={setCurrentTab}
            isAuthenticated={!!user}
          />
        )}

        {currentTab === "login" && (
          <Login
            onLogin={handleLogin}
            onRegister={handleRegister}
            departments={departments}
          />
        )}

        {currentTab === "citizen-dashboard" && (
          <CitizenDashboard
            complaints={complaints ? complaints.filter(c => c.citizen?._id === user?._id || c.citizen === user?._id) : []}
            onCreateComplaint={handleCreateComplaint}
            onEscalate={handleEscalateManual}
            onRate={handleRateResolution}
            onSelectComplaint={setAuditId}
          />
        )}

        {currentTab === "dept-dashboard" && (
          <DeptAdminDashboard
            user={user}
            complaints={complaints}
            departments={departments}
            onUpdateStatus={handleUpdateStatus}
            onSelectComplaint={setAuditId}
          />
        )}

        {currentTab === "super-dashboard" && (
          <SuperAdminDashboard
            analytics={analytics}
            departments={departments}
            onUpdateSla={handleUpdateSla}
            onSelectComplaint={setAuditId}
            allComplaints={complaints}
            onOverrideComplaint={handleOverrideComplaint}
          />
        )}
      </main>

      {/* ==========================================
          MODAL: COMPLAINT AUDIT TRAIL VIEW
          ========================================== */}
      {auditId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-sky-400 font-bold uppercase">Auditable Transparency Log</span>
                <h3 className="text-base font-bold font-display leading-tight">{loadingAudit ? "Loading grievance..." : auditItem?.title}</h3>
              </div>
              <button
                onClick={() => setAuditId(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingAudit ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold animate-pulse">Loading audit trail...</div>
              ) : auditItem ? (
                <>
                  {/* Summary & Photo */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                    {auditItem.photos && auditItem.photos[0] && (
                      <div className="sm:col-span-4 rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-50">
                        <img
                          src={auditItem.photos[0]}
                          alt={auditItem.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="sm:col-span-8 space-y-2">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="bg-slate-200 text-slate-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                          {auditItem.category}
                        </span>
                        <span className="bg-slate-800 text-white text-[9px] font-mono px-2 py-0.5 rounded uppercase">
                          {auditItem.tier} Tier
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">"{auditItem.description}"</p>
                      <div className="text-[10px] text-slate-400 font-mono">Loc: {auditItem.location}</div>
                    </div>
                  </div>

                  {/* Rating / Escalation Block (Actionable) */}
                  {user && user.role === "citizen" && (auditItem.citizen?._id === user._id || auditItem.citizen === user._id) && (
                    <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-sky-900 font-display flex items-center gap-1">
                          <Shield size={14} className="text-sky-600" /> Actions Available
                        </span>
                      </div>

                      {/* Escalate option if not resolved and not already state tier */}
                      {auditItem.status !== "resolved" && auditItem.tier !== "state" && (
                        <div className="flex flex-col gap-3 p-3 bg-white/80 border border-sky-100 rounded-xl">
                          {!showEscalateConfirm ? (
                            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center w-full">
                              <p className="text-[11px] text-sky-850">
                                Not satisfied with response? Escalate manually to the next administrative tier level ({auditItem.tier === "local" ? "District" : "State"}).
                              </p>
                              <button
                                onClick={() => setShowEscalateConfirm(true)}
                                className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow self-stretch sm:self-auto text-center cursor-pointer whitespace-nowrap"
                              >
                                Escalate Level
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2.5 w-full">
                              <p className="text-xs font-bold text-slate-800">
                                Are you sure you want to escalate this complaint to the {auditItem.tier === "local" ? "District" : "State"} level?
                              </p>
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setShowEscalateConfirm(false)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setShowEscalateConfirm(false);
                                    await handleEscalateManual(auditItem._id);
                                  }}
                                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer font-bold"
                                >
                                  Yes, Escalate
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rating input if resolved and not rated */}
                      {auditItem.status === "resolved" && auditItem.satisfactionRating === undefined && (
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-sky-900">Rate Citizen Satisfaction</label>
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1 text-amber-500">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingInput(star)}
                                  className="focus:outline-none"
                                >
                                  <Star size={18} fill={ratingInput >= star ? "currentColor" : "none"} />
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => handleRateResolution(auditItem._id, ratingInput)}
                              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow"
                            >
                              Submit Rating
                            </button>
                          </div>
                        </div>
                      )}

                      {auditItem.status === "resolved" && auditItem.satisfactionRating !== undefined && (
                        <div className="text-xs text-sky-800 font-semibold">
                          You rated this resolution: <span className="text-amber-500">{"★".repeat(auditItem.satisfactionRating)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audit timeline trail */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Official Transparency Timeline</h4>
                    <div className="relative pl-6 border-l border-slate-200 space-y-6">
                      {auditItem.statusHistory && auditItem.statusHistory.map((history, idx) => (
                        <div key={idx} className="relative">
                          {/* Bullet marker */}
                          <div className="absolute -left-[30px] top-1 bg-white p-1 rounded-full border border-slate-300">
                            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">
                                Status updated: <span className="uppercase text-sky-600">{history.status}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(history.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>Actor: {history.changedBy?.name || "System"}</span>
                              <span>•</span>
                              <span className="uppercase font-semibold">{history.role}</span>
                            </div>
                            {history.remark && (
                              <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                "{history.remark}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm font-semibold">Unable to fetch grievance trail details.</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAuditId(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
              >
                Close Audit
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
