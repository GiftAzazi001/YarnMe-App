"use client";

import { useState } from "react";
import { Link, useRouter } from "@/lib/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  HelpCircle,
  Languages,
  Pencil,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { type LanguageCode } from "@/lib/analysis";
import { useYarnContext } from "@/lib/yarn-context";
import { analysisLanguageLabels } from "@/lib/app-copy";
import { useYarnSettings } from "@/lib/settings";

const copy: Record<
  LanguageCode,
  {
    languageName: string;
    title: string;
    heading: string;
    intro: string;
    snippet: string;
    explanation: string;
    alertPrefix: string;
    suggest: string;
    original: string;
    hideOriginal: string;
    sheetTitle: string;
    yarnMeSaid: string;
    correctionLabel: string;
    correctionPlaceholder: string;
    send: string;
    thanks: string;
    thanksBody: string;
    done: string;
    noReview: string;
    noReviewBody: string;
    backToResult: string;
    goBack: string;
    closeCorrectionSheet: string;
    close: string;
  }
> = {
  "simple-english": {
    languageName: "Simple English",
    title: "Review Yarn",
    heading: "This part is not clear",
    intro: "Some information may be missing or cut off.",
    snippet: "Section snippet",
    explanation: "YarnMe explanation",
    alertPrefix: "YarnMe is not fully sure about this part:",
    suggest: "Suggest clearer information",
    original: "See original",
    hideOriginal: "Hide original",
    sheetTitle: "How would you explain this better?",
    yarnMeSaid: "YarnMe said",
    correctionLabel: "Your correction",
    correctionPlaceholder: "Type the corrected or clearer explanation...",
    send: "Send",
    thanks: "Thank you.",
    thanksBody: "You helped YarnMe improve.",
    done: "Done",
    noReview: "No review needed",
    noReviewBody: "YarnMe did not find an unclear part in the latest yarn.",
    backToResult: "Back to result",
    goBack: "Go back",
    closeCorrectionSheet: "Close correction sheet",
    close: "Close",
  },
  pidgin: {
    languageName: "Pidgin",
    title: "Review Yarn",
    heading: "This part no clear",
    intro: "Some information fit don miss or cut off.",
    snippet: "Section snippet",
    explanation: "Wetin YarnMe explain",
    alertPrefix: "YarnMe no fully sure about this part:",
    suggest: "Suggest clearer information",
    original: "See original",
    hideOriginal: "Hide original",
    sheetTitle: "How you go explain this one better?",
    yarnMeSaid: "YarnMe talk say",
    correctionLabel: "Your correction",
    correctionPlaceholder: "Type the corrected or clearer explanation...",
    send: "Send",
    thanks: "Thank you.",
    thanksBody: "You help YarnMe improve.",
    done: "Done",
    noReview: "No review needed",
    noReviewBody: "YarnMe no see unclear part for the latest yarn.",
    backToResult: "Back to result",
    goBack: "Go back",
    closeCorrectionSheet: "Close correction sheet",
    close: "Close",
  },
  hausa: {
    languageName: "Hausa",
    title: "A duba bayani",
    heading: "Wannan bangaren bai bayyana ba",
    intro: "Wasu bayanai ba su fito sarai daga ainihin rubutun ba.",
    snippet: "Bangaren rubutu",
    explanation: "Bayanin YarnMe",
    alertPrefix: "YarnMe bai da cikakken tabbaci game da wannan sashe:",
    suggest: "Ba da shawarar cikakken bayani",
    original: "Duba asali",
    hideOriginal: "Rufe asali",
    sheetTitle: "Yaya za ka bayyana wannan da kyau?",
    yarnMeSaid: "YarnMe ya ce",
    correctionLabel: "Naka gyara",
    correctionPlaceholder: "Rubuta gyara ko karin bayani...",
    send: "Aika",
    thanks: "Na gode.",
    thanksBody: "Ka taimaka wa YarnMe ya inganta.",
    done: "Kammala",
    noReview: "Babu bukatar dubawa",
    noReviewBody: "YarnMe bai ga wani bangare mara tabbas a sabon bayanin ba.",
    backToResult: "Koma zuwa sakamako",
    goBack: "Koma baya",
    closeCorrectionSheet: "Rufe shafin gyara",
    close: "Rufe",
  },
};

