import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Vote, Users, Camera, Lock, Database, ArrowRight, Award, CheckCircle } from 'lucide-react';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-[#0f172a] text-white border-b border-slate-800 py-4 px-6 sm:px-12 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-wide">VOTER VERIFICATION SYSTEM</h1>
            <p className="text-[11px] text-blue-400 font-medium">Real-Time Duplicate Vote Detection Architecture</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-blue-600/30 flex items-center space-x-1.5"
          >
            <span>Access Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-[#0f172a] to-slate-900 text-white py-16 px-6 sm:px-12 border-b border-slate-800">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center space-x-2 bg-blue-900/60 border border-blue-700/50 text-blue-300 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Academic Demonstration & Institutional Prototype</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Secure Biometric Voter Verification & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              Real-Time Duplicate Vote Prevention
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminating electoral duplication through a three-layer centralized architecture. Featuring deep learning facial biometrics, atomic transaction locks, and cryptographic audit trails.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2"
            >
              <span>Launch Officer Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm rounded-xl transition-all"
            >
              Swagger API Docs
            </a>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="max-w-6xl mx-auto py-12 px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Three-Layer System Architecture</h2>
          <p className="text-xs text-slate-500 mt-1">High-integrity design separating presentation, intelligence, and storage</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">A. Frontend Presentation Layer</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              React + Vite application with role-based dashboards, live HTML5 webcam biometric capture, instant voter lookup, and responsive government design system.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">B. FastAPI Processing Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              OpenCV + DeepFace FaceNet facial embedding extraction, cosine distance scoring (threshold 0.55), atomic transaction locking, and demo OTP authentication.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">C. Centralized Database Layer</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Single authoritative SQLite source of truth with database-level uniqueness constraints, complete voter roll storage, immutable audit logs, and secret ballot isolation.
            </p>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="mt-14 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Configured Operational Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
              <span className="px-2.5 py-1 rounded bg-purple-200 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                Administrator
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-2">Central Admin</h4>
              <p className="text-xs text-slate-600 mt-1">
                Oversees election parameters, registers polling booths, audits duplicate attempts, and analyzes turnout statistics.
              </p>
              <p className="text-[11px] font-mono text-purple-900 font-medium mt-3">admin / admin123</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <span className="px-2.5 py-1 rounded bg-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                Data Entry Officer
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-2">Enrollment Officer</h4>
              <p className="text-xs text-slate-600 mt-1">
                Enrolls new voters, captures photograph records, auto-calculates voting eligibility, and logs in using Demo OTP.
              </p>
              <p className="text-[11px] font-mono text-amber-900 font-medium mt-3">dataentry / deo123</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="px-2.5 py-1 rounded bg-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                Polling Booth Officer
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-2">Station Officer</h4>
              <p className="text-xs text-slate-600 mt-1">
                Searches voter by Voter ID, runs facial verification at the polling station, and executes confirmed ballot casting.
              </p>
              <p className="text-[11px] font-mono text-emerald-900 font-medium mt-3">booth101 / booth123</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-6 px-6 text-center text-xs border-t border-slate-800">
        <p>© 2026 Voter Verification System with Real-Time Duplicate Vote Detection. Academic Prototype.</p>
        <p className="text-[11px] text-slate-500 mt-1">Configured for synthetic test records only. Not affiliated with government electoral commissions.</p>
      </footer>
    </div>
  );
};

export default Welcome;
