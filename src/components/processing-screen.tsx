"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useYarnContext } from "@/lib/yarn-context";
import { devTestInputs } from "@/lib/dev-test-inputs";

const messages = [
  "Reading your information…",
  "Finding what matters…",
  "Making it easier to understand…",
];

export function ProcessingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const router = useRouter();
  const {
    sourceText,
    language,
    isAnalyzing,
    analysisResult,
    error,
    setError,
    runAnalysis,
    loadSample,
  } = useYarnContext();

  const executedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 1450);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (analysisResult && !isAnalyzing) {
      router.push("/result");
      return;
    }

    if (!executedRef.current && sourceText.trim() && !isAnalyzing) {
      executedRef.current = true;
      runAnalysis(sourceText, language).then((success) => {
        if (success) {
          router.push("/result");
        }
      });
    }
  }, [analysisResult, isAnalyzing, sourceText, language, runAnalysis, router]);

  async function handleTrySample() {
    loadSample(0);
    executedRef.current = true;
    const success = await runAnalysis(devTestInputs[0].text, language);
    if (success) {
      router.push("/result");
    }
  }

  function handleBackHome() {
    setError(null);
    router.push("/");
  }

  const hasNoText = !sourceText.trim() && !isAnalyzing;

  return (
    <div className="ambient-pulse flex min-h-dvh flex-col overflow-hidden bg-background">
      <main className="mx-auto flex w-full max-w-[620px] flex-1 flex-col items-center justify-center px-container-margin py-xl">
        <div className="mb-xl flex w-full items-center gap-md rounded-2xl border border-surface-container-high bg-surface-container-lowest p-md shadow-card">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
            <FileText aria-hidden="true" size={32} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-lg font-bold text-on-surface">
              {sourceText ? "Information loaded" : "No information loaded"}
            </p>
            <p className="mt-xs flex items-center gap-xs text-label-lg text-on-surface-variant">
              {isAnalyzing ? (
                <Loader2 aria-hidden="true" className="animate-spin text-secondary" size={16} />
              ) : error ? (
                <AlertCircle aria-hidden="true" className="text-error" size={16} />
              ) : (
                <ShieldCheck aria-hidden="true" className="text-secondary" size={16} />
              )}
              <span>
                {isAnalyzing ? "Securely reviewing" : error ? "Needs attention" : "Securely encrypted"}
              </span>
            </p>
          </div>
          {!error && sourceText ? (
            <CheckCircle2 aria-hidden="true" className="shrink-0 text-primary-fixed-dim" size={30} />
          ) : null}
        </div>

        <div className="relative flex h-64 w-64 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-secondary-container/15 blur-2xl" />
          <svg className="relative h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle
              className="stroke-surface-container-high"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="4"
            />
            <circle
              className="progress-ring-circle stroke-secondary-container"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeLinecap="round"
              strokeWidth="5"
            />
          </svg>
          <div className="absolute flex h-32 w-32 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-card">
            <Sparkles aria-hidden="true" className="motion-safe:animate-pulse" size={54} />
          </div>
        </div>

        {error ? (
          <div className="mt-xl flex w-full flex-col items-center gap-md text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-error">
              <AlertCircle aria-hidden="true" size={30} />
            </div>
            <div>
              <h1 className="text-headline-md text-on-surface">Something did not work</h1>
              <p className="mt-xs text-body-md text-on-surface-variant">{error}</p>
            </div>
            <div className="grid w-full gap-sm">
              <Button
                variant="primary"
                className="h-14"
                onClick={() => {
                  executedRef.current = false;
                  void runAnalysis(sourceText, language).then((s) => s && router.push("/result"));
                }}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : "Try again"}
              </Button>
              <Button variant="secondary" className="h-14" onClick={handleBackHome}>
                Edit notice text
              </Button>
            </div>
          </div>
        ) : hasNoText ? (
          <div className="mt-xl flex w-full flex-col items-center gap-md text-center">
            <h1 className="text-headline-md text-on-surface">No notice found to explain</h1>
            <p className="text-body-md text-on-surface-variant">
              You can try a sample notice or go back to paste your own.
            </p>
            <div className="grid w-full gap-sm">
              <Button variant="primary" className="h-14" onClick={() => void handleTrySample()}>
                Try sample notice
              </Button>
              <Button variant="secondary" className="h-14" onClick={handleBackHome}>
                Paste your notice
              </Button>
            </div>
          </div>
        ) : (
          <section className="mt-xl text-center">
            <div className="flex min-h-[92px] items-center justify-center">
              <p className="text-headline-md text-on-surface transition">
                {messages[messageIndex]}
              </p>
            </div>
            <p className="mx-auto max-w-[320px] text-body-md text-on-surface-variant">
              YarnMe is reading only the information you sent and arranging it clearly.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
