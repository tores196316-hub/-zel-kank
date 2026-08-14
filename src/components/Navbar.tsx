import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Images,
  HelpCircle,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  Bell,
  Crown,
  Settings,
  LayoutDashboard,
  Megaphone,
  Sparkles,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';
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
    { label: 'Ana Sayfa', path: '/' },
    { label: 'Resim Yükle', path: '/yukle' },
    { label: 'Galeri', path: '/galerim' },
    { label: 'Sıkıştır & Dönüştür', path: '/donusturucu', badge: 'WebP' },
    { label: 'Premium', path: '/premium' },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
  };

  const getPlanBadge = (planName?: string) => {
    const p = (planName || 'free').toLowerCase();
    if (p === 'admin') return <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">ADMIN</span>;
    if (p === 'vip') return <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">VIP</span>;
    if (p === 'premium') return <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">PRO</span>;
    return <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">ÜCRETSİZ</span>;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070B14]/85 backdrop-blur-xl border-b border-slate-800/80 text-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Logo */}
        <button
          onClick={() => handleNav('/')}
          className="flex items-center group focus:outline-none rounded-xl p-1 transition-all cursor-pointer shrink-0"
        >
          <Logo size="sm" variant="horizontal" badgeText="V5" />
        </button>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600/15 text-sky-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Desktop Actions & User Controls */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  aria-label="Bildirimler"
                  className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-400 rounded-full ring-2 ring-[#070B14] animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0A1020] border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-200">Bildirimler</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
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
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1" />}
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

              {/* Admin Quick Button */}
              {user.role === 'admin' && (
                <button
                  onClick={() => handleNav('/admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    currentPath === '/admin'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}

              {/* User Account Menu Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-800 bg-[#0F172A]/80 hover:bg-[#131D2F] text-slate-200 transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-black">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{user.username}</span>
                  {getPlanBadge(user.plan)}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0A1020] border border-slate-800 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{user.username}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => handleNav('/panel')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
                      <span>Kullanıcı Paneli</span>
                    </button>

                    <button
                      onClick={() => handleNav('/galerim')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <Images className="w-3.5 h-3.5 text-blue-400" />
                      <span>Galerim & Albümler</span>
                    </button>

                    <button
                      onClick={() => handleNav('/profil')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Profilim</span>
                    </button>

                    <button
                      onClick={() => handleNav('/ayarlar')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hesap Ayarları</span>
                    </button>

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        handleNav('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNav('/giris')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
              >
                Giriş Yap
              </button>
              <button
                onClick={() => handleNav('/kayit')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
              >
                Kayıt Ol
              </button>
            </div>
          )}

          {/* Primary CTA: Resim Yükle Button */}
          <button
            onClick={() => handleNav('/yukle')}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Resim Yükle</span>
          </button>
        </div>

        {/* Mobile Header Zone: Upload button + Hamburger trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => handleNav('/yukle')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Yükle</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Menü"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/90 bg-[#070B14]/98 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`w-full min-h-[48px] flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-sky-400 border border-blue-500/30'
                    : 'text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => handleNav('/duyurular')}
            className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <Megaphone className="w-4 h-4 text-blue-400" />
            <span>Duyurular & Güncellemeler</span>
          </button>

          <button
            onClick={() => handleNav('/yardim')}
            className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Yardım & SSS</span>
          </button>

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            {user ? (
              <>
                <div className="p-3 rounded-xl bg-[#0A1020] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{user.username}</p>
                    <p className="text-[11px] text-slate-400">{user.email}</p>
                  </div>
                  {getPlanBadge(user.plan)}
                </div>

                <button
                  onClick={() => handleNav('/panel')}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-sky-400" />
                  <span>Kullanıcı Paneli</span>
                </button>
                <button
                  onClick={() => handleNav('/profil')}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Profilim</span>
                </button>
                <button
                  onClick={() => handleNav('/ayarlar')}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Hesap Ayarları</span>
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => handleNav('/admin')}
                    className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Paneli</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Çıkış Yap</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleNav('/giris')}
                  className="w-full min-h-[48px] py-3 text-center rounded-xl text-sm font-bold text-slate-200 bg-[#0F172A] border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => handleNav('/kayit')}
                  className="w-full min-h-[48px] py-3 text-center rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-sky-500 text-white transition-colors cursor-pointer"
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
