import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import {
  BarChart3,
  Users,
  Vote,
  Clock,
  ShieldAlert,
  CheckCircle,
  Store,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const VotingStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/voting/statistics');
      setStats(res.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
      setError("Failed to retrieve electoral statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Electoral Analytics & Turnout Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time aggregate participation metrics, station distributions, and candidate standing
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Registered"
          value={stats?.total_voters ?? '—'}
          subtitle="All enrolled citizens"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Eligible Voters"
          value={stats?.eligible_voters ?? '—'}
          subtitle="Meets 18+ requirement"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Total Votes Cast"
          value={stats?.total_votes ?? '—'}
          subtitle="Recorded in database"
          icon={Vote}
          color="blue"
        />
        <StatCard
          title="Pending Voters"
          value={stats?.pending_votes ?? '—'}
          subtitle="Uncast registered ballots"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Turnout Rate"
          value={`${stats?.turnout_percentage ?? 0}%`}
          subtitle="Participation ratio"
          icon={BarChart3}
          color="green"
        />
        <StatCard
          title="Duplicate Blocks"
          value={stats?.duplicate_attempts_blocked ?? '—'}
          subtitle="Attacked & prevented"
          icon={ShieldAlert}
          color="rose"
        />
      </div>

      {/* Candidate Aggregate Secret Ballot Results */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Candidate-Wise Aggregate Results</h2>
          <p className="text-[11px] text-slate-500">
            Computed from anonymous secret ballots decoupled from personal voter identity records
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {stats?.candidate_results?.map((c) => (
            <div key={c.candidate_id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    Symbol: {c.candidate_symbol}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{c.candidate_name}</h3>
                  <p className="text-xs text-slate-500">{c.party_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">{c.votes_count}</span>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Votes</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Vote Share</span>
                  <span className="text-blue-700 font-bold">{c.percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booth-Wise Turnout Comparison Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">Station-by-Station Polling Turnout Performance</h2>
          <p className="text-[11px] text-slate-500">Real-time attendance metrics by designated polling booth</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Station ID</th>
                <th className="py-3 px-4">Booth Name</th>
                <th className="py-3 px-4">Geographic Location</th>
                <th className="py-3 px-4 text-right">Registered Voters</th>
                <th className="py-3 px-4 text-right">Votes Confirmed</th>
                <th className="py-3 px-4 text-right">Turnout Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.booth_turnout?.map((b) => (
                <tr key={b.booth_id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{b.booth_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{b.booth_name}</td>
                  <td className="py-3 px-4 text-slate-500">{b.location}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">{b.total_registered}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">{b.votes_cast}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${b.turnout_percentage}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 font-mono">{b.turnout_percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VotingStatistics;
