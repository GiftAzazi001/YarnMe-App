"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { type LanguageCode } from "@/lib/analysis";
import { useYarnContext } from "@/lib/yarn-context";

const languageOptions: Array<{
  label: string;
  value: LanguageCode;
}> = [
  { label: "English", value: "simple-english" },
  { label: "Pidgin", value: "pidgin" },
  { label: "Hausa", value: "hausa" },
];

const textSizes = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "default" },
  { label: "Large", value: "large" },
];

export function SettingsScreen() {
  const { language, setLanguage } = useYarnContext();
  const [textSize, setTextSize] = useState("default");
  const [autoPlay, setAutoPlay] = useState(false);

  return (
    <AppShell header="brand" className="lg:bg-result-background">
      <section className="pb-xl pt-xl">
        <h1 className="text-[40px] font-extrabold leading-[48px] text-primary">
          Settings
        </h1>

        <div className="mt-xl space-y-xl">
          <section className="rounded-2xl bg-surface-container-lowest p-lg shadow-card">
            <h2 className="text-headline-md text-on-surface">Default Language</h2>
            <div className="mt-lg flex flex-wrap gap-md">
              {languageOptions.map((option) => {
                const checked = language === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLanguage(option.value)}
                    aria-pressed={checked}
                    className={[
                      "touch-target rounded-full px-lg text-body-lg font-bold transition active:scale-95",
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
            <h2 className="text-headline-md text-on-surface">Text Size</h2>
            <div className="mt-lg grid grid-cols-3 gap-md">
              {textSizes.map((size) => {
                const active = textSize === size.value;

                return (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setTextSize(size.value)}
                    aria-pressed={active}
                    className={[
                      "touch-target rounded-full px-sm text-body-lg font-bold transition active:scale-95",
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

          <section className="flex min-h-[156px] items-center justify-between gap-md rounded-2xl bg-surface-container-lowest p-lg shadow-card">
            <div>
              <h2 className="text-headline-md text-on-surface">Audio</h2>
              <p className="mt-xs text-body-lg text-on-surface-variant">
                Play explanations automatically
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoPlay}
              onClick={() => setAutoPlay((current) => !current)}
              className={[
                "relative h-11 w-[78px] shrink-0 rounded-full transition",
                autoPlay ? "bg-primary" : "bg-surface-container-highest",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition",
                  autoPlay ? "left-[37px] text-primary" : "left-1 text-transparent",
                ].join(" ")}
              >
                <Check aria-hidden="true" size={22} strokeWidth={3} />
              </span>
            </button>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
