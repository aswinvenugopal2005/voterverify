import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { UserPlus, Users, Store, CheckCircle, Search, ArrowRight, ShieldCheck } from 'lucide-react';

const DataEntryDashboard = () => {
  const { user } = useAuth();
  const [voters, setVoters] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentVoters = async () => {
      try {
        const res = await api.get('/api/voters?limit=6');
        setVoters(res.data.voters);
        setTotalCount(res.data.total);
      } catch (err) {
        console.error("DEO dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentVoters();
  }, []);

  return (
    <div className="space-y-6">
      {/* Officer Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-900/40 border border-amber-400/30 text-amber-100 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Voter Enrollment Station</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome, {user?.full_name || 'Data Entry Officer'}</h1>
          <p className="text-xs text-amber-100 mt-1 max-w-xl">
            Authorized to register new citizens into the electoral roll, validate age criteria, assign polling booths, and verify biometric photo compliance.
          </p>
        </div>

        <Link
          to="/register-voter"
          className="px-5 py-3 bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Voter</span>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Registered Voters"
          value={totalCount}
          subtitle="Currently enrolled in database"
          icon={Users}
          color="amber"
        />
        <StatCard
          title="Eligible Voters"
          value={voters.filter(v => v.is_eligible).length}
          subtitle="Age 18 & above"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Polling Booths"
          value="3 Stations"
          subtitle="Active assignment locations"
          icon={Store}
          color="blue"
        />
      </div>

      {/* Recent Voter Registrations Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recently Enrolled Citizens</h2>
            <p className="text-[11px] text-slate-500">Latest entries into the centralized electoral roll</p>
          </div>
          <Link to="/voters" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1">
            <span>View All Records</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Voter ID</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Age</th>
                <th className="py-2.5 px-3">Aadhaar (Masked)</th>
                <th className="py-2.5 px-3">Assigned Booth</th>
                <th className="py-2.5 px-3 text-center">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {voters.map((v) => (
                <tr key={v.voter_id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{v.voter_id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{v.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{v.age} yrs</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{v.aadhaar_masked}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">{v.booth_id}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      v.is_eligible
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {v.is_eligible ? 'Eligible' : 'Ineligible (<18)'}
                    </span>
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

export default DataEntryDashboard;
