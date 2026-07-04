import React, { useState } from "react";
import { Plus, Eye, AlertTriangle, Send, Sparkles, Image as ImageIcon, CheckCircle, HelpCircle, Star, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

const PRESET_PHOTOS = [
  {
    name: "Road Pothole",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Broken Pipe",
    url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Garbage Pile",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Power Outage",
    url: "https://images.unsplash.com/photo-1513828742140-ccaa34f37288?auto=format&fit=crop&w=600&q=80",
  },
];

export default function CitizenDashboard({
  complaints,
  onCreateComplaint,
  onEscalate,
  onRate,
  onSelectComplaint,
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("roads");
  const [location, setLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const handleAICategorization = async () => {
    if (!description.trim()) {
      toast.error("Please enter a grievance description first.");
      return;
    }
    setAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze-grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.suggestedCategory) {
          let cat = data.suggestedCategory.toLowerCase().trim();
          
          // Map common synonyms to standard categories
          if (cat.includes("road") || cat.includes("pothole") || cat.includes("street")) {
            cat = "roads";
          } else if (cat.includes("water") || cat.includes("sewage") || cat.includes("drain")) {
            cat = "water";
          } else if (cat.includes("power") || cat.includes("electr") || cat.includes("light")) {
            cat = "power";
          } else if (cat.includes("sanitat") || cat.includes("garb") || cat.includes("trash") || cat.includes("waste")) {
            cat = "sanitation";
          } else if (cat.includes("health") || cat.includes("hospit") || cat.includes("clinic") || cat.includes("medic")) {
            cat = "health";
          } else {
            cat = "other";
          }
          
          setCategory(cat);
        }
        if (data.suggestedTitle) setTitle(data.suggestedTitle);
        toast.success(`AI Suggestions Loaded: Title & Category matching complete!`, { duration: 4000 });
      } else {
        toast.error("AI Analysis is resting. Please select manually.");
      }
    } catch (err) {
      toast.error("Failed to connect with AI analyzer.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !category || !location) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const success = await onCreateComplaint({
        title,
        description,
        category,
        location,
        photos: photoUrl ? [photoUrl] : [],
      });

      if (success) {
        toast.success("Grievance filed and routed to department!");
        setShowForm(false);
        setTitle("");
        setDescription("");
        setLocation("");
        setPhotoUrl("");
      }
    } catch (err) {
      toast.error("Failed to file grievance.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = complaints ? complaints.filter(c => {
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  }) : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">Resolved</span>;
      case "rejected":
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">Rejected</span>;
      case "escalated":
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase animate-pulse">Escalated</span>;
      case "in_review":
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">In Review</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">My Grievances Workspace</h1>
          <p className="text-xs text-slate-400">File new reports, track ongoing SLA times, and override rejections.</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
        >
          <Plus size={16} /> {showForm ? "Hide Form" : "File New Grievance"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 animate-fade-in">
          <h2 className="text-lg font-bold text-slate-900 mb-6 font-display">File a Civic Grievance</h2>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Grievance Description <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={handleAICategorization}
                  disabled={analyzing}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-800 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition"
                >
                  <Sparkles size={12} className={analyzing ? "animate-spin" : ""} />
                  {analyzing ? "AI Scanning..." : "Analyze with Gemini AI ✨"}
                </button>
              </div>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your grievance clearly (e.g. Broken streetlight causing dark alleyway on 5th avenue block...)"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Refined Grievance Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Major Pothole near block 4"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category Routing <span className="text-red-500">*</span></label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="roads">Roads Department</option>
                  <option value="water">Water Department</option>
                  <option value="power">Power Department</option>
                  <option value="sanitation">Sanitation Department</option>
                  <option value="health">Health Department</option>
                  <option value="other">Other / Support</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Location / Street Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Lane 12, Sunnyvale (Near Community Hall)"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Issue Photo / Proof (URL or Preset)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input
                      type="url"
                      placeholder="Paste image URL..."
                      value={photoUrl}
                      onChange={e => setPhotoUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      className="px-3 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-xs font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="pt-1.5">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5">QUICK ATTACH SIMULATED PHOTOS FOR TESTING:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PHOTOS.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setPhotoUrl(p.url);
                          toast.success(`Attached preset: ${p.name}`);
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                          photoUrl === p.url
                            ? "bg-sky-500 text-white border-sky-600"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-transparent hover:bg-slate-100 border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow transition"
              >
                {submitting ? "Filing..." : "File Grievance"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">Grievances History Tracker</h2>
            <p className="text-xs text-slate-400">Review, escalate, and rate filed responses</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["all", "pending", "in_review", "resolved", "rejected", "escalated"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition uppercase ${
                  statusFilter === status
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No filed grievances in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredComplaints.map(c => {
                const deptName = typeof c.department === "object" ? c.department?.name : c.category;

                return (
                  <div
                    key={c._id}
                    className="p-5 rounded-xl border border-slate-150 flex flex-col justify-between space-y-4 hover:shadow transition bg-slate-50/50"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase font-semibold">
                          {deptName} Department
                        </span>
                        {getStatusBadge(c.status)}
                      </div>

                      <h3 className="text-base font-bold text-slate-800 font-display line-clamp-1">{c.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between">
                      <div className="flex flex-col text-[10px] font-mono text-slate-400">
                        <span>Loc: {c.location}</span>
                        <span>Date: {new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>

                      <button
                        onClick={() => onSelectComplaint(c._id)}
                        className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-300 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                      >
                        <Eye size={12} /> View Audit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
