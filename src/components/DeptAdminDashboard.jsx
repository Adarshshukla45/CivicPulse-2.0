import React, { useState } from "react";
import { CheckCircle, AlertCircle, FileText, Settings, ShieldAlert, Cpu, Award, Eye, Calendar, MapPin } from "lucide-react";
import toast from "react-hot-toast";

export default function DeptAdminDashboard({
  user,
  complaints,
  departments,
  onUpdateStatus,
  onSelectComplaint,
}) {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState("in_review");
  const [remark, setRemark] = useState("");
  const [updating, setUpdating] = useState(false);

  const deptId = typeof user?.department === "string" ? user.department : user?.department?._id;
  const myDept = departments ? departments.find(d => d._id === deptId) : null;

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!remark.trim()) {
      toast.error("Please add official remarks/reasons for updating status.");
      return;
    }

    setUpdating(true);
    try {
      const success = await onUpdateStatus(selectedComplaint._id, newStatus, remark);
      if (success) {
        toast.success(`Grievance status updated to "${newStatus.toUpperCase()}"`);
        setSelectedComplaint(null);
        setRemark("");
      }
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase">Resolved</span>;
      case "rejected":
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase">Rejected</span>;
      case "escalated":
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase animate-pulse">Escalated</span>;
      case "in_review":
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase">In Review</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase">Pending</span>;
    }
  };

  const activeCases = complaints ? complaints.filter(c => c.status === "pending" || c.status === "in_review").length : 0;
  const escalatedCases = complaints ? complaints.filter(c => c.status === "escalated").length : 0;

  return (
    <div className="space-y-6">
      {/* Officer welcome block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-sky-400 font-bold uppercase">Government Console</span>
          <h1 className="text-xl font-bold font-display">{user?.name || "Department Officer"}</h1>
          <p className="text-xs text-slate-400">Managing official queue, resolving issues, and meeting SLAs.</p>
        </div>
        {myDept && (
          <div className="flex gap-4 items-center bg-slate-850 p-3 rounded-xl border border-slate-800 font-mono">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase">Dept Standings</span>
              <span className="text-sm font-bold text-sky-400">{myDept.name}</span>
            </div>
            <div className="border-l border-slate-850 h-8"></div>
            <div>
              <span className="text-[9px] text-slate-500 block uppercase">Gov Score</span>
              <span className="text-sm font-bold text-emerald-400">{myDept.governanceScore} pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Dept Scorecard Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-mono uppercase">Active Queue</span>
            <span className="text-2xl font-bold font-display text-slate-800 block mt-1">{activeCases} Cases</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Cpu size={20} /></div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-mono uppercase">Escalations</span>
            <span className={`text-2xl font-bold font-display block mt-1 ${escalatedCases > 0 ? "text-amber-600 animate-pulse" : "text-slate-800"}`}>
              {escalatedCases} Cases
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><CheckCircle size={20} /></div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-mono uppercase">SLA Target Limit</span>
            <span className="text-2xl font-bold font-display text-slate-800 block mt-1">
              {myDept?.slaDays || 3} Days
            </span>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-lg"><Calendar size={20} /></div>
        </div>
      </div>

      {/* Main Grid Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Queue list */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">Assigned Grievance Queue</h2>
              <p className="text-xs text-slate-400">Process or route active complaints</p>
            </div>
            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">{complaints ? complaints.length : 0} complaints</span>
          </div>

          <div className="divide-y divide-slate-150">
            {!complaints || complaints.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                No complaints currently in your department queue.
              </div>
            ) : (
              complaints.map(c => (
                <div
                  key={c._id}
                  onClick={() => setSelectedComplaint(c)}
                  className={`p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer transition hover:bg-slate-50/50 ${
                    selectedComplaint?._id === c._id ? "bg-sky-50/40" : ""
                  }`}
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono tracking-wider bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
                        {c.tier} TIER
                      </span>
                      {getStatusBadge(c.status)}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight font-display">{c.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">{c.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 font-mono">
                      <span className="flex items-center gap-0.5"><MapPin size={10} /> {c.location}</span>
                      <span>•</span>
                      <span>Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComplaint(c._id);
                      }}
                      className="p-1.5 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-0.5"
                    >
                      <Eye size={12} /> Audit Trail
                    </button>
                    <button
                      onClick={() => setSelectedComplaint(c)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3 py-2 rounded-lg shadow"
                    >
                      Process
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Process Detail Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {selectedComplaint ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-250 space-y-6 animate-fade-in sticky top-24">
              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
                  Processing Console
                </span>
                <h3 className="text-base font-bold text-slate-900 font-display">{selectedComplaint.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-h-24 overflow-y-auto">
                  "{selectedComplaint.description}"
                </p>
              </div>

              {selectedComplaint.photos && selectedComplaint.photos[0] && (
                <div className="rounded-xl overflow-hidden border border-slate-150 h-32 bg-slate-100">
                  <img
                    src={selectedComplaint.photos[0]}
                    alt="Proof"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Status Update Form */}
              <form onSubmit={handleStatusSubmit} className="space-y-4 pt-4 border-t border-slate-150">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Set Officer Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                  >
                    <option value="in_review">IN REVIEW (Reviewing details)</option>
                    <option value="resolved">RESOLVED (Grievance fixed)</option>
                    <option value="rejected">REJECTED (Invalid / Private Property)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Official Remark / Reason <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter concrete steps taken, repair dates, or reason for rejection..."
                    value={remark}
                    onChange={e => setRemark(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="flex-1 bg-transparent hover:bg-slate-50 border border-slate-200 text-slate-500 font-semibold py-2 rounded-xl text-xs transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 rounded-xl text-xs shadow transition"
                  >
                    {updating ? "Updating..." : "Commit Update"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-250 rounded-2xl p-8 text-center text-slate-400 text-xs">
              Select a grievance from the left queue to begin processing and update remarks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
