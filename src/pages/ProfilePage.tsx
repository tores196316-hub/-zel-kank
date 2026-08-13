import React, { useState } from 'react';
import { User, Shield, Key, Images, Calendar, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import { useToast } from '../components/Toast';

interface ProfilePageProps {
  navigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-400 text-sm">Lütfen profilinizi görüntülemek için giriş yapın.</p>
        <button
          onClick={() => navigate('/giris')}
          className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs"
        >
          Giriş Yap
        </button>
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !newPassword) return;

    setSubmitting(true);
    try {
      const res = await authApi.updateProfile(password, newPassword);
      showToast(res.message, 'success');
      setPassword('');
      setNewPassword('');
    } catch (err: any) {
      showToast(err.message || 'Şifre değiştirilemedi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Profile Banner */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shrink-0">
          {user.username.charAt(0).toUpperCase()}
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold text-white">{user.username}</h1>
            {user.role === 'admin' && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5" /> {user.email}
          </p>
          <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
            <Calendar className="w-3.5 h-3.5" /> Katılım: {new Date(user.created_at).toLocaleDateString('tr-TR')}
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-2xl text-center min-w-[140px]">
          <span className="text-2xl font-extrabold text-blue-400 block">{user.image_count || 0}</span>
          <span className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1 mt-0.5">
            <Images className="w-3.5 h-3.5 text-blue-400" /> Yüklenen Resim
          </span>
        </div>
      </div>

      {/* Password Change Box */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 max-w-lg">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-400" />
          Şifre Değiştir
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Mevcut Şifreniz</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Yeni Şifreniz (En az 6 karakter)</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md"
          >
            {submitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
};
