import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Award,
  Plus,
  Vote,
  Search,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    candidate_id: '',
    election_id: '',
    candidate_name: '',
    party_name: '',
    candidate_symbol: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [candRes, elecRes] = await Promise.all([
        api.get('/api/candidates'),
        api.get('/api/elections')
      ]);
      setCandidates(candRes.data);
      setElections(elecRes.data);
      if (elecRes.data.length > 0 && !formData.election_id) {
        setFormData(prev => ({ ...prev, election_id: elecRes.data[0].election_id }));
      }
    } catch (err) {
      console.error("Candidates error:", err);
      setError("Failed to fetch candidates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      await api.post('/api/candidates', formData);
      setShowAddModal(false);
      setFormData({
        candidate_id: '',
        election_id: elections[0]?.election_id || '',
        candidate_name: '',
        party_name: '',
        candidate_symbol: '',
      });
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to add candidate.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nominated Candidates Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage candidates, political affiliations, and ballot emblems across elections
          </p>
        </div>

        <button
          onClick={() => { setShowAddModal(true); setModalError(null); }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nominate Candidate</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {candidates.map((c) => (
          <div key={c.candidate_id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                  {c.candidate_symbol[0]}
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {c.candidate_id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{c.candidate_name}</h3>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Party Affiliation:</span>
                <span className="font-semibold text-slate-800">{c.party_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ballot Symbol:</span>
                <span className="font-bold text-blue-700">{c.candidate_symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Election Contest:</span>
                <span className="font-mono text-purple-700 font-semibold">{c.election_id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Nominate New Candidate</h2>
            <p className="text-xs text-slate-500 mb-4">Add candidate to an active legislative race</p>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CAND-04"
                  value={formData.candidate_id}
                  onChange={(e) => setFormData({ ...formData, candidate_id: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contesting Election *</label>
                <select
                  required
                  value={formData.election_id}
                  onChange={(e) => setFormData({ ...formData, election_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                >
                  {elections.map((e) => (
                    <option key={e.election_id} value={e.election_id}>
                      {e.election_name} ({e.election_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Gupta"
                  value={formData.candidate_name}
                  onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Political Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Citizens League"
                  value={formData.party_name}
                  onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ballot Symbol / Emblem *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Torch / Elephant / Star"
                  value={formData.candidate_symbol}
                  onChange={(e) => setFormData({ ...formData, candidate_symbol: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
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
                  {submitting ? 'Adding...' : 'Nominate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateManagement;
