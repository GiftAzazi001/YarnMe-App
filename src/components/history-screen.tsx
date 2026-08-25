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
import { devTestInputs } from "@/lib/dev-test-inputs";

const langBadges = {
  "simple-english": { label: "English" },
  pidgin: { label: "Pidgin" },
  hausa: { label: "Hausa" },
};

export function HistoryScreen() {
  const { historyList, setAnalysisResult, setSourceText, setLanguage, runAnalysis } =
    useYarnContext();
  const router = useRouter();

  function handleOpenHistoryItem(item: (typeof historyList)[0]) {
    setAnalysisResult(item);
    setSourceText(item.sourceText);
    setLanguage(item.language);
    router.push("/result");
  }

  async function handleLoadSample(index: number) {
    const sample = devTestInputs[index];
    router.push("/processing");
    await runAnalysis(sample.text, "simple-english");
    router.push("/result");
  }

  if (historyList.length === 0) {
    return (
      <AppShell header="brand" className="lg:bg-result-background">
        <section className="flex min-h-[calc(100dvh-220px)] flex-col items-center justify-center py-xl text-center">
          <div className="mb-lg flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-high text-primary">
            <FileClock aria-hidden="true" size={40} />
          </div>
          <h1 className="text-headline-lg-mobile text-primary">Your Yarn</h1>
          <p className="mt-sm max-w-[320px] text-body-lg text-on-surface-variant">
            Your recent explanations will appear here after you yarn a notice.
          </p>
          <div className="mt-xl grid w-full max-w-xs gap-sm">
            <Button onClick={() => router.push("/")} className="h-14 text-label-lg">
              <MessageSquarePlus aria-hidden="true" size={20} />
              <span>Start a yarn</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleLoadSample(0)}
              className="h-12 text-label-md"
            >
              <BriefcaseBusiness aria-hidden="true" size={18} />
              <span>Try sample notice</span>
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
          Your Yarn
        </h1>
        <p className="mt-xs text-body-lg text-on-surface-variant">
          Review your recent translations and insights.
        </p>

        <div className="mt-xl space-y-md">
          {historyList.map((item, idx) => {
            const badge = langBadges[item.language] || langBadges["simple-english"];
            const hasUncertainty = item.analysis.uncertainties.length > 0;
            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "Today";
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
                  <span className="line-clamp-2 text-headline-md text-on-surface">
                    {item.analysis.meaning || "YarnMe explanation"}
                  </span>
                  <span className="mt-xs flex flex-wrap items-center gap-sm">
                    <span className="rounded-full bg-surface-container-low px-sm py-xs text-label-lg font-semibold text-primary">
                      {badge.label}
                    </span>
                    <span className="inline-flex items-center gap-xs text-body-md text-on-surface-variant">
                      <Clock aria-hidden="true" size={16} />
                      {idx === 0 ? "Today" : formattedDate}
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
                  {hasUncertainty ? "Incomplete" : "Clear"}
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
            <span>Explain another notice</span>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
