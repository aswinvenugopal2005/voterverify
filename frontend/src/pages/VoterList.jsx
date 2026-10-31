import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Users,
  Search,
  Filter,
  Camera,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

const VoterList = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [voters, setVoters] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(15);
  const [offset, setOffset] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [boothFilter, setBoothFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'voted', 'not_voted'
  const [eligibilityFilter, setEligibilityFilter] = useState(''); // '', 'true', 'false'

  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit modal state
  const [editingVoter, setEditingVoter] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', address: '', booth_id: '' });
  const [updating, setUpdating] = useState(false);

  const fetchVoters = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = `/api/voters?limit=${limit}&offset=${offset}`;
      if (searchTerm.trim()) query += `&search=${encodeURIComponent(searchTerm.trim())}`;
      if (boothFilter) query += `&booth_id=${encodeURIComponent(boothFilter)}`;
      if (statusFilter === 'voted') query += `&has_voted=true`;
      if (statusFilter === 'not_voted') query += `&has_voted=false`;
      if (eligibilityFilter === 'true') query += `&eligible_only=true`;
      if (eligibilityFilter === 'false') query += `&eligible_only=false`;

      const res = await api.get(query);
      setVoters(res.data.voters);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Voter list error:", err);
      setError("Failed to fetch voter roll records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchBooths = async () => {
      try {
        const res = await api.get('/api/booths');
        setBooths(res.data);
      } catch (err) {
        console.error("Failed to fetch booths:", err);
      }
    };
    fetchBooths();
  }, []);

  useEffect(() => {
    fetchVoters();
  }, [offset, boothFilter, statusFilter, eligibilityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setOffset(0);
    fetchVoters();
  };

  const handleDelete = async (voterId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete voter '${name}' (${voterId})?`)) {
      return;
    }
    try {
      await api.delete(`/api/voters/${voterId}`);
      fetchVoters();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete voter record.");
    }
  };

  const openEditModal = (voter) => {
    setEditingVoter(voter);
    setEditFormData({
      name: voter.name,
      address: voter.address,
      booth_id: voter.booth_id,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put(`/api/voters/${editingVoter.voter_id}`, editFormData);
      setEditingVoter(null);
      fetchVoters();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update voter details.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Electoral Roll & Voter Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {total} registered voters in authoritative central database
          </p>
        </div>

        <Link
          to="/register-voter"
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Register Voter</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="search-voters-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Voter ID, Name, or Address..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Filters:</span>
          </div>

          <select
            value={boothFilter}
            onChange={(e) => { setBoothFilter(e.target.value); setOffset(0); }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="">All Polling Booths</option>
            {booths.map((b) => (
              <option key={b.booth_id} value={b.booth_id}>
                {b.booth_id} - {b.booth_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="">All Voting Statuses</option>
            <option value="not_voted">Not Voted</option>
            <option value="voted">Voted</option>
          </select>

          <select
            value={eligibilityFilter}
            onChange={(e) => { setEligibilityFilter(e.target.value); setOffset(0); }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="">All Eligibility</option>
            <option value="true">Eligible Only (18+)</option>
            <option value="false">Ineligible (Under 18)</option>
          </select>
        </div>
      </div>

      {/* Voter Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Photo</th>
                <th className="py-3 px-4">Voter ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Aadhaar (Masked)</th>
                <th className="py-3 px-4">Booth</th>
                <th className="py-3 px-4 text-center">Eligibility</th>
                <th className="py-3 px-4 text-center">Voting Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading voter records...
                  </td>
                </tr>
              ) : voters.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">
                    No voters found matching current criteria.
                  </td>
                </tr>
              ) : (
                voters.map((v) => (
                  <tr key={v.voter_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4">
                      <img
                        src={`http://127.0.0.1:8000${v.image_url}`}
                        alt={v.name}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-slate-100"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{v.voter_id}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{v.name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{v.age} yrs | {v.gender}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{v.aadhaar_masked}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">
                      <span className="font-mono font-bold text-slate-800">{v.booth_id}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        v.is_eligible
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {v.is_eligible ? 'Eligible' : 'Ineligible'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        v.has_voted
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {v.has_voted ? 'VOTED' : 'NOT VOTED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/face-verification?voter_id=${v.voter_id}`)}
                          title="Verify Face"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(v)}
                          title="Edit Details"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(v.voter_id, v.name)}
                            disabled={v.has_voted}
                            title={v.has_voted ? "Cannot delete voter who has voted" : "Delete Voter"}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {Math.min(total, offset + 1)} to {Math.min(total, offset + limit)} of {total} records
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Voter Modal */}
      {editingVoter && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Update Voter Record: {editingVoter.voter_id}
            </h2>
            <p className="text-xs text-slate-500 mb-4">Edit demographic details in the central database</p>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Booth</label>
                <select
                  value={editFormData.booth_id}
                  onChange={(e) => setEditFormData({ ...editFormData, booth_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  required
                >
                  {booths.map((b) => (
                    <option key={b.booth_id} value={b.booth_id}>
                      {b.booth_id} - {b.booth_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <textarea
                  rows={3}
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVoter(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-600/30"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterList;
