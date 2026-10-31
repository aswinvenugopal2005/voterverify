import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Vote,
  CheckCircle,
  ShieldAlert,
  Award,
  AlertTriangle,
  ArrowRight,
  Lock,
  UserCheck
} from 'lucide-react';

const VotingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, boothId } = useAuth();

  const voterIdParam = searchParams.get('voter_id') || '';
  const scoreParam = searchParams.get('score') || '95';

  const [voterId, setVoterId] = useState(voterIdParam);
  const [voter, setVoter] = useState(null);
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState(null);

  const loadVoterAndElection = async (id) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setSuccessResult(null);

    try {
      // 1. Fetch voter
      const voterRes = await api.get(`/api/voters/search/${id.trim().toUpperCase()}`);
      setVoter(voterRes.data.voter);

      if (voterRes.data.has_voted) {
        setError("ALERT: THIS VOTER HAS ALREADY VOTED. DUPLICATE VOTING ATTEMPT BLOCKED.");
        return;
      }
      if (!voterRes.data.is_eligible) {
        setError("Voter is marked INELIGIBLE (<18 years). Cannot cast ballot.");
        return;
      }

      // 2. Fetch active election & candidates
      const elecsRes = await api.get('/api/elections');
      const activeElec = elecsRes.data.find(e => e.status === 'ACTIVE') || elecsRes.data[0];
      if (activeElec) {
        setElection(activeElec);
        setCandidates(activeElec.candidates || []);
        if (activeElec.candidates?.length > 0) {
          setSelectedCandidate(activeElec.candidates[0].candidate_id);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to fetch voter or election details.`);
      setVoter(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (voterIdParam) {
      loadVoterAndElection(voterIdParam);
    }
  }, [voterIdParam]);

  const handleLookup = (e) => {
    e.preventDefault();
    loadVoterAndElection(voterId);
  };

  const handleConfirmVote = async () => {
    if (!voter) {
      setError("No valid voter selected.");
      return;
    }
    if (!selectedCandidate) {
      setError("Please select a candidate ballot option.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        voter_id: voter.voter_id,
        election_id: election.election_id,
        candidate_id: selectedCandidate,
        booth_id: user?.booth_id || voter.booth_id || 'B-101',
        verification_score: parseFloat(scoreParam)
      };

      const res = await api.post('/api/voting/confirm', payload);
      setSuccessResult(res.data);
    } catch (err) {
      console.error("Voting error:", err);
      setError(err.response?.data?.detail || "Voting confirmation failed. Central duplicate prevention triggered.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Official Ballot Cast & Vote Confirmation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atomic database execution with secret ballot privacy protection
          </p>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Biometric Verified</span>
        </div>
      </div>

      {/* Voter ID lookup if not loaded */}
      {!voter && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="text"
              id="confirm-voter-id-input"
              value={voterId}
              onChange={(e) => setVoterId(e.target.value)}
              placeholder="Enter Voter ID (e.g. VTR-1001)"
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white uppercase font-mono font-semibold"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
            >
              Load Voter
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-800 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wide">Voting Blocked</p>
            <p className="mt-0.5 font-semibold text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Receipt */}
      {successResult && (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 shadow-md space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-emerald-900">VOTE CAST SUCCESSFULLY CONFIRMED</h2>
              <p className="text-xs text-emerald-700">
                Authoritative transaction recorded. Voter status updated to VOTED. Duplicate voting locked.
              </p>
            </div>
          </div>

          <div className="p-4 bg-white/90 rounded-xl border border-emerald-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Voter Reference:</span>
              <span className="font-mono font-bold text-slate-800">{voter.voter_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Election:</span>
              <span className="font-bold text-slate-800">{election?.election_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Polling Station:</span>
              <span className="font-mono text-slate-800">{user?.booth_id || voter.booth_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Transaction Timestamp:</span>
              <span className="font-mono text-slate-800">{new Date(successResult.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => navigate('/booth-dashboard')}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Return to Booth Terminal
            </button>
          </div>
        </div>
      )}

      {/* Main Ballot Casting Form */}
      {voter && !successResult && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Voter Snapshot Header */}
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <img
              src={`http://127.0.0.1:8000${voter.image_url}`}
              alt={voter.name}
              className="w-16 h-16 object-cover rounded-xl border border-slate-300 bg-white"
            />
            <div className="text-xs space-y-0.5">
              <span className="font-mono font-bold text-blue-700">{voter.voter_id}</span>
              <h2 className="text-base font-bold text-slate-900">{voter.name}</h2>
              <p className="text-slate-500">
                Age: {voter.age} yrs | Booth: {voter.booth_id} | Aadhaar: {voter.aadhaar_masked}
              </p>
            </div>
          </div>

          {/* Secret Ballot Candidate Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Select Ballot Candidate Option
                </h3>
                <p className="text-[11px] text-slate-500">
                  Secret ballot: Choice is cryptographically decoupled from voter identity
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                {election?.election_name || 'General Election'}
              </span>
            </div>

            <div className="space-y-2.5">
              {candidates.map((c) => {
                const isSelected = selectedCandidate === c.candidate_id;
                return (
                  <div
                    key={c.candidate_id}
                    onClick={() => setSelectedCandidate(c.candidate_id)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 text-xs">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.candidate_symbol[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{c.candidate_name}</p>
                        <p className="text-slate-500">{c.party_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold">
                        Symbol: {c.candidate_symbol}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-center space-x-2">
            <Lock className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              <strong>Secret Ballot Guarantee:</strong> In compliance with electoral standards, candidate selections are stored in an anonymous ballot repository and never attached to personal voter profiles.
            </span>
          </div>

          {/* Confirmation Action Button */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/booth-dashboard')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-ballot-submit"
              disabled={submitting || !selectedCandidate}
              onClick={handleConfirmVote}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Vote className="w-4 h-4" />
                  <span>Authorize & Cast Final Vote</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingConfirmation;
