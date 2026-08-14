import React, { useState, useEffect } from 'react';
import { LogIn, User, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Logo } from '../components/Logo';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { user, login } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to user dashboard or admin
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/panel');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Lütfen kullanıcı adı veya e-posta adresinizi girin.');
      return;
    }

    if (!password) {
      setErrorMessage('Lütfen şifrenizi girin.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.login(cleanIdentifier, password);
      login(res.token, res.user);
      showToast(res.message || 'Giriş başarılı! Hoş geldiniz.', 'success');
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/panel');
      }
    } catch (err: any) {
      const msg = err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-14 space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Logo size="md" variant="vertical" showSlogan={true} />
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">Hesabınıza Giriş Yapın</h1>
        <p className="text-slate-400 text-xs sm:text-sm">Yüklediğiniz resimleri yönetin ve galerinize erişin.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">E-Posta veya Kullanıcı Adı</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="kullanici_adi veya e-posta"
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">Şifre</label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="••••••••"
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[44px] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all mt-2 active:scale-95 disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Giriş Yapılıyor...
            </span>
          ) : (
            <>
              <span>Giriş Yap</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Hesabınız yok mu?{' '}
          <button
            type="button"
            onClick={() => navigate('/kayit')}
            className="text-blue-400 hover:underline font-bold"
          >
            Hemen Kayıt Olun
          </button>
        </div>
      </form>
    </div>
  );
};

