import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircle, Shield, Store, KeyRound, CheckCircle, Clock } from 'lucide-react';

const UserProfile = () => {
  const { user, role, boothId } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Operator Profile & Credentials</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Electoral security clearance and operational role assignment
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-md">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
            <p className="text-xs text-slate-500 font-mono">@{user?.username}</p>
            <div className="mt-2 flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                role === 'DATA_ENTRY' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {role?.replace('_', ' ')}
              </span>
              {boothId && (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                  Station: {boothId}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Account Specifications
          </h3>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-500 font-semibold">User ID:</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{user?.id || '1'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Access Level:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{role}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Assigned Polling Booth:</span>
              <p className="font-mono font-bold text-blue-700 mt-0.5">{boothId || 'Unassigned / Global Admin'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Account Status:</span>
              <p className="font-bold text-emerald-700 mt-0.5 flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Active & Verified</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
          <p className="font-bold flex items-center space-x-1.5">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Security & Audit Notification</span>
          </p>
          <p className="text-[11px] leading-relaxed">
            All system actions performed under this identity, including voter lookups, biometric verification triggers, and confirmed ballot recordings, are written immutably to the audit log.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
