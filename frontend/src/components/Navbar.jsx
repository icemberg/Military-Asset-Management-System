import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center space-x-2">
        <Shield className="w-6 h-6 text-emerald-500" />
        <span className="font-bold text-lg tracking-wide">MAMS</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-300">Role: <span className="font-semibold text-white">{user.role}</span></span>
        <button 
          onClick={logout}
          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
