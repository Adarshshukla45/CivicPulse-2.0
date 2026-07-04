import React, { useState } from "react";
import { User, Shield, Cpu, Lock, Mail, ChevronRight, UserPlus, LogIn } from "lucide-react";

export default function Login({ onLogin, onRegister, departments }) {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [regRole, setRegRole] = useState("citizen");
  const [selectedDept, setSelectedDept] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const success = await onLogin(email, password);
      if (!success) {
        setErrorMsg("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setErrorMsg("An unexpected login error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const payload = { name, email, password, role: regRole };
      if (regRole === "dept_admin" && selectedDept) {
        payload.department = selectedDept;
      }
      const success = await onRegister(payload);
      if (!success) {
        setErrorMsg("Registration failed. Email may already be in use.");
      }
    } catch (err) {
      setErrorMsg("Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const triggerQuickLogin = async (eMail, pass) => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      await onLogin(eMail, pass);
    } catch (err) {
      setErrorMsg("Quick login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Side: Login Form Block */}
        <div className="p-8 sm:p-12 md:col-span-7 flex flex-col justify-between">
          <div>
            <div className="space-y-2 mb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 font-mono">CivicPulse Portal</span>
              <h1 className="text-2xl font-bold font-display text-slate-900">Access local transparency</h1>
              <p className="text-xs text-slate-400">Review status, file reports, and participate in local governance.</p>
            </div>

            {/* Selector Tabs */}
            <div className="flex border-b border-slate-150 mb-6 gap-6">
              <button
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg("");
                }}
                className={`pb-3 text-sm font-semibold transition border-b-2 ${
                  activeTab === "login" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab("register");
                  setErrorMsg("");
                }}
                className={`pb-3 text-sm font-semibold transition border-b-2 ${
                  activeTab === "register" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Register Citizen
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            {activeTab === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-660 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input
                      type="email"
                      required
                      placeholder="e.g. citizen@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-660 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-sm shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn size={16} /> {submitting ? "Signing In..." : "Sign In"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. johndoe@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Registering Role</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="citizen">Citizen (Standard User)</option>
                    <option value="dept_admin">Department Officer (Govt)</option>
                  </select>
                </div>

                {regRole === "dept_admin" && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Assign Department</label>
                    <select
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  disabled={submitting}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-xl text-sm shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus size={16} /> {submitting ? "Registering..." : "Create Account"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Quick Fast-Pass Testing Credentials Pane */}
        <div className="p-8 sm:p-12 md:col-span-5 bg-slate-900 text-white flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-sky-400 uppercase font-bold bg-sky-950 px-2.5 py-0.5 rounded-full border border-sky-900 inline-block">
                Evaluator Pass-key
              </span>
              <h2 className="text-xl font-bold font-display">Fast-Pass Testing</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                We've pre-seeded realistic data covering each role. Click any badge below to instantly log in as that profile and test the respective features.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              {/* Citizen fast login */}
              <button
                onClick={() => triggerQuickLogin("aarav@gmail.com", "citizen123")}
                disabled={submitting}
                className="w-full bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-750 text-left transition hover:border-blue-500/50 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-blue-500/10 text-blue-400"><User size={14} /></span>
                    <span className="text-xs font-bold text-blue-400">Citizen</span>
                  </div>
                  <h3 className="text-sm font-semibold mt-1 group-hover:text-blue-300 transition">Aarav Sharma</h3>
                  <span className="text-[10px] text-slate-500 font-mono">aarav@gmail.com</span>
                </div>
                <ChevronRight size={14} className="text-slate-500 group-hover:translate-x-1 transition" />
              </button>

              {/* Department admin fast login */}
              <button
                onClick={() => triggerQuickLogin("roads@civicpulse.org", "admin123")}
                disabled={submitting}
                className="w-full bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-750 text-left transition hover:border-amber-500/50 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-500/10 text-amber-400"><Cpu size={14} /></span>
                    <span className="text-xs font-bold text-amber-400">Roads Officer</span>
                  </div>
                  <h3 className="text-sm font-semibold mt-1 group-hover:text-amber-300 transition">Rajesh Officer</h3>
                  <span className="text-[10px] text-slate-500 font-mono">roads@civicpulse.org</span>
                </div>
                <ChevronRight size={14} className="text-slate-500 group-hover:translate-x-1 transition" />
              </button>

              {/* Super Admin fast login */}
              <button
                onClick={() => triggerQuickLogin("admin@civicpulse.org", "adminpassword")}
                disabled={submitting}
                className="w-full bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-750 text-left transition hover:border-red-500/50 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-red-500/10 text-red-400"><Shield size={14} /></span>
                    <span className="text-xs font-bold text-red-400">Super Admin</span>
                  </div>
                  <h3 className="text-sm font-semibold mt-1 group-hover:text-red-300 transition">Super Admin HQ</h3>
                  <span className="text-[10px] text-slate-500 font-mono">admin@civicpulse.org</span>
                </div>
                <ChevronRight size={14} className="text-slate-500 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono mt-8 border-t border-slate-800 pt-4">
            Security: JWT, bcrypt, HttpOnly cookies.
          </div>
        </div>

      </div>
    </div>
  );
}
