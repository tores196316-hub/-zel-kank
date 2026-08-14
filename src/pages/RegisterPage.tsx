import React, { useState, useEffect } from 'react';
import { UserPlus, User, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Logo } from '../components/Logo';

interface RegisterPageProps {
  navigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const { user, login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!cleanEmail || !cleanUsername || !password) {
      setErrorMessage('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    // Username length check
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      setErrorMessage('Kullanıcı adı 3 ile 20 karakter arasında olmalıdır.');
      return;
    }

    // Username characters check
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      setErrorMessage('Kullanıcı adı sadece harf, rakam, alt tire (_) ve tire (-) içerebilir.');
      return;
    }

    // Password length check
    if (password.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    // Password confirmation check
    if (password !== confirmPassword) {
      setErrorMessage('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.register(cleanEmail, cleanUsername, password);
      login(res.token, res.user);
      showToast(res.message || 'Kayıt başarılı! Hoş geldiniz.', 'success');
      navigate('/panel');
    } catch (err: any) {
      const msg = err.message || 'Kayıt işlemi gerçekleştirilemedi. Lütfen bilgilerinizi kontrol edin.';
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
        <h1 className="text-xl font-black text-white tracking-tight">Yeni Hesap Oluşturun</h1>
        <p className="text-slate-400 text-xs sm:text-sm">Resimlerinizi güvenle saklayın, kategorize edin ve yönetin.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0A1020] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">E-Posta Adresi</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="ornek@domain.com"
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Kullanıcı Adı</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="kullanici_adi"
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-500">3-20 karakter, sadece harf, rakam, tire ve alt tire.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Şifre (En az 6 karakter)</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="••••••••"
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Şifre Tekrar</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="••••••••"
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed pt-1">
          Kayıt olarak{' '}
          <button
            type="button"
            onClick={() => navigate('/sartlar')}
            className="text-sky-400 hover:underline font-semibold cursor-pointer"
          >
            Kullanım Şartları
          </button>
          'nı ve{' '}
          <button
            type="button"
            onClick={() => navigate('/gizlilik')}
            className="text-sky-400 hover:underline font-semibold cursor-pointer"
          >
            Gizlilik Politikası
          </button>
          'nı kabul etmiş sayılırsınız.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[48px] py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all mt-2 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Kayıt Yapılıyor...
            </span>
          ) : (
            <>
              <span>Ücretsiz Kayıt Ol</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Zaten hesabınız var mı?{' '}
          <button
            type="button"
            onClick={() => navigate('/giris')}
            className="text-sky-400 hover:underline font-bold cursor-pointer"
          >
            Giriş Yapın
          </button>
        </div>
      </form>
    </div>
  );
};

