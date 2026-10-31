import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatCard from '../components/StatCard';
import {
  Users,
  CheckCircle,
  Store,
  Vote,
  Clock,
  ShieldAlert,
  UserPlus,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.get('/api/voting/statistics'),
        api.get('/api/audit-logs?limit=8')
      ]);
      setStats(statsRes.data);
      setRecentLogs(logsRes.data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to fetch administrative statistics from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Central Administrative Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time biometric monitoring, voter turnout status, and duplicate vote prevention logs
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/register-voter"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Voter</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Voters"
          value={stats?.total_voters ?? '—'}
          subtitle="Registered in roll"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Eligible"
          value={stats?.eligible_voters ?? '—'}
          subtitle="Age 18 and above"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Polling Booths"
          value={stats?.total_booths ?? '—'}
          subtitle="Active stations"
          icon={Store}
          color="purple"
        />
        <StatCard
          title="Votes Cast"
          value={stats?.total_votes ?? '—'}
          subtitle={`Turnout: ${stats?.turnout_percentage ?? 0}%`}
          icon={Vote}
          color="blue"
        />
        <StatCard
          title="Pending Votes"
          value={stats?.pending_votes ?? '—'}
          subtitle="Yet to participate"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Duplicate Blocks"
          value={stats?.duplicate_attempts_blocked ?? '—'}
          subtitle="Blocked by system"
          icon={ShieldAlert}
          color="rose"
        />
      </div>

      {/* Grid: Turnout & Candidate Aggregate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Results (Secret Ballot Tally) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Election Standings & Candidate Aggregate</h2>
              <p className="text-[11px] text-slate-500">Decoupled secret ballot tallies from authoritative SQLite store</p>
            </div>
            <Link to="/statistics" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1">
              <span>Full Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4 pt-2">
            {stats?.candidate_results?.length > 0 ? (
              stats.candidate_results.map((c) => (
                <div key={c.candidate_id} className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                        {c.candidate_symbol[0]}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800">{c.candidate_name}</p>
                        <p className="text-[11px] text-slate-500">{c.party_name} ({c.candidate_symbol})</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{c.votes_count} votes</p>
                      <p className="text-[11px] font-semibold text-blue-600">{c.percentage}%</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No votes recorded yet for this active election.</p>
            )}
          </div>
        </div>

        {/* Turnout Donut / Meter Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Total Electoral Turnout</h2>
            <p className="text-[11px] text-slate-500">Live participation rate</p>

            <div className="my-8 text-center">
              <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-8 border-blue-600/20 bg-blue-50/50 relative">
                <span className="text-3xl font-extrabold text-blue-700">
                  {stats?.turnout_percentage ?? 0}%
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Turnout Rate
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Total Votes Recorded:</span>
                <span className="font-bold text-slate-800">{stats?.total_votes ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Remaining Eligible:</span>
                <span className="font-bold text-slate-800">{stats?.pending_votes ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-rose-600">
                <span className="font-medium">Duplicate Attempts Blocked:</span>
                <span className="font-bold font-mono">{stats?.duplicate_attempts_blocked ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/face-verification"
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <span>Test Face Verification</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Polling Booths & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booth-wise Overview Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Polling Booth Stations Status</h2>
              <p className="text-[11px] text-slate-500">Turnout by assigned polling center</p>
            </div>
            <Link to="/booths" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Manage Booths
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Booth ID</th>
                  <th className="py-2.5 px-3">Booth Name</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-right">Voters</th>
                  <th className="py-2.5 px-3 text-right">Votes</th>
                  <th className="py-2.5 px-3 text-right">Turnout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.booth_turnout?.length > 0 ? (
                  stats.booth_turnout.map((b) => (
                    <tr key={b.booth_id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{b.booth_id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{b.booth_name}</td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{b.location}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">{b.total_registered}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">{b.votes_cast}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{b.turnout_percentage}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500">No polling booths loaded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Audit Trail */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Security Audits</h2>
                <p className="text-[11px] text-slate-500">Live system events & blocks</p>
              </div>
              <Link to="/audit-logs" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentLogs.slice(0, 5).map((log) => {
                const isDuplicate = log.action.includes('DUPLICATE');
                return (
                  <div
                    key={log.log_id}
                    className={`p-2.5 rounded-xl border text-xs ${
                      isDuplicate
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isDuplicate ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.voter_reference && (
                      <p className="font-mono text-[11px] font-semibold mt-1">
                        Ref: {log.voter_reference}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{log.details}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
