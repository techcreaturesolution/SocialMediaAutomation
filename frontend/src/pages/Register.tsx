import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot } from 'lucide-react';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    companyName: '', website: '', phone: '', tagline: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        companyBranding: {
          name: form.companyName,
          website: form.website,
          phone: form.phone,
          tagline: form.tagline,
        },
      });
      toast.success('Registration successful!');
      navigate('/');
    } catch (err) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">AI Content Agent</h1>
          <p className="text-slate-400 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Register</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Your name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="your@email.com" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} placeholder="Min 6 characters" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className={inputClass} placeholder="Re-enter password" required />
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4 mt-4">
              <h3 className="text-sm font-medium text-blue-400 mb-3">Company Branding (appears on all content)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                  <input type="text" name="companyName" value={form.companyName} onChange={handleChange} className={inputClass} placeholder="Your company" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Website</label>
                  <input type="text" name="website" value={form.website} onChange={handleChange} className={inputClass} placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <input type="text" name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+91-..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tagline</label>
                  <input type="text" name="tagline" value={form.tagline} onChange={handleChange} className={inputClass} placeholder="Your tagline" />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full mt-6 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-slate-400 mt-4">
            Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
