"use client";

import { AppShell } from "@/components/app-shell";
import { type LanguageCode } from "@/lib/analysis";
import {
  type TextSizePreference,
  useYarnSettings,
} from "@/lib/settings";

const languageOptions: Array<{
  label: string;
  value: LanguageCode;
}> = [
  { label: "Simple English", value: "simple-english" },
  { label: "Pidgin", value: "pidgin" },
  { label: "Hausa", value: "hausa" },
];

const textSizes: Array<{
  label: string;
  value: TextSizePreference;
}> = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

export function SettingsScreen() {
  const {
    settings,
    setDefaultLanguage,
    setTextSize,
  } = useYarnSettings();

  return (
    <AppShell header="brand" className="lg:bg-result-background">
      <section className="pb-xl pt-xl">
        <h1 className="text-headline-lg-mobile text-primary">
          Settings
        </h1>

        <div className="mt-xl space-y-xl">
          <section className="rounded-2xl bg-surface-container-lowest p-lg shadow-card">
            <h2 className="text-headline-sm text-on-surface">Default Language</h2>
            <div className="mt-lg flex flex-wrap gap-md">
              {languageOptions.map((option) => {
                const checked = settings.language === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDefaultLanguage(option.value)}
                    aria-pressed={checked}
                    className={[
                      "touch-target rounded-full px-lg text-label-lg font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95",
                      checked
                        ? "bg-primary text-on-primary shadow-button"
                        : "bg-surface-container-high text-primary hover:bg-primary-fixed/40",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-surface-container-lowest p-lg shadow-card">
            <h2 className="text-headline-sm text-on-surface">Text Size</h2>
            <div className="mt-lg grid grid-cols-3 gap-md">
              {textSizes.map((size) => {
                const active = settings.textSize === size.value;

                return (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setTextSize(size.value)}
                    aria-pressed={active}
                    className={[
                      "touch-target rounded-full px-sm text-label-lg font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95",
                      active
                        ? "bg-primary text-on-primary shadow-button"
                        : "bg-surface-container-high text-primary hover:bg-primary-fixed/40",
                    ].join(" ")}
                  >
                    {size.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
