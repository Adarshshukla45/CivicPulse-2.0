import React, { useState, useEffect } from "react";
import { ShieldAlert, Cpu, Settings, Users, Sparkles, Plus, CheckCircle, AlertTriangle, Eye, RefreshCw, Star } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import toast from "react-hot-toast";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

export default function SuperAdminDashboard({
  analytics,
  departments,
  onUpdateSla,
  onSelectComplaint,
  allComplaints,
  onOverrideComplaint,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [usersList, setUsersList] = useState([]);
  const [aiRecs, setAiRecs] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [newSlaDays, setNewSlaDays] = useState(3);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newUserRole, setNewUserRole] = useState("citizen");
  const [newUserDept, setNewUserDept] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Manual cron trigger
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("/api/users", { headers });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateSlaSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDeptId) return;
    try {
      const success = await onUpdateSla(selectedDeptId, { slaDays: Number(newSlaDays) });
      if (success) {
        toast.success("SLA configurations updated successfully.");
        setSelectedDeptId("");
      }
    } catch (err) {
      toast.error("Failed to update SLA.");
    }
  };

  const handleUpdateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      const payload = { role: newUserRole };
      if (newUserRole === "dept_admin" && newUserDept) {
        payload.department = newUserDept;
      }
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`/api/users/${selectedUserId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("User credentials / role reassigned.");
        setSelectedUserId("");
        fetchUsers();
      } else {
        toast.error("Failed to reassign user.");
      }
    } catch (err) {
      toast.error("Error during assignment.");
    }
  };

  const handleTriggerEscalateScan = async () => {
    setEscalating(true);
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("/api/system/escalate-scan", { method: "POST", headers });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Escalated ${data.escalatedCount} breach tickets!`, { duration: 4000 });
      }
    } catch (err) {
      toast.error("Failed to run SLA escalations.");
    } finally {
      setEscalating(false);
    }
  };

  const handleFetchAiRecs = async () => {
    setLoadingAi(true);
    setAiRecs("");
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("/api/ai/governance-recs", { headers });
      if (res.ok) {
        const data = await res.json();
        setAiRecs(data.recommendations);
        toast.success("Gemini advisory report synthesized!");
      } else {
        setAiRecs("AI Recommendations require a GEMINI_API_KEY in settings secrets.");
      }
    } catch (err) {
      setAiRecs("Failed to generate report. Please check API key.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Block */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold">HQ Strategic Administration</span>
          <h1 className="text-2xl font-bold font-display">Strategic Command Console</h1>
          <p className="text-xs text-slate-400">Manage SLA policy controls, change roles, audit overrides, and request Gemini-powered reports.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleTriggerEscalateScan}
            disabled={escalating}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow flex items-center gap-1 cursor-pointer transition"
          >
            <RefreshCw size={12} className={escalating ? "animate-spin" : ""} />
            {escalating ? "Scanning SLAs..." : "Trigger SLA Scan"}
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        {["overview", "slas", "users", "overrides"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-2.5 text-sm font-semibold transition border-b-2 uppercase tracking-wide ${
              activeTab === t ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Charts block */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 font-display">Department Governance scores</h2>
              <div className="h-64">
                {analytics && analytics.departments && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.departments}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="governanceScore" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Score (pts)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-slate-800 font-display">Category distribution</h2>
                <div className="h-44 flex items-center justify-center">
                  {analytics && analytics.categoryDistribution && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.categoryDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="category"
                        >
                          {analytics.categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] font-mono uppercase text-slate-500">
                  {analytics?.categoryDistribution.map((entry, index) => (
                    <div key={entry.category} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span>{entry.category} ({entry.count})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SLA compliance Standings */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-slate-800 font-display">Compliance Standing</h2>
                <div className="space-y-2">
                  {analytics?.departments.map(d => (
                    <div key={d._id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-semibold">{d.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-sky-500 h-1.5" style={{ width: `${d.slaComplianceRate}%` }}></div>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-700">{d.slaComplianceRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI governance report */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1 font-display">
                    <Sparkles size={16} className="text-sky-500" /> Gemini Governance advisor
                  </h3>
                  <p className="text-[10px] text-slate-400">Generate real-time policy advisories based on municipal trends</p>
                </div>
                <button
                  onClick={handleFetchAiRecs}
                  disabled={loadingAi}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-xl"
                  title="Generate insights"
                >
                  <RefreshCw size={14} className={loadingAi ? "animate-spin" : ""} />
                </button>
              </div>

              {loadingAi ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="animate-spin text-sky-500" size={24} />
                  <span>Synthesizing system metrics...</span>
                </div>
              ) : aiRecs ? (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl max-h-96 overflow-y-auto text-xs space-y-3 text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                  {aiRecs}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  No governance report generated yet. Click the button to request Gemini AI analysis.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* SLAs Tab */}
      {activeTab === "slas" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Sla Form */}
          <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-display">Configure SLAs</h2>
            <form onSubmit={handleUpdateSlaSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Select Department</label>
                <select
                  value={selectedDeptId}
                  onChange={e => {
                    setSelectedDeptId(e.target.value);
                    const selected = departments.find(d => d._id === e.target.value);
                    if (selected) setNewSlaDays(selected.slaDays);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                >
                  <option value="">Choose department...</option>
                  {departments && departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name} (Current: {d.slaDays} days)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Target SLA resolution limit (days)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={newSlaDays}
                  onChange={e => setNewSlaDays(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs shadow cursor-pointer transition"
              >
                Apply SLA Policy Limit
              </button>
            </form>
          </div>

          {/* Right Column: Sla Table Standings */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-500">
              <thead className="bg-slate-50 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-150">
                <tr>
                  <th className="p-4">Department</th>
                  <th className="p-4">Governance Standing</th>
                  <th className="p-4">SLA target Limit</th>
                  <th className="p-4">SLA compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {departments && departments.map(d => (
                  <tr key={d._id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">{d.name}</td>
                    <td className="p-4 font-mono font-bold text-emerald-600">{d.governanceScore} pts</td>
                    <td className="p-4 font-semibold text-slate-700">{d.slaDays} Days</td>
                    <td className="p-4 font-mono">{d.slaComplianceRate || 100}% Met</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Role manager */}
          <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-display">Reassign Role / Dept</h2>
            <form onSubmit={handleUpdateRoleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Select User</label>
                <select
                  value={selectedUserId}
                  onChange={e => {
                    setSelectedUserId(e.target.value);
                    const sel = usersList.find(u => u._id === e.target.value);
                    if (sel) {
                      setNewUserRole(sel.role);
                      setNewUserDept(sel.department || "");
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none"
                  required
                >
                  <option value="">Choose User...</option>
                  {usersList.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Assigned Role</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none"
                >
                  <option value="citizen">Citizen</option>
                  <option value="dept_admin">Department Officer</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {newUserRole === "dept_admin" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Assigned Department</label>
                  <select
                    value={newUserDept}
                    onChange={e => setNewUserDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none"
                    required
                  >
                    <option value="">Select department...</option>
                    {departments && departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs shadow cursor-pointer transition"
              >
                Save Role Assignment
              </button>
            </form>
          </div>

          {/* Right Column: Users List */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingUsers ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold">Loading municipal profiles...</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-500">
                <thead className="bg-slate-50 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-150">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Department ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {usersList.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-800">{u.name}</td>
                      <td className="p-4 font-mono text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          u.role === "super_admin" ? "bg-red-100 text-red-800" :
                          u.role === "dept_admin" ? "bg-amber-100 text-amber-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">{u.department || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Overrides Tab */}
      {activeTab === "overrides" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 font-display">Escalated Grievance Override Center</h2>
            <p className="text-xs text-slate-400">Super Admins have structural authority to resolve or override pending/escalated complaints directly.</p>
          </div>

          <div className="divide-y divide-slate-150">
            {!allComplaints || allComplaints.filter(c => c.status === "escalated").length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm font-mono">
                No active SLA Escalated breaches in system. All clear!
              </div>
            ) : (
              allComplaints.filter(c => c.status === "escalated").map(c => {
                const deptName = typeof c.department === "object" ? c.department?.name : c.category;

                return (
                  <div key={c._id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
                          ESCALATED SLA BREACH
                        </span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {deptName} Dept
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 font-display">{c.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">"{c.description}"</p>
                      <span className="text-[10px] text-slate-400 block font-mono">Loc: {c.location} | Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectComplaint(c._id)}
                        className="p-2 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-0.5"
                      >
                        <Eye size={12} /> Audit Trail
                      </button>
                      <button
                        onClick={() => {
                          const remarkStr = prompt("Enter Super Admin override resolution remarks:");
                          if (remarkStr) {
                            onOverrideComplaint(c._id, { status: "resolved", remark: remarkStr });
                          }
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow cursor-pointer transition"
                      >
                        Override & Resolve
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
