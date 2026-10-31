import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Store,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  MapPin,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const BoothManagement = () => {
  const [booths, setBooths] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Booth Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    booth_id: '',
    booth_name: '',
    location: '',
    officer_name: '',
    officer_username: '',
    officer_password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Edit Modal state
  const [editingBooth, setEditingBooth] = useState(null);
  const [editFormData, setEditFormData] = useState({ booth_name: '', location: '', officer_name: '' });

  const fetchBooths = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = searchTerm ? `/api/booths?search=${encodeURIComponent(searchTerm)}` : '/api/booths';
      const res = await api.get(q);
      setBooths(res.data);
    } catch (err) {
      console.error("Booth error:", err);
      setError("Failed to fetch polling booths.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooths();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooths();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      await api.post('/api/booths', formData);
      setShowAddModal(false);
      setFormData({
        booth_id: '',
        booth_name: '',
        location: '',
        officer_name: '',
        officer_username: '',
        officer_password: '',
      });
      fetchBooths();
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to create polling booth.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (b) => {
    setEditingBooth(b);
    setEditFormData({
      booth_name: b.booth_name,
      location: b.location,
      officer_name: b.officer_name || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/booths/${editingBooth.booth_id}`, editFormData);
      setEditingBooth(null);
      fetchBooths();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update booth.");
    }
  };

  const handleDelete = async (boothId, voterCount) => {
    if (voterCount > 0) {
      alert(`Cannot delete booth '${boothId}'. There are ${voterCount} registered voters assigned to it.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete booth '${boothId}'?`)) return;

    try {
      await api.delete(`/api/booths/${boothId}`);
      fetchBooths();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete booth.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Polling Booth Stations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical voting locations and assign dedicated polling booth officers
          </p>
        </div>

        <button
          onClick={() => { setShowAddModal(true); setModalError(null); }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Polling Booth</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="search-booth-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Booth ID, Name, or Location..."
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
      </div>

      {/* Booth Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {booths.map((b) => (
          <div key={b.booth_id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {b.booth_id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{b.booth_name}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2 flex items-start space-x-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                <span>{b.location}</span>
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Assigned Officer:</span>
                  <span className="font-semibold text-slate-800">{b.officer_name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Enrolled Voters:</span>
                  <span className="font-bold text-blue-600 font-mono">{b.voter_count}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => openEdit(b)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(b.booth_id, b.voter_count)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Booth Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Add New Polling Booth</h2>
            <p className="text-xs text-slate-500 mb-4">Register station & optionally generate booth officer login</p>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Booth ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B-104"
                  value={formData.booth_id}
                  onChange={(e) => setFormData({ ...formData, booth_id: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Booth Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. District Sports Complex"
                  value={formData.booth_name}
                  onChange={(e) => setFormData({ ...formData, booth_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 9, Stadium Road, West Ward"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-800 mb-2">Officer Credentials (Optional)</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Officer Full Name (e.g. Officer Suresh)"
                    value={formData.officer_name}
                    onChange={(e) => setFormData({ ...formData, officer_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Officer Username"
                      value={formData.officer_username}
                      onChange={(e) => setFormData({ ...formData, officer_username: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                    />
                    <input
                      type="password"
                      placeholder="Officer Password"
                      value={formData.officer_password}
                      onChange={(e) => setFormData({ ...formData, officer_password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
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
                  {submitting ? 'Creating...' : 'Create Booth'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBooth && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Edit Booth: {editingBooth.booth_id}</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs mt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Booth Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.booth_name}
                  onChange={(e) => setEditFormData({ ...editFormData, booth_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Officer Name</label>
                <input
                  type="text"
                  value={editFormData.officer_name}
                  onChange={(e) => setEditFormData({ ...editFormData, officer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBooth(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoothManagement;
