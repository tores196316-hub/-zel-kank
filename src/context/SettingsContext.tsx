import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SiteSettings } from '../types';
import { publicApi } from '../lib/api';

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettingsLocally: (newSettings: Partial<SiteSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SETTINGS_UPDATED_EVENT = 'imgivo:settings_updated';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await publicApi.getSettings();
      if (res) {
        setSettings(res);
      }
    } catch (err) {
      console.warn('Could not fetch public settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettingsLocally = useCallback((newSettings: Partial<SiteSettings>) => {
    setSettings((prev) => {
      if (!prev) return newSettings as SiteSettings;
      return { ...prev, ...newSettings };
    });
  }, []);

  useEffect(() => {
    refreshSettings();

    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<SiteSettings>;
      if (customEvent.detail) {
        setSettings((prev) => ({ ...(prev || {}), ...customEvent.detail } as SiteSettings));
      } else {
        refreshSettings();
      }
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    };
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, updateSettingsLocally }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
