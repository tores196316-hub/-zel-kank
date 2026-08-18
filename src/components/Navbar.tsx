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
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
  CheckCircle2,
  Calendar,
  Check,
  Home,
  FileArchive,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi, publicApi } from '../lib/api';
import { Announcement, Notification } from '../types';
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
  const [activeTab, setActiveTab] = useState<'announcements' | 'notifications'>('announcements');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [expandedAnnouncementId, setExpandedAnnouncementId] = useState<string | null>(null);
  
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('imgivo_read_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Fetch announcements for all users (guests + logged in)
  useEffect(() => {
    publicApi.getAnnouncements()
      .then((res) => {
        setAnnouncements(res.announcements || []);
      })
      .catch(() => {});
  }, [currentPath]);

  // Fetch account notifications for authenticated users
  useEffect(() => {
    if (user) {
      authApi.getNotifications()
        .then((res) => setNotifications(res.notifications || []))
        .catch(() => {});
    } else {
      setNotifications([]);
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

  const unreadAnnouncementsCount = announcements.filter(
    (a) => a.active && !readAnnouncementIds.includes(a.id)
  ).length;
  const unreadNotificationsCount = user ? notifications.filter((n) => !n.read).length : 0;
  const totalUnreadCount = unreadAnnouncementsCount + unreadNotificationsCount;

  const handleMarkAllNotificationsRead = async () => {
    try {
      await authApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const handleMarkOneNotificationRead = async (id: string) => {
    try {
      await authApi.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const handleMarkAnnouncementRead = (id: string) => {
    if (!readAnnouncementIds.includes(id)) {
      const updated = [...readAnnouncementIds, id];
      setReadAnnouncementIds(updated);
      try {
        localStorage.setItem('imgivo_read_announcements', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleMarkAllAnnouncementsRead = () => {
    const allIds = announcements.map((a) => a.id);
    const combined = Array.from(new Set([...readAnnouncementIds, ...allIds]));
    setReadAnnouncementIds(combined);
    try {
      localStorage.setItem('imgivo_read_announcements', JSON.stringify(combined));
    } catch {}
  };

  const handleMarkAllAsRead = () => {
    if (activeTab === 'notifications' && user) {
      handleMarkAllNotificationsRead();
    } else {
      handleMarkAllAnnouncementsRead();
    }
  };

  const toggleExpandAnnouncement = (id: string) => {
    handleMarkAnnouncementRead(id);
    setExpandedAnnouncementId((prev) => (prev === id ? null : id));
  };

  const getAnnouncementIcon = (type: string) => {
    if (type === 'warning') return <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    if (type === 'success') return <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    return <Megaphone className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  };

  const getAnnouncementBadge = (type: string) => {
    if (type === 'warning')
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
          Bakım & Uyarı
        </span>
      );
    if (type === 'success')
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
          Yeni Özellik
        </span>
      );
    return (
      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/25">
        Duyuru
      </span>
    );
  };

  const navLinks = [
    { label: 'Ana Sayfa', path: '/', icon: Home },
    { label: 'Resim Yükle', path: '/yukle', icon: Upload },
    { label: 'Galeri', path: '/galerim', icon: Images },
    { label: 'Sıkıştır & Dönüştür', path: '/donusturucu', icon: FileArchive, badge: 'WebP' },
    { label: 'Premium', path: '/premium', icon: Crown },
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

  // Shared Notification Dropdown Content
  const NotificationDropdownMenu = (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0A1020]/95 backdrop-blur-2xl border border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 overflow-hidden">
      {/* Dropdown Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-[#070B14]/80">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-sky-500/10 text-sky-400">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white">Bildirimler & Duyurular</span>
          {totalUnreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {totalUnreadCount} yeni
            </span>
          )}
        </div>

        {((activeTab === 'announcements' && unreadAnnouncementsCount > 0) ||
          (activeTab === 'notifications' && unreadNotificationsCount > 0)) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Check className="w-3 h-3" />
            <span>Okundu Say</span>
          </button>
        )}
      </div>

      {/* Tabs (if user is authenticated) */}
      {user && (
        <div className="flex items-center border-b border-slate-800/80 bg-[#0A1020]/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-3 h-3 text-sky-400" />
            <span>Sistem Duyuruları</span>
            {unreadAnnouncementsCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3 h-3 text-indigo-400" />
            <span>Hesap ({unreadNotificationsCount})</span>
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
        {/* Tab 1: System Announcements */}
        {activeTab === 'announcements' ? (
          announcements.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2">
              <Megaphone className="w-6 h-6 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">Aktif bir sistem duyurusu bulunmuyor.</p>
              <p className="text-[10px] text-slate-500">Tüm sistemler sorunsuz çalışmaktadır.</p>
            </div>
          ) : (
            announcements.map((item) => {
              const isRead = readAnnouncementIds.includes(item.id);
              const isExpanded = expandedAnnouncementId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => toggleExpandAnnouncement(item.id)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer relative ${
                    !isRead ? 'bg-sky-950/20 hover:bg-sky-950/30' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Unread Accent Bar */}
                  {!isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  )}

                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {getAnnouncementIcon(item.type)}
                      <h4 className={`text-xs font-bold truncate ${!isRead ? 'text-white' : 'text-slate-300'}`}>
                        {item.title}
                      </h4>
                    </div>
                    {getAnnouncementBadge(item.type)}
                  </div>

                  {/* Content Preview or Expanded View */}
                  <p className={`text-slate-300 text-[11px] leading-relaxed ${isExpanded ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
                    {item.content}
                  </p>

                  {/* Timestamp and Expand Prompt */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/40 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(item.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-sky-400/90 font-medium hover:underline flex items-center gap-0.5">
                      {isExpanded ? 'Küçült' : 'Detayı Oku'}
                      <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </span>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* Tab 2: User Account Notifications */
          notifications.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2">
              <Bell className="w-6 h-6 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">Henüz hesabınıza ait bildirim yok.</p>
              <p className="text-[10px] text-slate-500">Yükleme ve aktivite bildirimleriniz burada görünecek.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkOneNotificationRead(n.id)}
                className={`p-3.5 text-xs transition-colors cursor-pointer relative ${
                  !n.read ? 'bg-sky-950/20 hover:bg-sky-950/30' : 'hover:bg-slate-800/40'
                }`}
              >
                {!n.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-bold text-white text-xs">{n.title}</span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 mt-0.5 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                  )}
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  {new Date(n.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            ))
          )
        )}
      </div>

      {/* Dropdown Footer Link */}
      <div className="p-2 border-t border-slate-800/80 bg-[#070B14]/90 text-center">
        <button
          onClick={() => handleNav('/duyurular')}
          className="w-full py-1.5 px-3 rounded-xl text-xs font-bold text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Tüm Sistem Duyurularını Görüntüle</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
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
            {/* Notification & System Announcements Bell (Available for ALL users) */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                aria-label="Sistem Duyuruları ve Bildirimler"
                className={`relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 border transition-all cursor-pointer ${
                  notifDropdownOpen
                    ? 'bg-slate-800/90 text-white border-sky-500/50 shadow-md shadow-sky-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-sky-500 text-[8px] font-black text-white ring-2 ring-[#070B14] shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notifDropdownOpen && NotificationDropdownMenu}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
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

          {/* Mobile Header Zone: Upload CTA + Bell + Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              aria-label="Sistem Duyuruları"
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800 relative flex items-center justify-center cursor-pointer transition-colors"
            >
              <Bell className="w-4 h-4" />
              {totalUnreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-[#070B14] shadow-[0_0_6px_rgba(56,189,248,0.9)] animate-pulse" />
              )}
            </button>

            <button
              onClick={() => handleNav('/yukle')}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Yükle</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-slate-300 hover:text-white bg-[#0A1020] border border-slate-800 hover:border-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              aria-label="Menüyü Aç"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Floating Notification Dropdown when triggered on mobile */}
        {notifDropdownOpen && (
          <div className="md:hidden px-4 pb-4 pt-1" ref={notifRef}>
            {NotificationDropdownMenu}
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          📱 V5 MIDNIGHT PREMIUM MOBILE NAVIGATION DRAWER
          ───────────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Glass Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            aria-hidden="true"
          />

          {/* Drawer Container (88-92% width, rounded-l-3xl, midnight glassmorphism) */}
          <div className="relative w-[88%] sm:w-[380px] max-w-[400px] h-full bg-[#080E1A]/95 backdrop-blur-2xl border-l border-slate-800/90 shadow-2xl shadow-cyan-950/40 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-250 ease-out overflow-hidden">
            
            {/* Panel Header */}
            <div className="px-5 h-16 border-b border-slate-800/80 flex items-center justify-between bg-[#070B14]/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <Logo size="sm" variant="horizontal" badgeText="V5" />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Menüyü Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Menu Items Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 custom-scrollbar">
              {/* User Identity Card if logged in */}
              {user && (
                <div className="mb-3 p-3 rounded-2xl bg-[#0B1324] border border-slate-800/90 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center text-xs text-white font-black shrink-0 shadow-sm shadow-cyan-500/20">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{user.username}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  {getPlanBadge(user.plan)}
                </div>
              )}

              {/* Main Navigation Group */}
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const isActive = currentPath === link.path;
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.path}
                      onClick={() => handleNav(link.path)}
                      className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/60 text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={isActive ? 'font-bold text-cyan-200' : 'font-medium'}>{link.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {link.badge && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {link.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="my-2 border-t border-slate-800/80" />

              {/* Secondary Navigation (Duyurular & Yardım) */}
              <div className="space-y-1">
                <button
                  onClick={() => handleNav('/duyurular')}
                  className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                    currentPath === '/duyurular'
                      ? 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Duyurular & Güncellemeler</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {unreadAnnouncementsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {unreadAnnouncementsCount} yeni
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </button>

                <button
                  onClick={() => handleNav('/yardim')}
                  className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer ${
                    currentPath === '/yardim'
                      ? 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Yardım & SSS</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>

              {/* User Specific Menu links if logged in */}
              {user && (
                <>
                  <div className="my-2 border-t border-slate-800/80" />
                  <div className="space-y-1">
                    <button
                      onClick={() => handleNav('/panel')}
                      className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        currentPath === '/panel' ? 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <LayoutDashboard className="w-4 h-4 text-sky-400" />
                        <span>Kullanıcı Paneli</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </button>

                    <button
                      onClick={() => handleNav('/profil')}
                      className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        currentPath === '/profil' ? 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-cyan-400" />
                        <span>Profilim</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </button>

                    <button
                      onClick={() => handleNav('/ayarlar')}
                      className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        currentPath === '/ayarlar' ? 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Hesap Ayarları</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </button>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => handleNav('/admin')}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>Admin Paneli</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Panel Footer: Auth Actions */}
            <div className="p-4 border-t border-slate-800/90 bg-[#070B14]/90 shrink-0">
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Güvenli Çıkış Yap</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleNav('/giris')}
                    className="min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold text-slate-200 bg-[#0C1424] hover:bg-slate-800/90 border border-slate-700/80 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    Giriş Yap
                  </button>
                  <button
                    onClick={() => handleNav('/kayit')}
                    className="min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  >
                    Kayıt Ol
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};

