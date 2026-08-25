"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Settings {
  // Privacy
  profileVisibility: "public" | "friends";
  savedRecsVisibility: "everyone" | "friends" | "only-me";
  asksVisibility: "friends" | "anyone";
  showCity: boolean;
  allowFofRecs: boolean;
  // Notifications
  notifyFriendVouches: boolean;
  notifyAskReplies: boolean;
  notifyTrustedChain: boolean;
  notifyFriendJoins: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  profileVisibility: "public",
  savedRecsVisibility: "friends",
  asksVisibility: "friends",
  showCity: true,
  allowFofRecs: true,
  notifyFriendVouches: true,
  notifyAskReplies: true,
  notifyTrustedChain: true,
  notifyFriendJoins: false,
};

const STORAGE_KEY = "trust-me-settings";

interface SettingsContextValue {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
    } catch {
      // ignore
    }
  }, []);

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
