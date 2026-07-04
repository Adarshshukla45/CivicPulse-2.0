import React, { useState } from "react";
import { Search, Info, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, ArrowUpRight, Shield, Award, Clock } from "lucide-react";

export default function LandingPortal({
  analytics,
  publicComplaints,
  onSelectComplaint,
  onNavigate,
  isAuthenticated,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");

  const filteredComplaints = publicComplaints ? publicComplaints.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
    const matchesTier = selectedTier === "all" || c.tier === selectedTier;
    return matchesSearch && matchesCategory && matchesTier;
  }) : [];

  const getStatusStyle = (status) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "rejected":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "escalated":
        return "bg-amber-100 text-amber-800 border-amber-200 animate-pulse";
      case "in_review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getTierBadgeStyle = (tier) => {
    switch (tier) {
      case "state":
        return "bg-red-500 text-white font-semibold";
      case "district":
        return "bg-indigo-500 text-white font-semibold";
      default:
        return "bg-slate-700 text-slate-100";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Block */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-slate-850">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/30 via-transparent to-transparent"></div>
        <div className="relative max-w-3xl space-y-4">
          <span className="text-sky-400 font-mono tracking-widest uppercase font-bold text-xs bg-sky-950/50 px-3 py-1 rounded-full border border-sky-900">
            Citizen Empowerment & Governance Transparency
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display">
            Direct Governance, <br />
            <span className="text-sky-400">Zero Transparency Compromises.</span>
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            CivicPulse bridges the gap between citizens and administration. File local grievances, track official department response logs, and monitor SLA fulfillment rates in public real-time transparency boards.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            {isAuthenticated ? (
              <button
                onClick={() => onNavigate("citizen-dashboard")}
                className="bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-sky-500/10 transition transform hover:-translate-y-0.5"
              >
                File a Grievance <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate("login")}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-sky-500/10 transition transform hover:-translate-y-0.5"
                >
                  File a Grievance <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => onNavigate("login")}
                  className="bg-transparent hover:bg-slate-800 border border-slate-700 text-white font-medium px-6 py-3 rounded-xl transition"
                >
                  Officer Console Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Stats Counters Grid */}
      {analytics && (
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Filed Grievances</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900 font-display">{analytics.stats.total}</span>
              <span className="text-xs text-slate-400">Total</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" /> Resolved On-time
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-emerald-600 font-display">{analytics.stats.resolved}</span>
              <span className="text-xs text-slate-400">Cases</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">Under Review</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-blue-600 font-display">{analytics.stats.in_review}</span>
              <span className="text-xs text-slate-400 font-medium">Pending</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-500" /> SLA Escalated
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-amber-600 font-display">{analytics.stats.escalated}</span>
              <span className="text-xs text-slate-400">Breaches</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between col-span-2 lg:col-span-1">
            <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1">
              <ShieldCheck size={12} className="text-sky-500" /> Satisfaction Rating
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900 font-display">{analytics.avgSatisfaction}</span>
              <span className="text-xs text-amber-500">★ ★ ★ ★ ★</span>
            </div>
          </div>
        </section>
      )}

      {/* Grid: Departments Overview & Search Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Department Performance Scoreboard */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-sky-100 p-2 rounded-lg text-sky-700">
                <Award size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Governance Scorecard</h2>
                <p className="text-xs text-slate-400">Department SLA and resolution standings</p>
              </div>
            </div>

            <div className="space-y-3">
              {analytics?.departments.map(dept => {
                const getScoreColor = (score) => {
                  if (score >= 90) return "text-emerald-600 bg-emerald-50";
                  if (score >= 75) return "text-blue-600 bg-blue-50";
                  if (score >= 60) return "text-amber-600 bg-amber-50";
                  return "text-rose-600 bg-rose-50";
                };

                return (
                  <div key={dept._id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div>
                      <span className="font-semibold text-sm text-slate-800">{dept.name}</span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                        <span className="flex items-center gap-0.5"><Clock size={10} /> SLA: {dept.slaComplianceRate}%</span>
                        <span>•</span>
                        <span>Cases: {dept.totalComplaints}</span>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${getScoreColor(dept.governanceScore)}`}>
                      {dept.governanceScore} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick FAQ info block */}
          <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100 text-sky-900 space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-bold text-sky-900 font-display">
              <Info size={16} /> SLA Escalation Model
            </div>
            <p className="text-xs leading-relaxed text-sky-800">
              Each department operates under a strict SLA resolution timeline. If complaints remain unresolved beyond their target window, they are **automatically escalated** by the system's background cron to Higher Tier governance (District / State).
            </p>
          </div>
        </div>

        {/* Right Side: Transparent Grievances Explorer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-1.5 font-display">
                  <Shield size={18} className="text-slate-600" /> Public Grievance Explorer
                </h2>
                <p className="text-xs text-slate-400">Verifiably tracking public complaints & systemic escalations</p>
              </div>

              {/* Filtering Controls */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">All Categories</option>
                  <option value="roads">Roads</option>
                  <option value="water">Water</option>
                  <option value="power">Power</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="health">Health</option>
                </select>

                <select
                  value={selectedTier}
                  onChange={e => setSelectedTier(e.target.value)}
                  className="bg-slate-50 text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">All Tiers</option>
                  <option value="local">Local</option>
                  <option value="district">District</option>
                  <option value="state">State (Escalated)</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by keyword, street name, category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>

            {/* Complaints List Cards */}
            <div className="space-y-4">
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No public complaints found matching criteria.
                </div>
              ) : (
                filteredComplaints.map(c => (
                  <div
                    key={c._id}
                    onClick={() => onSelectComplaint(c._id)}
                    className="group bg-slate-50 hover:bg-slate-100/75 p-5 rounded-xl border border-slate-100 cursor-pointer transition flex flex-col md:flex-row gap-5 items-start"
                  >
                    {/* Thumbnail if exists */}
                    {c.photos && c.photos[0] && (
                      <div className="w-full md:w-28 h-20 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-100 relative">
                        <img
                          src={c.photos[0]}
                          alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded uppercase">
                          {c.category}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusStyle(c.status)} border uppercase font-semibold`}>
                          {c.status}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getTierBadgeStyle(c.tier)} uppercase`}>
                          {c.tier} Tier
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-1 group-hover:text-sky-600 transition font-display">
                        {c.title} <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition" />
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 font-mono border-t border-slate-200/50">
                        <span>Loc: {c.location}</span>
                        <span>Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
