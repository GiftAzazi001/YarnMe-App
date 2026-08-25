"use client";

import { AppShell } from "@/components/app-shell";
import {
  analysisLanguageOptions,
  appCopy,
} from "@/lib/app-copy";
import {
  type TextSizePreference,
  useYarnSettings,
} from "@/lib/settings";

const textSizeValues: TextSizePreference[] = ["small", "medium", "large"];

export function SettingsScreen() {
  const {
    settings,
    setDefaultLanguage,
    setTextSize,
  } = useYarnSettings();
  const activeCopy = appCopy[settings.language].settings;

  return (
    <AppShell header="brand" className="lg:bg-result-background">
      <section className="pb-xl pt-xl">
        <h1 className="text-headline-lg-mobile text-primary">
          {activeCopy.title}
        </h1>

        <div className="mt-xl space-y-xl">
          <section className="rounded-2xl bg-surface-container-lowest p-lg shadow-card">
            <h2 className="text-headline-sm text-on-surface">{activeCopy.defaultLanguage}</h2>
            <div className="mt-lg flex flex-wrap gap-md">
              {analysisLanguageOptions.map((option) => {
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
            <h2 className="text-headline-sm text-on-surface">{activeCopy.textSize}</h2>
            <div className="mt-lg grid grid-cols-3 gap-md">
              {textSizeValues.map((size) => {
                const active = settings.textSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setTextSize(size)}
                    aria-pressed={active}
                    className={[
                      "touch-target rounded-full px-sm text-label-lg font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95",
                      active
                        ? "bg-primary text-on-primary shadow-button"
                        : "bg-surface-container-high text-primary hover:bg-primary-fixed/40",
                    ].join(" ")}
                  >
                    {activeCopy.textSizeOptions[size]}
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
