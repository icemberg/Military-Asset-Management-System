import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <Shield className="w-12 h-12 text-emerald-600 mb-2" />
          <h1 className="text-2xl font-bold text-slate-800">MAMS Portal</h1>
          <p className="text-slate-500 text-sm">Military Asset Management System</p>
        </div>
        
        {error && <div className="bg-rose-50 text-rose-600 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              id="username"
              type="text" 
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              id="password"
              type="password" 
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-slate-800 text-white p-2 rounded-md hover:bg-slate-700 transition font-medium"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};
