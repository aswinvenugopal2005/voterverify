import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Vote,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  Archive,
  AlertTriangle
} from 'lucide-react';

const ElectionManagement = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    election_id: '',
    election_name: '',
    start_time: '2026-01-01T08:00',
    end_time: '2026-12-31T18:00',
    status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchElections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/elections');
      setElections(res.data);
    } catch (err) {
      console.error("Elections error:", err);
      setError("Failed to fetch elections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const handleStatusToggle = async (electionId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
    try {
      await api.put(`/api/elections/${electionId}`, { status: nextStatus });
      fetchElections();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      await api.post('/api/elections', {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      });
      setShowAddModal(false);
      setFormData({
        election_id: '',
        election_name: '',
        start_time: '2026-01-01T08:00',
        end_time: '2026-12-31T18:00',
        status: 'ACTIVE'
      });
      fetchElections();
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to create election.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Elections Directory & Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure legislative terms, manage active status, and define candidate rosters
          </p>
        </div>

        <button
          onClick={() => { setShowAddModal(true); setModalError(null); }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Election</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Elections List */}
      <div className="space-y-4">
        {elections.map((elec) => (
          <div key={elec.election_id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Vote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-slate-900">{elec.election_name}</h2>
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {elec.election_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Start: {new Date(elec.start_time).toLocaleDateString()} | End: {new Date(elec.end_time).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  elec.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : elec.status === 'UPCOMING'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}>
                  {elec.status}
                </span>

                <button
                  type="button"
                  onClick={() => handleStatusToggle(elec.election_id, elec.status)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Toggle Status
                </button>
              </div>
            </div>

            {/* Candidates in this election */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Nominated Candidates ({elec.candidates?.length || 0})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {elec.candidates?.map((c) => (
                  <div key={c.candidate_id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{c.candidate_name}</p>
                      <p className="text-[11px] text-slate-500">{c.party_name}</p>
                      <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Symbol: {c.candidate_symbol}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-slate-800">{c.votes_count}</span>
                      <p className="text-[10px] text-slate-400">votes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Election Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Create New Election</h2>
            <p className="text-xs text-slate-500 mb-4">Initialize electoral race in the centralized database</p>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Election ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ELEC-2026-MOCK"
                  value={formData.election_id}
                  onChange={(e) => setFormData({ ...formData, election_id: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Election Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Municipal Council Election"
                  value={formData.election_name}
                  onChange={(e) => setFormData({ ...formData, election_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-600/30"
                >
                  {submitting ? 'Creating...' : 'Create Election'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectionManagement;
