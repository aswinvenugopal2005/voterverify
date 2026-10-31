import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Search,
  Camera,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Vote,
  UserCheck
} from 'lucide-react';

const VoterSearch = () => {
  const [voterId, setVoterId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!voterId.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.get(`/api/voters/search/${voterId.trim().toUpperCase()}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || `Voter ID '${voterId}' not found.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Voter Verification Lookup</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify voter electoral enrollment and detect duplicate vote status in real-time
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="input-voter-id-search"
              value={voterId}
              onChange={(e) => setVoterId(e.target.value)}
              placeholder="Enter Voter ID (e.g. VTR-1001, VTR-1002, VTR-1003)"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            id="btn-execute-search"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Search Status</span>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-6">
          {/* Explicit Duplicate Alert Banner */}
          {result.duplicate_alert ? (
            <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-xl text-rose-900 flex items-start space-x-3">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-rose-900">
                  CRITICAL ALERT: DUPLICATE VOTING ATTEMPT BLOCKED
                </h3>
                <p className="text-xs font-bold text-rose-800 mt-1">
                  ALERT: THIS VOTER HAS ALREADY VOTED. DUPLICATE VOTING ATTEMPT BLOCKED.
                </p>
                <p className="text-[11px] text-rose-700 mt-1">
                  The centralized SQLite source-of-truth recorded this voter's participation previously. Under electoral rules, further verification and ballot processing is strictly disallowed.
                </p>
              </div>
            </div>
          ) : !result.is_eligible ? (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-center space-x-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold">INELIGIBLE VOTER</h3>
                <p className="text-[11px] text-amber-800">
                  Citizen is below the statutory age threshold (18 years) and cannot cast a vote.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center space-x-3 text-xs">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold">ELIGIBLE: NOT VOTED</h3>
                <p className="text-[11px] text-emerald-800">
                  Citizen is confirmed eligible and has not yet voted. Proceed with live Facial Biometric Verification.
                </p>
              </div>
            </div>
          )}

          {/* Detailed Voter Profile */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
            <div className="relative">
              <img
                src={`http://127.0.0.1:8000${result.voter.image_url}`}
                alt={result.voter.name}
                className="w-36 h-36 object-cover rounded-2xl border-4 border-slate-100 shadow-md bg-slate-50"
              />
              <span className={`absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow ${
                result.status_label === 'VOTED'
                  ? 'bg-rose-600 text-white'
                  : result.status_label === 'NOT VOTED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}>
                {result.status_label}
              </span>
            </div>

            <div className="flex-1 space-y-2 text-xs text-slate-700 w-full">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{result.voter.name}</h2>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {result.voter.voter_id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-500 font-semibold">Age / Gender:</span>
                  <p className="font-medium text-slate-900">{result.voter.age} years | {result.voter.gender}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Aadhaar (Masked):</span>
                  <p className="font-mono text-slate-900">{result.voter.aadhaar_masked}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Assigned Booth:</span>
                  <p className="font-medium text-slate-900">{result.voter.booth_id} ({result.voter.booth_name})</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Eligibility:</span>
                  <p className={`font-bold ${result.is_eligible ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {result.is_eligible ? 'Statutory Eligible' : 'Ineligible (<18)'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-semibold">Registered Address:</span>
                <p className="text-slate-800">{result.voter.address}</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4">
                {result.has_voted ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-center font-bold text-rose-700 text-xs">
                    Verification Blocked: Duplicate Voting Prohibited
                  </div>
                ) : !result.is_eligible ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center font-bold text-amber-700 text-xs">
                    Verification Blocked: Ineligible Voter
                  </div>
                ) : (
                  <button
                    type="button"
                    id="btn-goto-face-verify"
                    onClick={() => navigate(`/face-verification?voter_id=${result.voter.voter_id}`)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Proceed to Facial Biometric Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterSearch;
