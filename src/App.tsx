import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { HomePage } from './pages/HomePage';
import { UploadPage } from './pages/UploadPage';
import { GalleryPage } from './pages/GalleryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PremiumPage } from './pages/PremiumPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ImageDetailPage } from './pages/ImageDetailPage';
import { AboutPage } from './pages/AboutPage';
import { HelpPage } from './pages/HelpPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderCurrentView = () => {
    const path = currentPath.toLowerCase();

    if (path === '/' || path === '') {
      return <HomePage navigate={navigate} />;
    }
    if (path === '/yukle') {
      return <UploadPage navigate={navigate} />;
    }
    if (path === '/galerim') {
      return <GalleryPage navigate={navigate} />;
    }
    if (path === '/panel') {
      return <DashboardPage navigate={navigate} />;
    }
    if (path === '/profil') {
      return <ProfilePage navigate={navigate} />;
    }
    if (path === '/ayarlar') {
      return <SettingsPage navigate={navigate} />;
    }
    if (path === '/premium') {
      return <PremiumPage navigate={navigate} />;
    }
    if (path === '/duyurular') {
      return <AnnouncementsPage />;
    }
    if (path === '/hakkimizda') {
      return <AboutPage />;
    }
    if (path === '/yardim') {
      return <HelpPage />;
    }
    if (path === '/sartlar') {
      return <TermsPage />;
    }
    if (path === '/gizlilik') {
      return <PrivacyPage />;
    }
    if (path === '/iletisim') {
      return <ContactPage />;
    }
    if (path === '/giris') {
      return <LoginPage navigate={navigate} />;
    }
    if (path === '/kayit') {
      return <RegisterPage navigate={navigate} />;
    }
    if (path === '/admin') {
      return <AdminPage navigate={navigate} />;
    }

    // Match /i/:id
    if (path.startsWith('/i/')) {
      const imageId = path.replace('/i/', '').trim();
      if (imageId) {
        return <ImageDetailPage imageId={imageId} navigate={navigate} />;
      }
    }

    return <NotFoundPage navigate={navigate} />;
  };

  return (
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
          <Navbar currentPath={currentPath} navigate={navigate} />
          <main className="flex-1">{renderCurrentView()}</main>
          <Footer navigate={navigate} />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
