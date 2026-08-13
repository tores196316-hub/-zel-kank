import React, { useState } from 'react';
import { LogIn, User, Lock, ArrowRight } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setSubmitting(true);
    try {
      const res = await authApi.login(identifier, password);
      login(res.token, res.user);
      showToast(res.message, 'success');
      navigate('/galerim');
    } catch (err: any) {
      showToast(err.message || 'Giriş başarısız.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Hesabınıza Giriş Yapın</h1>
        <p className="text-slate-400 text-xs">Yüklediğiniz resimleri yönetin ve galerinizi görüntüleyin.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">E-Posta veya Kullanıcı Adı</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="kullanici_adi veya e-posta"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Şifre</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all mt-2"
        >
          {submitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-2 text-center text-xs text-slate-400">
          Hesabınız yok mu?{' '}
          <button
            type="button"
            onClick={() => navigate('/kayit')}
            className="text-blue-400 hover:underline font-semibold"
          >
            Hemen Kayıt Olun
          </button>
        </div>
      </form>
    </div>
  );
};
