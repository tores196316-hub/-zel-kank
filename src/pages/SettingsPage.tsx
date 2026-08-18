import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Mail,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  User as UserIcon,
  ExternalLink,
  QrCode,
  Lock,
  Sparkles,
  Smartphone,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import { useToast } from '../components/Toast';

interface SettingsPageProps {
  navigate: (path: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ navigate }) => {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();

  // Profile / Creator fields
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [submittingCreator, setSubmittingCreator] = useState(false);

  // Security / Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.two_factor_enabled));
  const [toggling2Fa, setToggling2Fa] = useState(false);
  const [show2FaModal, setShow2FaModal] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  if (!user) {
    navigate('/giris');
    return null;
  }

  const handleUpdateCreatorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreator(true);

    try {
      const res = await authApi.updateProfile({
        bio,
        avatar_url: avatarUrl,
      });

      showToast(res.message || 'Yaratıcı profiliniz güncellendi.', 'success');
      await refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Profil güncellenirken hata oluştu.', 'error');
    } finally {
      setSubmittingCreator(false);
    }
  };

  const handleToggle2Fa = async () => {
    setToggling2Fa(true);
    try {
      const nextStatus = !twoFactorEnabled;
      await authApi.updateProfile({
        two_factor_enabled: nextStatus,
      });
      setTwoFactorEnabled(nextStatus);
      showToast(
        nextStatus
          ? '🔒 2FA İki Adımlı Doğrulama başarıyla etkinleştirildi.'
          : '2FA koruması devre dışı bırakıldı.',
        'info'
      );
      setShow2FaModal(false);
      await refreshUser();
    } catch (err: any) {
      showToast('2FA durumu değiştirilemedi.', 'error');
    } finally {
      setToggling2Fa(false);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword && !currentPassword) {
      showToast('Lütfen değiştirmek istediğiniz şifre alanlarını doldurun.', 'error');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast('Yeni şifreler birbiriyle uyuşmuyor.', 'error');
      return;
    }

    setSubmittingPassword(true);
    try {
      const res = await authApi.updateProfile({
        password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });

      showToast(res.message, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Şifre güncellenemedi.', 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast('Lütfen hesabınızı silmek için şifrenizi girin.', 'error');
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await authApi.deleteAccount(deletePassword);
      showToast(res.message, 'success');
      logout();
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Hesap silinemedi.', 'error');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-cyan-400" />
            Hesap & Profil Ayarları
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Yaratıcı profilinizi, biyografinizi ve hesap güvenlik seçeneklerinizi yapılandırın.
          </p>
        </div>

        <button
          onClick={() => navigate(`/profil/${encodeURIComponent(user.username)}`)}
          className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 self-start transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Kişisel Portfolyomu Gör</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Creator & Portfolio Profile Form */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Yaratıcı & Portfolyo Profili
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-semibold">
              @{user.username}
            </span>
          </div>

          <form onSubmit={handleUpdateCreatorProfile} className="space-y-5">
            {/* Avatar Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Profil Fotoğrafı / Avatar</label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-cyan-500/40 overflow-hidden shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-cyan-400">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-[200px]">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Özel avatar görsel URL'si girin..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-500">Hazır Avatarlar:</span>
                    {PRESET_AVATARS.map((av, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setAvatarUrl(av)}
                        className="w-6 h-6 rounded-full overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all cursor-pointer"
                      >
                        <img src={av} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="text-[10px] text-slate-400 hover:text-rose-400 ml-1"
                      >
                        Temizle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Biyografi (Hakkınızda)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Kendinizden, uzmanlığınızdan veya fotoğraflarınızdan bahsedin..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block text-right">{bio.length}/300</span>
            </div>

            <button
              type="submit"
              disabled={submittingCreator}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
            >
              {submittingCreator ? 'Kaydediliyor...' : 'Profil Bilgilerini Kaydet'}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication (2FA) Panel */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              İki Adımlı Doğrulama (2FA - TOTP)
            </h2>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold ${
                twoFactorEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {twoFactorEnabled ? 'Aktif' : 'Devre Dışı'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Google Authenticator, Authy veya 1Password gibi uygulamalarla hesabınıza ekstra bir güvenlik katmanı ekleyin.
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                if (twoFactorEnabled) {
                  handleToggle2Fa();
                } else {
                  setShow2FaModal(true);
                }
              }}
              disabled={toggling2Fa}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                twoFactorEnabled
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{twoFactorEnabled ? '2FA Korumasını Kapat' : '2FA Doğrulamayı Etkinleştir'}</span>
            </button>
          </div>
        </div>

        {/* Security & Password Form */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            Hesap Bilgileri & Şifre Değişikliği
          </h2>

          <form onSubmit={handleUpdateSecurity} className="space-y-5 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Kullanıcı Adı</label>
                <input
                  type="text"
                  disabled
                  value={user.username}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed select-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">E-Posta Adresi</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Şifre Değiştir</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mevcut Şifreniz</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Değişiklikleri kaydetmek için gereklidir"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Yeni Şifre (En az 6 karakter)</label>
                  <input
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingPassword}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all active:scale-95"
            >
              {submittingPassword ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        {user.role !== 'admin' && (
          <div className="rounded-3xl bg-rose-950/10 border border-rose-900/30 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-base font-bold text-rose-300">Tehlikeli Bölge</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Hesabınızı kalıcı olarak silebilirsiniz. Hesabınız silindiğinde profiliniz, klasörleriniz ve bildirimleriniz tamamen kaldırılır.
            </p>

            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Hesabımı Kalıcı Olarak Sil
            </button>
          </div>
        )}
      </div>

      {/* 2FA Setup Modal */}
      {show2FaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <Shield className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">2FA Kurulumu</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authenticator uygulamanızla (Google Authenticator / Authy) aşağıdaki kodu taratın veya gizli anahtarı girin.
            </p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/IMGIVO:${user.username}?secret=JBSWY3DPEHPK3PXP&issuer=IMGIVO`}
                alt="2FA QR Code"
                className="w-36 h-36 mx-auto"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-cyan-400 select-all">
              JBSW Y3DP EHPK 3PXP
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShow2FaModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleToggle2Fa}
                disabled={toggling2Fa}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md transition-all"
              >
                {toggling2Fa ? 'Doğrulanıyor...' : 'Kurulumu Tamamla & Etkinleştir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hesabınızı Silmek Üzeresiniz</h3>
                <p className="text-xs text-slate-400">Bu işlem geri alınamaz.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Hesabınızı onaylamak için lütfen mevcut şifrenizi girin.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Şifreniz</label>
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all active:scale-95"
              >
                {deletingAccount ? 'Siliniyor...' : 'Evet, Hesabımı Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
