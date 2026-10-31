import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UserCheck,
  UserPlus,
  Users,
  Store,
  Vote,
  Award,
  BarChart3,
  ShieldAlert,
  UserCircle,
  LogOut,
  Camera,
  CheckCircle2
} from 'lucide-react';

const Sidebar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (role === 'ADMIN') {
      return [
        { name: 'Admin Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
        { name: 'Voter Directory', path: '/voters', icon: Users },
        { name: 'Register Voter', path: '/register-voter', icon: UserPlus },
        { name: 'Booth Management', path: '/booths', icon: Store },
        { name: 'Elections', path: '/elections', icon: Vote },
        { name: 'Candidates', path: '/candidates', icon: Award },
        { name: 'Voting Analytics', path: '/statistics', icon: BarChart3 },
        { name: 'Audit Trail', path: '/audit-logs', icon: ShieldAlert },
        { name: 'User Profile', path: '/profile', icon: UserCircle },
      ];
    } else if (role === 'DATA_ENTRY') {
      return [
        { name: 'Officer Dashboard', path: '/deo-dashboard', icon: LayoutDashboard },
        { name: 'Register New Voter', path: '/register-voter', icon: UserPlus },
        { name: 'Registered Voters', path: '/voters', icon: Users },
        { name: 'Polling Booths', path: '/booths', icon: Store },
        { name: 'User Profile', path: '/profile', icon: UserCircle },
      ];
    } else if (role === 'BOOTH_OFFICER') {
      return [
        { name: 'Booth Dashboard', path: '/booth-dashboard', icon: LayoutDashboard },
        { name: 'Search Voter', path: '/voter-search', icon: UserCheck },
        { name: 'Face Verification', path: '/face-verification', icon: Camera },
        { name: 'Vote Confirmation', path: '/voting-confirmation', icon: CheckCircle2 },
        { name: 'Booth Statistics', path: '/statistics', icon: BarChart3 },
        { name: 'User Profile', path: '/profile', icon: UserCircle },
      ];
    }
    return [];
  };

  const links = getNavLinks();

  return (
    <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3 bg-[#0a0f1d]">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Vote className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm tracking-wide">VOTER VERIFY</h1>
          <p className="text-[10px] text-blue-400 font-medium tracking-wider uppercase">Anti-Duplicate System</p>
        </div>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Logged Role:</span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${
            role === 'ADMIN' ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50' :
            role === 'DATA_ENTRY' ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50' :
            'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
          }`}>
            {role?.replace('_', ' ')}
          </span>
        </div>
        {user?.booth_id && (
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>Assigned Booth:</span>
            <span className="text-blue-400 font-mono font-semibold">{user.booth_id}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-800 bg-[#0a0f1d]">
        <div className="flex items-center justify-between mb-3">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || user?.username}</p>
            <p className="text-[11px] text-slate-400 truncate">@{user?.username}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
