import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Vote, Bell, CheckCircle } from 'lucide-react';

const Navbar = () => {
  const { user, role } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-bold text-slate-800 tracking-tight">
            ELECTION VERIFICATION & MONITORING PORTAL
          </span>
        </div>
        <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
          Central Database Online
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {user?.booth_id && (
          <div className="hidden sm:flex items-center space-x-1.5 bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200 text-xs font-semibold">
            <Vote className="w-3.5 h-3.5 text-blue-600" />
            <span>Booth: {user.booth_id}</span>
          </div>
        )}

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.full_name}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase">{role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
