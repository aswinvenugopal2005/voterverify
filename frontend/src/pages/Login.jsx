import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Vote, Shield, KeyRound, Smartphone, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const Login = () => {
  const [authMode, setAuthMode] = useState('password'); // 'password' or 'otp'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [boothId, setBoothId] = useState('');
  
  // OTP state
  const [otpStep, setOtpStep] = useState(1); // 1: request, 2: verify
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpNotice, setDemoOtpNotice] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, requestOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = (roleType) => {
    setError(null);
    setDemoOtpNotice(null);
    if (roleType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
      setBoothId('');
      setAuthMode('password');
    } else if (roleType === 'booth') {
      setUsername('booth101');
      setPassword('booth123');
      setBoothId('B-101');
      setAuthMode('password');
    } else if (roleType === 'deo') {
      setUsername('dataentry');
      setPassword('deo123');
      setBoothId('');
    }
  };

  const redirectByRole = (role) => {
    if (role === 'ADMIN') navigate('/admin-dashboard');
    else if (role === 'DATA_ENTRY') navigate('/deo-dashboard');
    else if (role === 'BOOTH_OFFICER') navigate('/booth-dashboard');
    else navigate('/');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(username, password, boothId || null);
      redirectByRole(data.role);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await requestOTP(username);
      setDemoOtpNotice(res);
      if (res.demo_otp) {
        setOtpCode(res.demo_otp);
      }
      setOtpStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate OTP. Check username.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await verifyOTP(username, otpCode);
      redirectByRole(data.role);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-slate-900 text-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-3">
            <Vote className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Electoral Portal Authentication
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official System Access for Authorized Polling Personnel
          </p>
        </div>

        {/* Quick Fill Demo Roles Selector */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm mb-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            Demo Quick-Fill Accounts:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('deo')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
            >
              Data Entry
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('booth')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
            >
              Booth Officer
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Mode Switch Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setError(null); }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                authMode === 'password'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password Login</span>
            </button>

            <button
              type="button"
              onClick={() => { setAuthMode('otp'); setError(null); }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                authMode === 'otp'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>OTP Demo Login</span>
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* PASSWORD LOGIN FORM */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username / Officer ID
                  </label>
                  <input
                    type="text"
                    id="login-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. admin or booth101"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Password
                  </label>
                  <input
                    type="password"
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                  />
                </div>

                {username.startsWith('booth') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Polling Booth ID (Optional)
                    </label>
                    <input
                      type="text"
                      id="login-booth"
                      value={boothId}
                      onChange={(e) => setBoothId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                      placeholder="e.g. B-101"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Sign In to System</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OTP LOGIN FORM */}
            {authMode === 'otp' && (
              <div>
                {otpStep === 1 ? (
                  <form onSubmit={handleRequestOTP} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Data Entry Officer Username
                      </label>
                      <input
                        type="text"
                        id="otp-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. dataentry"
                      />
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                      <p className="font-semibold flex items-center space-x-1">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Academic Demonstration OTP Mode</span>
                      </p>
                      <p className="mt-1">
                        The generated OTP will be displayed directly for development testing without live SMS dependencies.
                      </p>
                    </div>

                    <button
                      type="submit"
                      id="btn-request-otp"
                      disabled={loading}
                      className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-md shadow-amber-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span>Generate & Send OTP</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    {demoOtpNotice?.demo_otp && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                        <p className="font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Demo OTP Generated:</span>
                        </p>
                        <p className="text-xl font-mono font-bold tracking-widest text-emerald-950 mt-1">
                          {demoOtpNotice.demo_otp}
                        </p>
                        <p className="text-[10px] text-emerald-700 mt-1">
                          Auto-filled below for instant verification. Valid for 10 minutes.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Enter 6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        id="otp-code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full px-3.5 py-2.5 text-center text-lg tracking-widest font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        placeholder="••••••"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setOtpStep(1)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        id="btn-verify-otp"
                        disabled={loading}
                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>Verify & Log In</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to System Overview
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
