"use client";

import { useRouter } from "@/lib/navigation";
import {
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileClock,
  FileText,
  MessageSquarePlus,
  SmilePlus,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { useYarnContext } from "@/lib/yarn-context";
import { analysisLanguageLabels, appCopy } from "@/lib/app-copy";
import { useYarnSettings } from "@/lib/settings";

export function HistoryScreen() {
  const {
    historyList,
    setAnalysisResult,
    setSourceText,
    setSourceImage,
    setLanguage,
    loadSample,
  } = useYarnContext();
  const { settings } = useYarnSettings();
  const activeCopy = appCopy[settings.language].history;
  const router = useRouter();

  function handleOpenHistoryItem(item: (typeof historyList)[0]) {
    setAnalysisResult(item);
    setSourceText(item.sourceText);
    setSourceImage(null);
    setLanguage(item.language);
    router.push("/result");
  }

  function handleLoadSample(index: number) {
    loadSample(index);
    router.push("/processing");
  }

  if (historyList.length === 0) {
    return (
      <AppShell header="brand" className="lg:bg-result-background">
        <section className="mx-auto flex min-h-[calc(100dvh-220px)] w-full max-w-[640px] flex-col items-center justify-center py-lg text-center">
          <div className="mb-md flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-high text-primary">
            <FileClock aria-hidden="true" size={40} />
          </div>
          <h1 className="text-headline-lg-mobile text-primary">{activeCopy.title}</h1>
          <p className="mt-sm max-w-[460px] text-body-lg text-on-surface-variant">
            {activeCopy.emptyBody}
          </p>
          <div className="mt-lg flex w-full max-w-[320px] flex-col gap-sm sm:max-w-none sm:flex-row sm:justify-center sm:gap-sm">
            <Button
              onClick={() => router.push("/")}
              className="h-[50px] w-full min-w-[190px] whitespace-nowrap !rounded-2xl px-6 text-label-md sm:w-auto"
            >
              <MessageSquarePlus aria-hidden="true" size={20} />
              <span>{activeCopy.startYarn}</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleLoadSample(0)}
              className="h-[50px] w-full min-w-[190px] whitespace-nowrap !rounded-2xl px-6 text-label-md sm:w-auto"
            >
              <BriefcaseBusiness aria-hidden="true" size={18} />
              <span>{activeCopy.trySampleNotice}</span>
            </Button>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell header="brand" className="lg:bg-result-background">
      <section className="pb-xl pt-xl">
        <h1 className="text-[48px] font-extrabold leading-[56px] text-primary">
          {activeCopy.title}
        </h1>
        <p className="mt-xs text-body-lg text-on-surface-variant">
          {activeCopy.subtitle}
        </p>

        <div className="mt-xl space-y-md">
          {historyList.map((item, idx) => {
            const hasUncertainty = item.analysis.uncertainties.length > 0;
            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : activeCopy.today;
            const Icon = item.language === "hausa" ? BookOpenCheck : item.language === "pidgin" ? FileText : BriefcaseBusiness;

            return (
              <button
                key={`${item.createdAt}-${idx}`}
                type="button"
                onClick={() => handleOpenHistoryItem(item)}
                className={[
                  "group relative flex w-full items-center gap-md overflow-hidden rounded-2xl bg-surface-container-lowest p-md text-left shadow-card transition hover:-translate-y-0.5 active:translate-y-0",
                  hasUncertainty ? "before:bg-secondary-container" : "before:bg-primary",
                  "before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:content-['']",
                ].join(" ")}
              >
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
                  <Icon aria-hidden="true" size={28} strokeWidth={2.4} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="yarnme-reading-title line-clamp-2 text-headline-md text-on-surface">
                    {item.analysis.meaning || activeCopy.fallbackTitle}
                  </span>
                  <span className="mt-xs flex flex-wrap items-center gap-sm">
                    <span className="rounded-full bg-surface-container-low px-sm py-xs text-label-lg font-semibold text-primary">
                      {analysisLanguageLabels[item.language] ?? analysisLanguageLabels["simple-english"]}
                    </span>
                    <span className="inline-flex items-center gap-xs text-body-md text-on-surface-variant">
                      <Clock aria-hidden="true" size={16} />
                      {idx === 0 ? activeCopy.today : formattedDate}
                    </span>
                  </span>
                </span>

                <span
                  className={[
                    "hidden rounded-full px-sm py-xs text-label-lg font-bold sm:inline-flex sm:items-center sm:gap-xs",
                    hasUncertainty
                      ? "bg-error-container text-on-error-container"
                      : "bg-primary-fixed text-primary",
                  ].join(" ")}
                >
                  {hasUncertainty ? (
                    <SmilePlus aria-hidden="true" size={17} />
                  ) : (
                    <CheckCircle2 aria-hidden="true" size={17} />
                  )}
                  {hasUncertainty ? activeCopy.incomplete : activeCopy.clear}
                </span>

                <ChevronRight
                  aria-hidden="true"
                  className="shrink-0 text-on-surface-variant transition group-hover:text-primary"
                  size={26}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-xl text-center">
          <Button
            variant="secondary"
            onClick={() => router.push("/")}
            className="h-12 px-xl"
          >
            <MessageSquarePlus aria-hidden="true" size={18} />
            <span>{activeCopy.explainAnother}</span>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
