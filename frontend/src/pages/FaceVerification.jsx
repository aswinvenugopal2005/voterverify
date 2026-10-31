import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import WebcamCapture from '../components/WebcamCapture';
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Search,
  Sparkles,
  Sliders,
  Vote
} from 'lucide-react';

const FaceVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [voterId, setVoterId] = useState(searchParams.get('voter_id') || 'VTR-1001');
  const [voter, setVoter] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingVoter, setLoadingVoter] = useState(false);

  // Load voter details when voterId changes
  const loadVoter = async (id) => {
    if (!id.trim()) return;
    setLoadingVoter(true);
    setError(null);
    setVerificationResult(null);
    try {
      const res = await api.get(`/api/voters/search/${id.trim().toUpperCase()}`);
      setVoter(res.data.voter);
      if (res.data.has_voted) {
        setError("ALERT: THIS VOTER HAS ALREADY VOTED. DUPLICATE VOTING ATTEMPT BLOCKED.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Voter ID '${id}' not found.`);
      setVoter(null);
    } finally {
      setLoadingVoter(false);
    }
  };

  useEffect(() => {
    if (voterId) {
      loadVoter(voterId);
    }
  }, []);

  const handleLookup = (e) => {
    e.preventDefault();
    loadVoter(voterId);
  };

  // Run face verification
  const handleVerify = async () => {
    if (!capturedPhoto) {
      setError("Please capture a photo from the webcam before running verification.");
      return;
    }
    if (!voter) {
      setError("Please select a registered voter first.");
      return;
    }

    setVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const res = await api.post('/api/face/verify', {
        voter_id: voter.voter_id,
        captured_image_base64: capturedPhoto
      });
      setVerificationResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Face verification failed on server.");
    } finally {
      setVerifying(false);
    }
  };

  // Proceed to explicit booth officer vote confirmation step
  const proceedToVoteConfirmation = () => {
    navigate(`/voting-confirmation?voter_id=${voter.voter_id}&score=${verificationResult?.similarity_score || 95}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Biometric Facial Verification Terminal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deep learning FaceNet embedding verification with 0.55 cosine distance decision boundary
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700 flex items-center space-x-1">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Threshold: 0.55</span>
          </span>
        </div>
      </div>

      {/* Voter ID Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="face-voter-id-input"
              value={voterId}
              onChange={(e) => setVoterId(e.target.value)}
              placeholder="Enter Voter ID (e.g. VTR-1001, VTR-1002)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase font-semibold"
            />
          </div>
          <button
            type="submit"
            id="btn-load-voter-photo"
            disabled={loadingVoter}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1"
          >
            {loadingVoter ? 'Loading...' : 'Load Voter Photo'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-800 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wide">Verification Alert</p>
            <p className="mt-0.5 font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Two-Column Facial Comparison Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Registered Photograph (Reference from DB) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Registered Identity Photo (Reference)
                </h3>
                <p className="text-[11px] text-slate-500">Authoritative photograph from electoral database</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                {voter?.voter_id || 'NO VOTER'}
              </span>
            </div>

            {voter ? (
              <div className="space-y-4">
                <div className="relative aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 flex items-center justify-center">
                  <img
                    src={`http://127.0.0.1:8000${voter.image_url}`}
                    alt="Registered Photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white rounded text-[10px] font-mono">
                    Ground Truth Reference
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{voter.name}</p>
                  <p className="text-slate-500">Age: <span className="text-slate-800 font-semibold">{voter.age}</span> | Gender: <span className="text-slate-800">{voter.gender}</span></p>
                  <p className="text-slate-500">Assigned Station: <span className="text-slate-800 font-semibold">{voter.booth_id}</span></p>
                  <p className="text-slate-500">Aadhaar (Masked): <span className="text-slate-800 font-mono">{voter.aadhaar_masked}</span></p>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <Search className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs font-medium">No Voter Loaded</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter a Voter ID above to fetch their registered photograph.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Box 2: Live Webcam Capture (Query Sample) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Live Polling Station Capture (Query)
              </h3>
              <p className="text-[11px] text-slate-500">Webcam snapshot of citizen present at polling booth</p>
            </div>

            <WebcamCapture onCapture={(b64) => setCapturedPhoto(b64)} initialCaptured={capturedPhoto} autoStart={true} />
          </div>

          {/* Trigger Verification Action */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="btn-run-verification"
              onClick={handleVerify}
              disabled={verifying || !capturedPhoto || !voter || voter.has_voted}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Extracting Embeddings & Calculating Distance...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Execute Facial Verification Algorithm</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Inspection Card */}
      {verificationResult && (
        <div className={`p-6 rounded-2xl border-2 transition-all shadow-lg ${
          verificationResult.matched
            ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950'
            : 'bg-rose-50/80 border-rose-400 text-rose-950'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {verificationResult.matched ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                )}
                <h2 className="text-lg font-extrabold uppercase tracking-wide">
                  {verificationResult.message}
                </h2>
              </div>
              <p className="text-xs font-medium opacity-90">
                {verificationResult.matched
                  ? "Biometric facial embeddings match the registered voter photograph within acceptable threshold limits."
                  : "Cosine distance between biometric embeddings exceeds verification threshold. Identity cannot be established."}
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="flex items-center space-x-3 bg-white/80 p-3 rounded-xl border border-slate-200/60 shadow-sm shrink-0">
              <div className="text-center px-3 border-r border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Cosine Dist</p>
                <p className="text-base font-mono font-bold text-slate-800">{verificationResult.distance}</p>
              </div>
              <div className="text-center px-3 border-r border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Threshold</p>
                <p className="text-base font-mono font-bold text-slate-800">≤ {verificationResult.threshold}</p>
              </div>
              <div className="text-center px-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Confidence</p>
                <p className={`text-base font-mono font-bold ${
                  verificationResult.matched ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {verificationResult.similarity_score}%
                </p>
              </div>
            </div>
          </div>

          {/* Model info banner */}
          <div className="mt-4 pt-3 border-t border-slate-200/50 flex flex-wrap items-center justify-between text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Model Pipeline:</span>
              <span className="font-mono text-slate-800 bg-white/70 px-2 py-0.5 rounded border border-slate-200">
                {verificationResult.model_used}
              </span>
              {verificationResult.is_mock_mode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Mock Fallback Active (Test Mode)
                </span>
              )}
            </div>

            {/* Explicit Confirmation Step Button */}
            {verificationResult.matched && (
              <button
                type="button"
                id="btn-confirm-and-proceed-vote"
                onClick={proceedToVoteConfirmation}
                className="mt-2 sm:mt-0 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-2"
              >
                <Vote className="w-4 h-4" />
                <span>Officer Confirmation: Proceed to Cast Ballot</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceVerification;