export function ReviewScreen() {
  const { analysisResult } = useYarnContext();
  const { settings } = useYarnSettings();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [correction, setCorrection] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const router = useRouter();

  const language = analysisResult?.language ?? settings.language;
  const activeCopy = copy[settings.language];
  const uncertainty = analysisResult?.analysis.uncertainties[0];

  function closeSheet() {
    setSheetOpen(false);
    setSubmitted(false);
    setCorrection("");
  }

  if (!analysisResult || !uncertainty) {
    return (
      <AppShell header="brand">
        <section className="flex min-h-[calc(100dvh-220px)] flex-col items-center justify-center py-xl text-center">
          <div className="mb-lg flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <CheckCircle2 aria-hidden="true" size={40} />
          </div>
          <h1 className="text-headline-lg-mobile text-primary">{activeCopy.noReview}</h1>
          <p className="mt-sm max-w-[320px] text-body-md text-on-surface-variant">
            {activeCopy.noReviewBody}
          </p>
          <Link
            href={analysisResult ? "/result" : "/"}
            className="touch-target mt-xl inline-flex items-center justify-center rounded-full bg-primary px-lg text-label-lg font-semibold text-on-primary shadow-button transition hover:bg-primary-container active:scale-95"
          >
            {activeCopy.backToResult}
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell header="none" mainClassName="max-w-[720px]">
      <header className="sticky top-0 z-40 -mx-container-margin flex items-center justify-between bg-background/95 px-container-margin py-md backdrop-blur">
        <button
          type="button"
          aria-label={activeCopy.goBack}
          onClick={() => router.push("/result")}
          className="touch-target flex items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-soft transition hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" size={25} />
        </button>
        <span className="inline-flex min-h-[48px] items-center gap-xs rounded-full border border-surface-container-high bg-surface-container-low px-md text-label-lg font-bold text-primary">
          <Languages aria-hidden="true" size={18} />
          {analysisLanguageLabels[language]}
        </span>
        <span className="touch-target" aria-hidden="true" />
      </header>

      <section className="pt-md">
        <span className="inline-flex items-center gap-xs rounded-full border border-secondary-container bg-secondary-container/75 px-sm py-xs text-label-sm font-bold text-on-secondary-container">
          <HelpCircle aria-hidden="true" size={16} />
          {activeCopy.title}
        </span>
        <div className="mt-lg rounded-2xl bg-secondary-container p-lg text-on-secondary-container shadow-card">
          <div className="flex items-start gap-md">
            <AlertTriangle aria-hidden="true" className="mt-1 shrink-0" size={28} />
            <p className="text-body-lg font-semibold leading-relaxed">{activeCopy.intro}</p>
          </div>
        </div>
      </section>

      <section className="mt-xl">
        <h1 className="text-headline-lg-mobile text-on-surface">{activeCopy.heading}</h1>
        <div className="mt-md rounded-2xl border-l-4 border-secondary-container bg-surface-container-lowest p-md shadow-card">
          <div className="rounded-xl border border-outline-variant/35 bg-surface p-md">
            <p className="mb-xs text-label-sm uppercase text-on-surface-variant">
              {activeCopy.snippet}
            </p>
            <p className="text-body-lg italic leading-relaxed text-on-surface">
              &quot;{uncertainty.text}&quot;
            </p>
          </div>

          <div className="mt-md flex items-start gap-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
              <HelpCircle aria-hidden="true" size={21} />
            </span>
            <p className="text-body-lg leading-relaxed text-on-surface">
              {activeCopy.alertPrefix} <strong>{uncertainty.reason}</strong>
            </p>
          </div>

          <div className="mt-md border-t border-outline-variant/30 pt-md">
            <p className="text-label-sm font-bold uppercase text-primary">
              {activeCopy.explanation}
            </p>
            <p className="mt-xs text-body-md italic text-on-surface-variant">
              &quot;{analysisResult.analysis.meaning}&quot;
            </p>
          </div>
        </div>
      </section>

      <section className="mt-xl grid gap-md pb-lg">
        <Button
          onClick={() => {
            setSubmitted(false);
            setSheetOpen(true);
          }}
          className="h-14 w-full text-label-lg"
        >
          <Pencil aria-hidden="true" size={20} />
          <span>{activeCopy.suggest}</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowOriginal((prev) => !prev)}
          className="h-14 w-full text-label-lg"
        >
          <Eye aria-hidden="true" size={20} />
          <span>{showOriginal ? activeCopy.hideOriginal : activeCopy.original}</span>
        </Button>

        {showOriginal ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft">
            <p className="mb-xs flex items-center gap-xs text-label-sm font-bold uppercase text-primary">
              <FileText aria-hidden="true" size={16} />
              {activeCopy.original}
            </p>
            <p className="whitespace-pre-wrap text-body-md italic text-on-surface">
              {analysisResult.sourceText}
            </p>
          </div>
        ) : null}
      </section>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label={activeCopy.closeCorrectionSheet}
            className="absolute inset-0 bg-[#121c2a]/62"
            onClick={closeSheet}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[90dvh] w-full max-w-[720px] overflow-hidden rounded-t-3xl bg-surface-container-lowest shadow-[0_-18px_50px_rgb(15_107_79_/_0.18)]">
            <div className="flex justify-center pb-2 pt-4">
              <div className="h-1.5 w-12 rounded-full bg-surface-container-highest" />
            </div>
            {!submitted ? (
              <div className="flex max-h-[calc(90dvh-24px)] flex-col gap-lg overflow-y-auto p-container-margin pt-2">
                <div className="flex items-center justify-between gap-md">
                  <h2 className="text-headline-md text-on-surface">{activeCopy.sheetTitle}</h2>
                  <button
                    type="button"
                    aria-label={activeCopy.close}
                    onClick={closeSheet}
                    className="touch-target flex shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition hover:bg-surface-container"
                  >
                    <X aria-hidden="true" size={22} />
                  </button>
                </div>

                <div>
                  <p className="text-label-sm font-bold uppercase text-on-surface-variant">
                    {activeCopy.yarnMeSaid}
                  </p>
                  <div className="mt-xs rounded-xl border border-outline-variant/30 bg-surface p-sm">
                    <p className="text-body-md text-on-surface-variant">
                      &quot;{analysisResult.analysis.meaning}&quot;
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm font-bold uppercase text-on-surface" htmlFor="correction">
                    {activeCopy.correctionLabel}
                  </label>
                  <textarea
                    id="correction"
                    value={correction}
                    onChange={(event) => setCorrection(event.target.value)}
                    className="yarn-input min-h-[180px] w-full resize-none rounded-2xl p-md text-body-lg text-on-surface"
                    spellCheck={false}
                    placeholder={activeCopy.correctionPlaceholder}
                  />
                </div>

                <Button
                  onClick={() => {
                    if (correction.trim()) setSubmitted(true);
                  }}
                  className="h-14 w-full"
                  disabled={!correction.trim()}
                >
                  {activeCopy.send}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-container-margin py-xl text-center">
                <div className="mx-auto mb-md flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <CheckCircle2 aria-hidden="true" size={44} />
                </div>
                <h2 className="mb-sm text-headline-md text-on-surface">{activeCopy.thanks}</h2>
                <p className="text-body-lg text-on-surface-variant">{activeCopy.thanksBody}</p>
                <Button variant="secondary" onClick={closeSheet} className="mt-lg h-14 w-full">
                  {activeCopy.done}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
