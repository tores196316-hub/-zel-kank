import React, { useState } from 'react';
import { Settings, Shield, Key, Mail, Trash2, AlertTriangle, CheckCircle2, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import { useToast } from '../components/Toast';

interface SettingsPageProps {
  navigate: (path: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ navigate }) => {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();

  // Profile fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  if (!user) {
    navigate('/giris');
    return null;
  }

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

    setSubmittingProfile(true);
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
      showToast(err.message || 'Güncelleme başarısız oldu.', 'error');
    } finally {
      setSubmittingProfile(false);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-400" />
          Hesap Ayarları
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Kişisel bilgilerinizi, şifrenizi ve hesap güvenlik seçeneklerinizi güncelleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile & Security Form */}
        <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400" />
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
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed select-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">E-Posta Adresi</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed select-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
              🔒 Güvenlik ve hesap doğrulaması nedeniyle kullanıcı adı ve e-posta adresi değiştirilemez.
            </p>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Şifre Değiştir</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mevcut Şifreniz</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Değişiklikleri kaydetmek için gereklidir"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingProfile}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
            >
              {submittingProfile ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
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
              className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Hesabımı Kalıcı Olarak Sil
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
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
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
