"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { languageSchema, type LanguageCode } from "@/lib/analysis";

export const YARNME_SETTINGS_STORAGE_KEY = "yarnme-settings";

export type TextSizePreference = "small" | "medium" | "large";

export type YarnMeSettings = {
  language: LanguageCode;
  textSize: TextSizePreference;
};

type SettingsContextValue = {
  settings: YarnMeSettings;
  languageRevision: number;
  setDefaultLanguage: (language: LanguageCode) => void;
  setTextSize: (textSize: TextSizePreference) => void;
};

export const defaultSettings: YarnMeSettings = {
  language: "simple-english",
  textSize: "medium",
};

const textSizeValues = new Set<TextSizePreference>(["small", "medium", "large"]);
const SettingsContext = createContext<SettingsContextValue | null>(null);

function parseStoredSettings(value: unknown): YarnMeSettings {
  if (!value || typeof value !== "object") {
    return defaultSettings;
  }

  const maybeSettings = value as Partial<Record<keyof YarnMeSettings, unknown>>;
  const parsedLanguage = languageSchema.safeParse(maybeSettings.language);
  const language = parsedLanguage.success
    ? parsedLanguage.data
    : defaultSettings.language;
  const textSize =
    typeof maybeSettings.textSize === "string" &&
    textSizeValues.has(maybeSettings.textSize as TextSizePreference)
      ? (maybeSettings.textSize as TextSizePreference)
      : defaultSettings.textSize;

  return { language, textSize };
}

function readStoredSettings(): YarnMeSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem(YARNME_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return defaultSettings;
    }
    return parseStoredSettingsFromRaw(raw);
  } catch {
    return defaultSettings;
  }
}

function parseStoredSettingsFromRaw(raw: string | null): YarnMeSettings {
  if (!raw) {
    return defaultSettings;
  }

  try {
    return parseStoredSettings(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
}

function persistSettings(settings: YarnMeSettings) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      YARNME_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch {}
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<YarnMeSettings>(defaultSettings);
  const [languageRevision, setLanguageRevision] = useState(0);

  useEffect(() => {
    setSettings(readStoredSettings());
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        event.storageArea !== window.localStorage ||
        event.key !== YARNME_SETTINGS_STORAGE_KEY
      ) {
        return;
      }

      const nextSettings = parseStoredSettingsFromRaw(event.newValue);
      setSettings((current) => {
        if (current.language !== nextSettings.language) {
          setLanguageRevision((revision) => revision + 1);
        }
        return nextSettings;
      });
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setDefaultLanguage = useCallback(
    (language: LanguageCode) => {
      setSettings((current) => {
        const nextSettings = { ...current, language };
        persistSettings(nextSettings);
        return nextSettings;
      });
      setLanguageRevision((current) => current + 1);
    },
    [],
  );

  const setTextSize = useCallback(
    (textSize: TextSizePreference) => {
      setSettings((current) => {
        const nextSettings = { ...current, textSize };
        persistSettings(nextSettings);
        return nextSettings;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      settings,
      languageRevision,
      setDefaultLanguage,
      setTextSize,
    }),
    [settings, languageRevision, setDefaultLanguage, setTextSize],
  );

  return (
    <SettingsContext.Provider value={value}>
      <div
        className="yarnme-readable min-h-dvh"
        data-text-size={settings.textSize}
      >
        {children}
      </div>
    </SettingsContext.Provider>
  );
}

export function useYarnSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useYarnSettings must be used within a SettingsProvider");
  }
  return context;
}
