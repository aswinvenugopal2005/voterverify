import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Vote,
  Search,
  Camera,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  UserCheck
} from 'lucide-react';

const BoothOfficerDashboard = () => {
  const { user, boothId } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const res = await api.get(`/api/voters/search/${searchId.trim().toUpperCase()}`);
      setSearchResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || `Voter ID '${searchId}' not found.`);
    } finally {
      setSearching(false);
    }
  };

  const proceedToVerification = (voterId) => {
    navigate(`/face-verification?voter_id=${voterId}`);
  };

  return (
    <div className="space-y-6">
      {/* Station Banner */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-300 text-xs font-semibold mb-2">
            <Vote className="w-3.5 h-3.5 text-blue-400" />
            <span>Assigned Station: {boothId || 'Booth Center'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Polling Booth Verification Terminal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Officer: <span className="text-white font-semibold">{user?.full_name}</span> | Verify voter identity via webcam before enabling secret ballot confirmation.
          </p>
        </div>

        <button
          onClick={() => navigate('/face-verification')}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 shrink-0"
        >
          <Camera className="w-4 h-4" />
          <span>Launch Face Scanner</span>
        </button>
      </div>

      {/* Instant Voter ID Lookup Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Look Up Voter by Voter ID</h2>
        <p className="text-xs text-slate-500 mb-4">
          Enter official Voter ID card number (e.g. VTR-1001, VTR-1002, or VTR-1003)
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="input-voter-search"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. VTR-1001"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            id="btn-search-voter"
            disabled={searching}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {searching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Search Voter</span>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 max-w-xl">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Voter Details Card */}
        {searchResult && (
          <div className="mt-6 border border-slate-200 rounded-2xl p-5 bg-slate-50/50 max-w-2xl">
            {/* Status Alert Banner */}
            {searchResult.duplicate_alert ? (
              <div className="p-4 mb-4 bg-rose-100 border-2 border-rose-300 rounded-xl text-rose-900 flex items-start space-x-3">
                <ShieldAlert className="w-6 h-6 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide text-rose-800">
                    DUPLICATE VOTING ATTEMPT BLOCKED
                  </h3>
                  <p className="text-xs text-rose-700 mt-1 font-semibold">
                    ALERT: THIS VOTER HAS ALREADY VOTED. DUPLICATE VOTING ATTEMPT BLOCKED.
                  </p>
                  <p className="text-[11px] text-rose-600 mt-1">
                    This attempt has been securely flagged in the permanent audit logs.
                  </p>
                </div>
              </div>
            ) : !searchResult.is_eligible ? (
              <div className="p-3 mb-4 bg-amber-100 border border-amber-300 rounded-xl text-amber-900 flex items-center space-x-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">Voter is marked INELIGIBLE (Age under 18). Cannot proceed with verification.</span>
              </div>
            ) : (
              <div className="p-3 mb-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 flex items-center space-x-2 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Status: NOT VOTED. Voter is eligible to proceed for Biometric Facial Verification.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <img
                src={`http://127.0.0.1:8000${searchResult.voter.image_url}`}
                alt="Registered Voter"
                className="w-28 h-28 object-cover rounded-xl border-2 border-slate-300 bg-white shadow-sm shrink-0"
              />

              <div className="flex-1 space-y-1.5 text-xs text-slate-700 w-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{searchResult.voter.name}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    searchResult.status_label === 'VOTED'
                      ? 'bg-rose-200 text-rose-900'
                      : searchResult.status_label === 'NOT VOTED'
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}>
                    {searchResult.status_label}
                  </span>
                </div>

                <p><span className="font-semibold text-slate-500">Voter ID:</span> <span className="font-mono font-bold text-blue-700">{searchResult.voter.voter_id}</span></p>
                <p><span className="font-semibold text-slate-500">Age / Gender:</span> {searchResult.voter.age} yrs | {searchResult.voter.gender}</p>
                <p><span className="font-semibold text-slate-500">Aadhaar:</span> <span className="font-mono">{searchResult.voter.aadhaar_masked}</span></p>
                <p><span className="font-semibold text-slate-500">Assigned Booth:</span> {searchResult.voter.booth_id} ({searchResult.voter.booth_name})</p>
                <p><span className="font-semibold text-slate-500">Address:</span> {searchResult.voter.address}</p>

                <div className="pt-3">
                  {searchResult.has_voted ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-slate-200 text-slate-400 font-bold rounded-lg text-xs cursor-not-allowed"
                    >
                      Verification Disabled (Already Voted)
                    </button>
                  ) : !searchResult.is_eligible ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-slate-200 text-slate-400 font-bold rounded-lg text-xs cursor-not-allowed"
                    >
                      Verification Disabled (Ineligible)
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="btn-proceed-verify"
                      onClick={() => proceedToVerification(searchResult.voter.voter_id)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-md shadow-blue-600/30 flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Start Facial Verification</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoothOfficerDashboard;
