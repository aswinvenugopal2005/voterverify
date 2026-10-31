import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  Clock
} from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actionFilter, setActionFilter] = useState('');
  const [voterFilter, setVoterFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      let q = '/api/audit-logs?limit=150';
      if (actionFilter) q += `&action=${encodeURIComponent(actionFilter)}`;
      if (voterFilter.trim()) q += `&voter_reference=${encodeURIComponent(voterFilter.trim().toUpperCase())}`;

      const res = await api.get(q);
      setLogs(res.data);
    } catch (err) {
      console.error("Audit fetch error:", err);
      setError("Failed to fetch audit log trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action) => {
    if (action.includes('DUPLICATE')) {
      return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
    } else if (action.includes('SUCCESS') || action.includes('MATCH')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
    } else if (action.includes('FAILED') || action.includes('INELIGIBLE')) {
      return 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            <span>Immutable Electoral Audit Trail</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Security & Compliance Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically tracked logs of all verification events, duplicate attempts, and administrative actions
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              id="search-audit-voter"
              value={voterFilter}
              onChange={(e) => setVoterFilter(e.target.value)}
              placeholder="Filter by Voter ID (e.g. VTR-1001)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="">All Security Events</option>
            <option value="DUPLICATE_VOTE_BLOCKED">Duplicate Voting Blocks Only</option>
            <option value="FACE_VERIFIED">Face Verification Events</option>
            <option value="VOTE_CAST">Ballot Casting Events</option>
            <option value="VOTER_REGISTERED">New Voter Enrollments</option>
            <option value="LOGIN">Officer Logins</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Voter Reference</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Audit Description</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Retrieving audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No audit logs found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isDuplicate = log.action.includes('DUPLICATE');
                  return (
                    <tr
                      key={log.log_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isDuplicate ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-500">#{log.log_id}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getActionBadge(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                        {log.voter_reference || '—'}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">
                        {log.user_id ? `@${log.user_id}` : 'system'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 max-w-md truncate" title={log.details}>
                        {log.details || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
