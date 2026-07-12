import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Truck, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in relative px-4">
      {/* Decorative background glow behind the card */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-[80px] opacity-35 pointer-events-none"></div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 animate-float">
            <Truck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">TransitOps</h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">Smart Transport Operations Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-950/40 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-white placeholder-slate-650"
              placeholder="admin@transitops.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-white placeholder-slate-650 pr-10"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-7 pt-6 border-t border-slate-850">
          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase text-center mb-3.5">Quick Demo Login</p>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {[
              { role: 'Admin', email: 'admin@transitops.com', pass: 'Admin@123' },
              { role: 'Fleet Mgr', email: 'rajesh@transitops.com', pass: 'Fleet@123' },
              { role: 'Driver', email: 'alex@transitops.com', pass: 'Driver@123' },
              { role: 'Safety', email: 'priya@transitops.com', pass: 'Safety@123' },
            ].map((cred) => (
              <button
                key={cred.role}
                type="button"
                onClick={() => { setEmail(cred.email); setPassword(cred.pass); }}
                className="text-left px-3.5 py-2.5 bg-slate-950/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 rounded-xl transition-all duration-200"
              >
                <p className="font-semibold text-slate-200 mb-0.5">{cred.role}</p>
                <p className="text-slate-400 text-[10px] truncate">{cred.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-[10px] text-slate-500 font-bold tracking-widest uppercase relative z-10 select-none animate-pulse">
        Built for <span className="text-blue-500 font-extrabold">Odoo Hackathon 2026</span>
      </div>
    </div>
  );
};

export default Login;
