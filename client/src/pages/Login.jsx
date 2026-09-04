import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Factory, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, isAuthenticated, user, getRoleDashboard } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(getRoleDashboard(user.role), { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);
  try {
    if (isRegister) { 
      const message = await register(name, email, password, role);
      setSuccess(message || 'Account created. Check your email to verify your account.');
      setIsRegister(false);
      setName('');
      setPassword('');
      return;
    }
    else {
      const loggedInUser = await login(email, password);
      navigate(getRoleDashboard(loggedInUser.role), { replace: true });
      return;
    }
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    console.error('Response:', err.response);
    console.error('Response data:', err.response?.data);
    console.error('Status:', err.response?.status);
    setError(err.response?.data?.message || err.message || 'Something went wrong');
  } finally { 
    setLoading(false); 
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-textile-50 via-white to-gray-50">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-textile-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-textile-200">
            <Factory className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TextileFlow</h1>
          <p className="text-gray-500 mt-1">Manufacturing Management System</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">{isRegister ? 'Create Account' : 'Sign In'}</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">{success}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" className="input-field" required={isRegister} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-textile-500 outline-none" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-textile-500 outline-none" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="input-field">
                  <option value="employee">Employee</option>
                  <option value="customer">Customer</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-textile-600 hover:bg-textile-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {loading ? (isRegister ? 'Creating Account...' : 'Signing in...') : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-textile-600 hover:text-textile-700 font-medium">
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
