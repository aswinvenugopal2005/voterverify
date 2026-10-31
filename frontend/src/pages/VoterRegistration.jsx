import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import WebcamCapture from '../components/WebcamCapture';
import {
  UserPlus,
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';

const VoterRegistration = () => {
  const [formData, setFormData] = useState({
    voter_id: '',
    name: '',
    date_of_birth: '',
    gender: 'Male',
    address: '',
    aadhaar_id: '',
    booth_id: '',
  });

  const [booths, setBooths] = useState([]);
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [isEligible, setIsEligible] = useState(null);
  const [photoMode, setPhotoMode] = useState('webcam'); // 'webcam' or 'file'
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available booths
    const fetchBooths = async () => {
      try {
        const res = await api.get('/api/booths');
        setBooths(res.data);
        if (res.data.length > 0) {
          setFormData((prev) => ({ ...prev, booth_id: res.data[0].booth_id }));
        }
      } catch (err) {
        console.error("Failed to load booths:", err);
      }
    };
    fetchBooths();
  }, []);

  // Auto calculate age whenever DOB changes
  const handleDobChange = (e) => {
    const dobValue = e.target.value;
    setFormData((prev) => ({ ...prev, date_of_birth: dobValue }));

    if (dobValue) {
      const dobDate = new Date(dobValue);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      setCalculatedAge(age);
      setIsEligible(age >= 18);
    } else {
      setCalculatedAge(null);
      setIsEligible(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebcamCapture = (base64) => {
    setPhotoBase64(base64);
    setPhotoPreview(base64);
    setPhotoFile(null);
  };

  const generateVoterId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setFormData((prev) => ({ ...prev, voter_id: `VTR-${randomNum}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!photoBase64 && !photoFile) {
      setErrorMessage("Please capture or upload a voter photograph.");
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('voter_id', formData.voter_id.trim().toUpperCase());
      submitData.append('name', formData.name.trim());
      submitData.append('date_of_birth', formData.date_of_birth);
      submitData.append('gender', formData.gender);
      submitData.append('address', formData.address.trim());
      submitData.append('aadhaar_id', formData.aadhaar_id.trim());
      submitData.append('booth_id', formData.booth_id);

      if (photoFile) {
        submitData.append('photo', photoFile);
      } else if (photoBase64) {
        submitData.append('photo_base64', photoBase64);
      }

      const res = await api.post('/api/voters', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setStatusMessage(res.data.message);
      // Reset form on success
      setTimeout(() => {
        navigate('/voters');
      }, 1500);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || "Registration failed. Check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Electoral Voter Registration Form</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register new eligible citizen into centralized database with facial biometrics
          </p>
        </div>
        <button
          type="button"
          onClick={generateVoterId}
          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
        >
          Generate Voter ID
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{statusMessage} Redirecting to voter roll...</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Biometric Photo Capture */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Voter Photograph
            </h3>

            {/* Mode selection */}
            <div className="flex rounded-lg bg-slate-100 p-1 mb-3">
              <button
                type="button"
                onClick={() => setPhotoMode('webcam')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center space-x-1 ${
                  photoMode === 'webcam' ? 'bg-white shadow text-blue-600' : 'text-slate-500'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Webcam</span>
              </button>
              <button
                type="button"
                onClick={() => setPhotoMode('file')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center space-x-1 ${
                  photoMode === 'file' ? 'bg-white shadow text-blue-600' : 'text-slate-500'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>

            {photoMode === 'webcam' ? (
              <WebcamCapture onCapture={handleWebcamCapture} initialCaptured={photoBase64} autoStart={true} />
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  id="voter-photo-file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {photoPreview && (
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-200">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Age & Eligibility Indicator Card */}
          {calculatedAge !== null && (
            <div className={`p-4 rounded-2xl border text-xs ${
              isEligible
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center space-x-2 font-bold mb-1">
                {isEligible ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Eligible for Voting (Age: {calculatedAge} yrs)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>INELIGIBLE: Under 18 (Age: {calculatedAge} yrs)</span>
                  </>
                )}
              </div>
              <p className="text-[11px] opacity-80">
                {isEligible
                  ? "Citizen meets the statutory age requirement (18+) for electoral participation."
                  : "Citizen is below the legal voting age. Will be marked as INELIGIBLE in the electoral roll."}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Demographic Fields */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Voter ID Number *
              </label>
              <input
                type="text"
                id="input-voter-id"
                required
                value={formData.voter_id}
                onChange={(e) => setFormData({ ...formData, voter_id: e.target.value.toUpperCase() })}
                placeholder="e.g. VTR-882104"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                id="input-voter-name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth * (Auto-calculates age)
              </label>
              <input
                type="date"
                id="input-voter-dob"
                required
                value={formData.date_of_birth}
                onChange={handleDobChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender *
              </label>
              <select
                id="select-voter-gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other / Non-Binary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Synthetic Aadhaar ID * (Test Value Only)
              </label>
              <input
                type="text"
                id="input-voter-aadhaar"
                required
                value={formData.aadhaar_id}
                onChange={(e) => setFormData({ ...formData, aadhaar_id: e.target.value })}
                placeholder="e.g. 9988-5544-3322"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Polling Booth *
              </label>
              <select
                id="select-voter-booth"
                required
                value={formData.booth_id}
                onChange={(e) => setFormData({ ...formData, booth_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {booths.map((b) => (
                  <option key={b.booth_id} value={b.booth_id}>
                    {b.booth_id} - {b.booth_name} ({b.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Residential Address *
            </label>
            <textarea
              id="input-voter-address"
              required
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Flat 4B, Silver Heights, Green Avenue, North Ward"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/voters')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-register-submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Complete Voter Registration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VoterRegistration;
