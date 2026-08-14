import React, { useState, useEffect, useRef } from 'react';
import { Upload, Images, HelpCircle, User, LogOut, Shield, Menu, X, Bell, Crown, Settings, LayoutDashboard, CheckCircle2, Megaphone, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import { Notification } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      authApi.getNotifications()
        .then((res) => setNotifications(res.notifications || []))
        .catch(() => {});
    }
  }, [user, currentPath]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await authApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await authApi.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const navLinks = [
    { label: 'Yükle', path: '/yukle', icon: Upload },
    { label: 'Galerim', path: '/galerim', icon: Images },
    { label: 'Sıkıştır & Dönüştür', path: '/donusturucu', icon: Sparkles },
    { label: 'Planlar', path: '/premium', icon: Crown },
    { label: 'Duyurular', path: '/duyurular', icon: Megaphone },
    { label: 'Yardım', path: '/yardim', icon: HelpCircle },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
  };

  const getPlanBadge = (planName?: string) => {
    const p = (planName || 'free').toLowerCase();
    if (p === 'admin') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">ADMIN</span>;
    if (p === 'vip') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">VIP</span>;
    if (p === 'premium') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">PREMIUM</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-400 border border-slate-700">ÜCRETSİZ</span>;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-[#1E293B] text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => handleNav('/')}
          className="flex items-center group focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl p-1 transition-all cursor-pointer"
        >
          <Logo size="sm" variant="horizontal" badgeText="V4" />
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Desktop Auth & Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  aria-label="Bildirimler"
                  className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-[#0B0F19] animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-200">Bildirimler</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Tümünü Okundu İşaretle
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">Henüz bildiriminiz yok.</div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkOneRead(n.id)}
                            className={`p-3 text-xs cursor-pointer hover:bg-slate-800/50 transition-colors ${
                              !n.read ? 'bg-blue-950/30' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-semibold text-slate-200">{n.title}</span>
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1" />}
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(n.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Button */}
              {user.role === 'admin' && (
                <button
                  onClick={() => handleNav('/admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    currentPath === '/admin'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700/70 bg-slate-800/50 hover:bg-slate-800 text-slate-200 transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.username}</span>
                  {getPlanBadge(user.plan)}
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-2.5 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{user.username}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => handleNav('/panel')}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                      Kullanıcı Paneli
                    </button>

                    <button
                      onClick={() => handleNav('/profil')}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      Profilim
                    </button>

                    <button
                      onClick={() => handleNav('/ayarlar')}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Hesap Ayarları
                    </button>

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        handleNav('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNav('/giris')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                Giriş Yap
              </button>
              <button
                onClick={() => handleNav('/kayit')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all"
              >
                Kayıt Ol
              </button>
            </div>
          )}
        </div>

        {/* Mobile Header Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => handleNav('/yukle')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Yükle
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-800 transition-colors"
            aria-label="Menü"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0B0F19] px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {user ? (
              <>
                <button
                  onClick={() => handleNav('/panel')}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  Kullanıcı Paneli
                </button>
                <button
                  onClick={() => handleNav('/profil')}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  Profilim
                </button>
                <button
                  onClick={() => handleNav('/ayarlar')}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Hesap Ayarları
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => handleNav('/admin')}
                    className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Paneli
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleNav('/giris')}
                  className="w-full min-h-[44px] py-2.5 text-center rounded-xl text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => handleNav('/kayit')}
                  className="w-full min-h-[44px] py-2.5 text-center rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Kayıt Ol
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
