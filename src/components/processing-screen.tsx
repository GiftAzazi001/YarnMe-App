"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { useYarnContext } from "@/lib/yarn-context";
import { devTestInputs } from "@/lib/dev-test-inputs";
import { type LanguageCode } from "@/lib/analysis";
import { useYarnSettings } from "@/lib/settings";

const processingCopy: Record<
  LanguageCode,
  {
    documentReceived: string;
    attention: string;
    noInformationLoaded: string;
    informationLoaded: string;
    pastedText: string;
    estimatedProgress: string;
    progressMessages: Array<{
      max: number;
      title: string;
      body: string;
    }>;
    trustNote: string;
    errorTitle: string;
    tryAgain: string;
    editNotice: string;
    noNoticeTitle: string;
    noNoticeBody: string;
    sampleNotice: string;
    pasteNotice: string;
  }
> = {
  "simple-english": {
    documentReceived: "Document received",
    attention: "Needs attention",
    noInformationLoaded: "No information loaded",
    informationLoaded: "Information loaded",
    pastedText: "Pasted text",
    estimatedProgress: "Estimated progress",
    progressMessages: [
      {
        max: 25,
        title: "Reading the notice",
        body: "Going through the document from beginning to end.",
      },
      {
        max: 60,
        title: "Checking important details",
        body: "Looking at the details and what you need to do next.",
      },
      {
        max: 85,
        title: "Making sense of it",
        body: "Organising the information that matters.",
      },
      {
        max: 99,
        title: "Getting your explanation ready",
        body: "Making everything clearer and easier to act on.",
      },
      {
        max: 100,
        title: "All done",
        body: "Your explanation is ready.",
      },
    ],
    trustNote: "YarnMe only explains what it can confirm from the source.",
    errorTitle: "Something did not work",
    tryAgain: "Try again",
    editNotice: "Edit notice text",
    noNoticeTitle: "No notice found to explain",
    noNoticeBody: "You can try a sample notice or go back to paste your own.",
    sampleNotice: "Try sample notice",
    pasteNotice: "Paste your notice",
  },
  pidgin: {
    documentReceived: "We don receive am",
    attention: "E need attention",
    noInformationLoaded: "No information dey loaded",
    informationLoaded: "Information don load",
    pastedText: "Text wey you paste",
    estimatedProgress: "How far we don go",
    progressMessages: [
      {
        max: 25,
        title: "We dey read am",
        body: "We dey check the notice from beginning reach end.",
      },
      {
        max: 60,
        title: "We dey check the important details",
        body: "We dey check wetin matter and wetin you need do next.",
      },
      {
        max: 85,
        title: "We dey make sense of am",
        body: "We dey arrange the important information.",
      },
      {
        max: 99,
        title: "We dey prepare your explanation",
        body: "We dey make everything clear and easy to follow.",
      },
      {
        max: 100,
        title: "Done",
        body: "Your explanation don ready.",
      },
    ],
    trustNote: "If the notice no talk am clearly, YarnMe no go guess.",
    errorTitle: "Something no work",
    tryAgain: "Try again",
    editNotice: "Edit the notice",
    noNoticeTitle: "No notice dey here to explain",
    noNoticeBody: "You fit try sample notice or go back paste your own.",
    sampleNotice: "Try sample notice",
    pasteNotice: "Paste your notice",
  },
  hausa: {
    documentReceived: "An karɓi takardar",
    attention: "Yana bukatar kulawa",
    noInformationLoaded: "Ba a shigar da bayani ba",
    informationLoaded: "An shigar da bayani",
    pastedText: "Rubutun da aka manna",
    estimatedProgress: "Kimanta ci gaba",
    progressMessages: [
      {
        max: 25,
        title: "Muna karanta takardar",
        body: "Muna duba bayanin daga farko har ƙarshe.",
      },
      {
        max: 60,
        title: "Muna duba muhimman bayanai",
        body: "Muna duba muhimman bayanai da abin da ake bukatar ka yi na gaba.",
      },
      {
        max: 85,
        title: "Muna fayyace bayanin",
        body: "Muna tsara muhimman bayanan da ke cikin takardar.",
      },
      {
        max: 99,
        title: "Muna shirya bayaninka",
        body: "Muna sauƙaƙa bayanin domin ya fi sauƙin fahimta.",
      },
      {
        max: 100,
        title: "An gama",
        body: "Bayaninka ya shirya.",
      },
    ],
    trustNote: "Idan babu bayani a takardar, YarnMe ba zai yi zato ba.",
    errorTitle: "Wani abu bai yi aiki ba",
    tryAgain: "Sake gwadawa",
    editNotice: "Gyara bayanin",
    noNoticeTitle: "Ba a sami sanarwar da za a bayyana ba",
    noNoticeBody: "Za ka iya gwada misali ko ka koma ka manna naka.",
    sampleNotice: "Gwada misali",
    pasteNotice: "Manna sanarwarka",
  },
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getNextEstimatedProgress(current: number, reducedMotion: boolean) {
  const motionFactor = reducedMotion ? 0.55 : 1;
  if (current < 20) return Math.min(20, current + 4.2 * motionFactor);
  if (current < 55) return Math.min(55, current + 2.4 * motionFactor);
  if (current < 80) return Math.min(80, current + 1.2 * motionFactor);
  if (current < 92) return Math.min(92, current + 0.55 * motionFactor);
  return Math.min(95, current + 0.16 * motionFactor);
}

export function ProcessingScreen() {
  const [progress, setProgress] = useState(7);
  const [isCompleting, setIsCompleting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const router = useRouter();
  const {
    sourceText,
    sourceImage,
    language,
    isAnalyzing,
    analysisResult,
    error,
    setError,
    runAnalysis,
    loadSample,
  } = useYarnContext();
  const { settings } = useYarnSettings();

  const executedRef = useRef(false);
  const completionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    function handleChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    return () => {
      if (completionTimerRef.current) {
        window.clearTimeout(completionTimerRef.current);
      }
    };
  }, []);

  const trimmedSourceText = sourceText.trim();
  const hasNoText = !trimmedSourceText && !sourceImage && !isAnalyzing;
  const hasSource = Boolean(trimmedSourceText || sourceImage);
  const existingResultMatchesCurrentSource = Boolean(
    analysisResult &&
      !sourceImage &&
      trimmedSourceText &&
      analysisResult.sourceText.trim() === trimmedSourceText &&
      analysisResult.language === language,
  );
  const hasExistingResultBeforeRun = Boolean(
    existingResultMatchesCurrentSource && !executedRef.current && !isAnalyzing,
  );
  const activeCopy = processingCopy[settings.language];
  const currentMessage =
    activeCopy.progressMessages.find((message) => progress <= message.max) ??
    activeCopy.progressMessages[activeCopy.progressMessages.length - 1];

  useEffect(() => {
    if (!hasSource || error || isCompleting || hasExistingResultBeforeRun) return;

    setProgress((current) => Math.max(current, 7));
    const timer = window.setInterval(() => {
      setProgress((current) => getNextEstimatedProgress(current, prefersReducedMotion));
    }, prefersReducedMotion ? 1200 : 650);

    return () => window.clearInterval(timer);
  }, [
    error,
    hasExistingResultBeforeRun,
    hasSource,
    isCompleting,
    prefersReducedMotion,
  ]);

  function completeAndNavigate() {
    setIsCompleting(true);
    setProgress(100);

    if (completionTimerRef.current) {
      window.clearTimeout(completionTimerRef.current);
    }

    completionTimerRef.current = window.setTimeout(
      () => {
        router.push("/result");
      },
      prefersReducedMotion ? 300 : 450,
    );
  }

  useEffect(() => {
    if (
      existingResultMatchesCurrentSource &&
      !isAnalyzing &&
      !executedRef.current
    ) {
      router.push("/result");
      return;
    }

    if (!executedRef.current && hasSource && !isAnalyzing) {
      executedRef.current = true;
      setProgress(7);
      setIsCompleting(false);
      runAnalysis(sourceText, language, sourceImage).then((success) => {
        if (success) {
          completeAndNavigate();
        }
      });
    }
  }, [
    existingResultMatchesCurrentSource,
    hasSource,
    isAnalyzing,
    sourceText,
    sourceImage,
    language,
    runAnalysis,
    router,
  ]);

  async function handleTrySample() {
    setProgress(7);
    setIsCompleting(false);
    loadSample(0);
    executedRef.current = true;
    const success = await runAnalysis(devTestInputs[0].text, language, null);
    if (success) {
      completeAndNavigate();
    }
  }

  function handleBackHome() {
    setError(null);
    router.push("/");
  }

  const sourceTitle = sourceImage
    ? sourceImage.name
    : trimmedSourceText
      ? activeCopy.informationLoaded
      : activeCopy.noInformationLoaded;
  const sourceMeta = sourceImage
    ? `${sourceImage.kind.toUpperCase()} · ${formatFileSize(sourceImage.size)}`
    : trimmedSourceText
      ? activeCopy.pastedText
      : "";
  const statusText = error
    ? activeCopy.attention
    : hasSource
      ? activeCopy.documentReceived
      : activeCopy.noInformationLoaded;

  return (
    <div className="ambient-pulse flex min-h-dvh flex-col overflow-hidden bg-background">
      <main className="mx-auto flex w-full max-w-[620px] flex-1 flex-col items-center justify-start px-container-margin py-lg sm:py-xl">
        <div className="mb-lg flex w-full items-center gap-sm rounded-2xl border border-surface-container-high bg-surface-container-lowest p-sm shadow-card sm:p-md">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-primary sm:h-16 sm:w-16">
            <FileText aria-hidden="true" size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-lg font-bold text-on-surface">
              {sourceTitle}
            </p>
            {sourceMeta ? (
              <p className="mt-0.5 truncate text-label-md text-on-surface-variant">
                {sourceMeta}
              </p>
            ) : null}
            <p className="mt-xs flex items-center gap-xs text-label-md text-on-surface-variant">
              {error ? (
                <AlertCircle aria-hidden="true" className="text-error" size={16} />
              ) : (
                <ShieldCheck aria-hidden="true" className="text-secondary" size={16} />
              )}
              <span>
                {statusText}
              </span>
            </p>
          </div>
          {!error && hasSource ? (
            <CheckCircle2 aria-hidden="true" className="shrink-0 text-primary-fixed-dim" size={30} />
          ) : null}
        </div>

        <AnimatedCircularProgressBar
          value={progress}
          label={activeCopy.estimatedProgress}
          ariaLabel={activeCopy.estimatedProgress}
          className="mb-md"
        />

        {error ? (
          <div className="mt-sm flex w-full flex-col items-center gap-md text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-error">
              <AlertCircle aria-hidden="true" size={30} />
            </div>
            <div>
              <h1 className="text-headline-md text-on-surface">{activeCopy.errorTitle}</h1>
              <p className="mt-xs text-body-md text-on-surface-variant">{error}</p>
            </div>
            <div className="grid w-full gap-sm">
              <Button
                variant="primary"
                className="h-14"
                onClick={() => {
                  setProgress(7);
                  setIsCompleting(false);
                  executedRef.current = true;
                  void runAnalysis(sourceText, language, sourceImage).then((success) => {
                    if (success) {
                      completeAndNavigate();
                    }
                  });
                }}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : activeCopy.tryAgain}
              </Button>
              <Button variant="secondary" className="h-14" onClick={handleBackHome}>
                {activeCopy.editNotice}
              </Button>
            </div>
          </div>
        ) : hasNoText ? (
          <div className="mt-sm flex w-full flex-col items-center gap-md text-center">
            <h1 className="text-headline-md text-on-surface">{activeCopy.noNoticeTitle}</h1>
            <p className="text-body-md text-on-surface-variant">
              {activeCopy.noNoticeBody}
            </p>
            <div className="grid w-full gap-sm">
              <Button variant="primary" className="h-14" onClick={() => void handleTrySample()}>
                {activeCopy.sampleNotice}
              </Button>
              <Button variant="secondary" className="h-14" onClick={handleBackHome}>
                {activeCopy.pasteNotice}
              </Button>
            </div>
          </div>
        ) : (
          <section className="w-full text-center">
            <h1 className="text-headline-md text-primary">{currentMessage.title}</h1>
            <p className="mx-auto mt-xs max-w-[420px] text-body-md leading-relaxed text-on-surface-variant">
              {currentMessage.body}
            </p>

            <p className="mx-auto mt-sm max-w-[440px] text-label-md leading-relaxed text-on-surface-variant">
              {activeCopy.trustNote}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
