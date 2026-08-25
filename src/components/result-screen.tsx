"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/lib/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Copy,
  FileBadge,
  FileText,
  HelpCircle,
  Languages,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquarePlus,
  Pause,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Volume2,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { type LanguageCode } from "@/lib/analysis";
import { type NormalizedAnalysis } from "@/lib/analysis-normalization";
import { useYarnContext } from "@/lib/yarn-context";
import { devTestInputs } from "@/lib/dev-test-inputs";

const languageLabels: Record<LanguageCode, string> = {
  "simple-english": "Simple English",
  pidgin: "Pidgin",
  hausa: "Hausa",
};

const copy: Record<
  LanguageCode,
  {
    languageName: string;
    resultTitle: string;
    listen: string;
    stop: string;
    meaning: string;
    audience: string;
    eligibility: string;
    importantDate: string;
    warnings: string;
    actions: string;
    documents: string;
    legacyRequirements: string;
    payments: string;
    paymentAmount: string;
    paymentPurpose: string;
    paymentWhen: string;
    paymentWho: string;
    notStated: string;
    timeline: string;
    cost: string;
    reliability: string;
    noPayments: string;
    sourceClear: string;
    clear: string;
    clearBody: string;
    needsReview: string;
    understood: string;
    reviewTitle: string;
    reviewBody: string;
    reviewCta: string;
    sourceLimitations: string;
    incompleteWarning: string;
    original: string;
    copyBtn: string;
    questionTitle: string;
    questionBody: string;
    questionPlaceholder: string;
    questionOne: string;
    questionTwo: string;
    newYarn: string;
  }
> = {
  "simple-english": {
    languageName: "Simple English",
    resultTitle: "Here is what this notice says",
    listen: "Listen",
    stop: "Stop",
    meaning: "Main meaning",
    audience: "Who this concerns",
    eligibility: "Who can apply",
    importantDate: "Dates that matter",
    warnings: "Important things to know",
    actions: "What to do",
    documents: "What you need",
    legacyRequirements: "Other requirements",
    payments: "Payments",
    paymentAmount: "Amount",
    paymentPurpose: "Purpose",
    paymentWhen: "When",
    paymentWho: "Who",
    notStated: "Not stated",
    timeline: "Timeline",
    cost: "Cost",
    reliability: "Reliability",
    noPayments: "No payments needed",
    sourceClear: "Source clear",
    clear: "Clear",
    clearBody: "YarnMe did not find any unclear part that needs review.",
    needsReview: "Needs Review",
    understood: "What YarnMe understood",
    reviewTitle: "This part is not clear",
    reviewBody: "YarnMe found wording that may need a person to check before you act.",
    reviewCta: "Suggest clearer information",
    sourceLimitations: "What is not clear from the source",
    incompleteWarning:
      "Some parts of this information appear to be missing or cut off. YarnMe will not guess the missing details.",
    original: "See original information",
    copyBtn: "Copy explanation",
    questionTitle: "Still get question?",
    questionBody: "Ask YarnMe anything about this notice.",
    questionPlaceholder: "Type your question here...",
    questionOne: "What is the deadline?",
    questionTwo: "What should I do next?",
    newYarn: "Start new yarn",
  },
  pidgin: {
    languageName: "Pidgin",
    resultTitle: "Here’s wetin this notice dey talk",
    listen: "Listen",
    stop: "Stop",
    meaning: "Main meaning",
    audience: "Who e concern",
    eligibility: "Who fit apply",
    importantDate: "Dates wey matter",
    warnings: "Important thing to know",
    actions: "Wetin you go do",
    documents: "Wetin you need",
    legacyRequirements: "Other things wey the source require",
    payments: "Payment",
    paymentAmount: "Amount",
    paymentPurpose: "Purpose",
    paymentWhen: "When",
    paymentWho: "Who",
    notStated: "No dey stated",
    timeline: "Timeline",
    cost: "Cost",
    reliability: "Reliability",
    noPayments: "No payments needed",
    sourceClear: "Source clear",
    clear: "Clear",
    clearBody: "YarnMe no see any unclear part wey need review.",
    needsReview: "Needs Review",
    understood: "Wetin YarnMe understand",
    reviewTitle: "This part no clear",
    reviewBody: "YarnMe see wording wey fit need person to check before you act.",
    reviewCta: "Suggest clearer information",
    sourceLimitations: "Wetin the source no clear about",
    incompleteWarning:
      "Some parts of this information look like say dem cut off. YarnMe no go guess the missing details.",
    original: "See original information",
    copyBtn: "Copy explanation",
    questionTitle: "Still get question?",
    questionBody: "Ask me anything about this notice. I go try explain am better.",
    questionPlaceholder: "Type your question here...",
    questionOne: "When be deadline?",
    questionTwo: "Wetin I go do next?",
    newYarn: "Start new yarn",
  },
  hausa: {
    languageName: "Hausa",
    resultTitle: "Ga abin da wannan sanarwa take nufi",
    listen: "Saurara",
    stop: "Dakata",
    meaning: "Babban bayani",
    audience: "Wanda abin ya shafa",
    eligibility: "Wanda zai iya nema",
    importantDate: "Ranaku masu muhimmanci",
    warnings: "Abin lura",
    actions: "Abin da za ka yi",
    documents: "Abin da kake bukata",
    legacyRequirements: "Sauran bukatu",
    payments: "Biyan kudi",
    paymentAmount: "Adadi",
    paymentPurpose: "Dalili",
    paymentWhen: "Lokaci",
    paymentWho: "Waye",
    notStated: "Ba a bayyana ba",
    timeline: "Jadawali",
    cost: "Kudi",
    reliability: "Tabbaci",
    noPayments: "Ba a bukatar kudi",
    sourceClear: "Asali ya bayyana",
    clear: "Ya bayyana",
    clearBody: "YarnMe bai ga wani sashe da ke bukatar dubawa ba.",
    needsReview: "A duba",
    understood: "Abubuwan da aka fahimta",
    reviewTitle: "Wannan bangaren bai bayyana ba",
    reviewBody: "YarnMe ya ga wani rubutu da zai iya bukatar mutum ya tabbatar kafin ka dauki mataki.",
    reviewCta: "Ba da shawarar cikakken bayani",
    sourceLimitations: "Abin da asalin bai bayyana ba",
    incompleteWarning:
      "Wasu sassan wannan bayani suna kama da sun bata ko sun yanke. YarnMe ba zai hasashen bayanan da suka bata ba.",
    original: "Duba asalin bayani",
    copyBtn: "Kwafi bayani",
    questionTitle: "Kana da tambaya?",
    questionBody: "Tambayi YarnMe game da wannan sanarwa.",
    questionPlaceholder: "Rubuta tambayarka a nan...",
    questionOne: "Yaushe ne ranar karshe?",
    questionTwo: "Me zan yi yanzu?",
    newYarn: "Fara sabon bayani",
  },
};

function cleanDisplayItem(item: string) {
  return item
    .trim()
    .replace(/^(?:svg\s+)+/i, "")
    .replace(/^(?:(?:[-*•]|\d+[\).])\s+)+/, "")
    .trim();
}

function displayPaymentValue(value: string, fallback: string) {
  return cleanDisplayItem(value) || fallback;
}

function sourceAppearsIncomplete(analysis: NormalizedAnalysis) {
  const text = [
    ...analysis.sourceLimitations,
    ...analysis.uncertainties.map(
      (uncertainty) => `${uncertainty.text} ${uncertainty.reason}`,
    ),
  ]
    .join(" ")
    .toLowerCase();

  return /incomplete|cut off|truncated|missing|damaged|ocr|no complete|bai cika|yanke|bata/.test(
    text,
  );
}

export function ResultScreen() {
  const {
    analysisResult,
    isAnalyzing,
    switchLanguage,
    askQuestion,
    qaHistory,
    runAnalysis,
    resetAll,
    loadSample,
  } = useYarnContext();

  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [qaError, setQaError] = useState("");
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const router = useRouter();
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentLang = analysisResult?.language ?? "simple-english";
  const activeCopy = copy[currentLang];

  async function handleLanguageSwitch(newLang: LanguageCode) {
    if (!analysisResult || analysisResult.language === newLang || isSwitchingLang) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setLanguageMenuOpen(false);
    setIsSwitchingLang(true);
    try {
      await switchLanguage(newLang);
    } finally {
      setIsSwitchingLang(false);
    }
  }

  function toggleSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!analysisResult) return;

    window.speechSynthesis.cancel();

    const textToSpeak = [
      analysisResult.analysis.meaning,
      analysisResult.analysis.actions.length > 0
        ? `${activeCopy.actions}: ${analysisResult.analysis.actions.join(". ")}`
        : "",
    ]
      .filter(Boolean)
      .join(". ");

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    synthRef.current = utterance;
    utterance.lang = analysisResult.language === "hausa" ? "ha-NG" : "en-NG";
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function handleCopy() {
    if (!analysisResult) return;

    const { analysis } = analysisResult;
    const sections = [
      `${activeCopy.resultTitle} (${languageLabels[analysisResult.language]})`,
      `\n${activeCopy.meaning}:\n${analysis.meaning}`,
      analysis.audience ? `\n${activeCopy.audience}:\n${analysis.audience}` : "",
      analysis.actions.length > 0
        ? `\n${activeCopy.actions}:\n${analysis.actions.map((a, i) => `${i + 1}. ${cleanDisplayItem(a)}`).join("\n")}`
        : "",
      analysis.dates.length > 0
        ? `\n${activeCopy.importantDate}:\n${analysis.dates
            .map((d) => `${cleanDisplayItem(d.date)}: ${cleanDisplayItem(d.context)}`)
            .join("\n")}`
        : "",
      analysis.payments.length > 0
        ? `\n${activeCopy.payments}:\n${analysis.payments
            .map((p) => `${displayPaymentValue(p.amount, activeCopy.notStated)} - ${displayPaymentValue(p.purpose, activeCopy.notStated)}`)
            .join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(sections).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleAsk(questionText: string) {
    const trimmed = questionText.trim();
    if (!trimmed || isAsking || !analysisResult) return;

    setQaError("");
    setIsAsking(true);

    try {
      const answer = await askQuestion(trimmed);
      if (answer) {
        setFollowUpQuery("");
      } else {
        setQaError("YarnMe could not answer right now. Please try again.");
      }
    } catch {
      setQaError("Connection error. Please try again.");
    } finally {
      setIsAsking(false);
    }
  }

  async function handleLoadSample(index: number) {
    loadSample(index);
    router.push("/processing");
    await runAnalysis(devTestInputs[index].text, "simple-english");
    router.push("/result");
  }

  function handleStartNewYarn() {
    resetAll();
    router.push("/");
  }

  if (!analysisResult) {
    return (
      <AppShell header="brand">
        <section className="flex min-h-[calc(100dvh-220px)] flex-col items-center justify-center py-xl text-center">
          <div className="mb-md flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <Lightbulb aria-hidden="true" size={38} />
          </div>
          <h1 className="text-headline-lg-mobile text-primary">No notice explained yet</h1>
          <p className="mt-xs max-w-[320px] text-body-md text-on-surface-variant">
            Paste an official notice or pick an example below to see YarnMe in action.
          </p>
          <div className="mt-xl grid w-full max-w-sm gap-sm">
            <Button onClick={handleStartNewYarn} className="h-14 text-label-lg">
              <MessageSquarePlus aria-hidden="true" size={20} />
              <span>Paste a new notice</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleLoadSample(0)}
              className="h-14 text-label-lg"
            >
              Try sample notice
            </Button>
          </div>
        </section>
      </AppShell>
    );
  }

  const { analysis } = analysisResult;
  const hasUncertainties = analysis.uncertainties.length > 0;
  const hasAudience = analysis.audience.trim().length > 0;
  const hasIncompleteSource = sourceAppearsIncomplete(analysis);
  const hasPayments = analysis.payments.length > 0;
  const statusText = hasUncertainties ? activeCopy.needsReview : activeCopy.sourceClear;
  const costSummary = hasPayments
    ? analysis.payments
        .map((payment) => displayPaymentValue(payment.amount, activeCopy.notStated))
        .join(", ")
    : activeCopy.noPayments;
  const followUpPanel = (
    <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-card">
      <div className="text-center">
        <h2 className="text-headline-sm text-primary">{activeCopy.questionTitle}</h2>
        <p className="mx-auto mt-xs max-w-[300px] text-label-lg text-on-surface-variant">
          {activeCopy.questionBody}
        </p>
      </div>

      {qaHistory.length > 0 ? (
        <div className="mt-md space-y-sm">
          {qaHistory.map((item) => (
            <div key={item.id} className="space-y-xs">
              <div className="ml-auto max-w-[86%] rounded-2xl rounded-br-sm bg-primary px-md py-sm text-body-md text-on-primary">
                {item.question}
              </div>
              <div className="mr-auto max-w-[92%] rounded-2xl rounded-bl-sm border border-outline-variant/30 bg-surface p-sm text-body-md leading-relaxed text-on-surface shadow-soft">
                {item.answer}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {qaError ? <p className="mt-sm text-label-md text-error">{qaError}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleAsk(followUpQuery);
        }}
        className="relative mt-md"
      >
        <label className="sr-only" htmlFor="follow-up">
          {activeCopy.questionTitle}
        </label>
        <input
          id="follow-up"
          value={followUpQuery}
          onChange={(e) => setFollowUpQuery(e.target.value)}
          disabled={isAsking}
          className="yarn-input h-14 w-full rounded-full px-md pr-14 text-body-md"
          placeholder={activeCopy.questionPlaceholder}
          type="text"
        />
        <button
          type="submit"
          disabled={isAsking || !followUpQuery.trim()}
          aria-label="Send question"
          className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary transition hover:bg-primary-container disabled:opacity-50"
        >
          {isAsking ? <Loader2 className="animate-spin" size={18} /> : <Send aria-hidden="true" size={20} />}
        </button>
      </form>

      <div className="mt-sm flex flex-wrap gap-xs">
        {[activeCopy.questionOne, activeCopy.questionTwo].map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => void handleAsk(question)}
            disabled={isAsking}
            className="touch-target rounded-full border border-outline-variant bg-surface-container-lowest px-sm text-label-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <AppShell
      header="none"
      className="result-paper"
      mainClassName="max-w-none px-0"
    >
      <div className="mx-auto w-full max-w-[1180px] px-container-margin pb-xl pt-md lg:px-lg lg:pt-lg">
        <header className="mb-lg flex items-center justify-between gap-sm">
          <button
            type="button"
            aria-label="Back to Yarn"
            onClick={handleStartNewYarn}
            className="touch-target flex items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-soft transition hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" size={25} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setLanguageMenuOpen((open) => !open)}
              disabled={isSwitchingLang || isAnalyzing}
              className="touch-target inline-flex items-center gap-xs rounded-full border border-surface-container-high bg-surface-container-low px-md text-label-lg font-bold text-primary shadow-sm"
            >
              {isSwitchingLang ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <Languages aria-hidden="true" size={18} />
              )}
              <span>{activeCopy.languageName}</span>
              <ChevronDown aria-hidden="true" size={16} />
            </button>

            {languageMenuOpen ? (
              <div className="absolute left-1/2 top-[calc(100%+8px)] z-30 w-56 -translate-x-1/2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-xs shadow-card">
                {(["simple-english", "pidgin", "hausa"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => void handleLanguageSwitch(lang)}
                    className="flex min-h-[46px] w-full items-center justify-between rounded-xl px-sm text-left text-label-lg font-semibold text-on-surface transition hover:bg-surface-container-low"
                  >
                    <span>{languageLabels[lang]}</span>
                    {analysisResult.language === lang ? (
                      <Check aria-hidden="true" className="text-primary" size={18} />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title={activeCopy.copyBtn}
            className="touch-target flex items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-soft transition hover:bg-primary/5 active:scale-95"
          >
            {copied ? <Check aria-hidden="true" size={22} /> : <Copy aria-hidden="true" size={22} />}
          </button>
        </header>

        <div className="grid gap-xl lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <main className="min-w-0">
            <div className="mb-lg flex flex-wrap items-center gap-sm">
              <span
                className={[
                  "inline-flex items-center gap-xs rounded-full border px-sm py-xs text-label-sm font-bold",
                  hasUncertainties
                    ? "border-secondary-container bg-secondary-container/70 text-on-secondary-container"
                    : "border-primary-fixed-dim bg-primary-fixed/35 text-primary",
                ].join(" ")}
              >
                {hasUncertainties ? (
                  <HelpCircle aria-hidden="true" size={16} />
                ) : (
                  <ShieldCheck aria-hidden="true" size={16} />
                )}
                {statusText}
              </span>
            </div>

            {hasIncompleteSource ? (
              <section className="mb-xl rounded-2xl bg-secondary-container p-lg text-on-secondary-container shadow-card">
                <div className="flex items-start gap-md">
                  <AlertTriangle aria-hidden="true" className="mt-1 shrink-0" size={28} />
                  <p className="text-body-lg font-semibold leading-relaxed">
                    {activeCopy.incompleteWarning}
                  </p>
                </div>
              </section>
            ) : null}

            <section className="relative">
              <div className="flex items-start justify-between gap-md">
                <h1 className="max-w-[560px] text-headline-lg-mobile text-primary lg:text-headline-lg">
                  {activeCopy.resultTitle}
                </h1>
                <button
                  type="button"
                  onClick={toggleSpeech}
                  aria-label={isSpeaking ? activeCopy.stop : activeCopy.listen}
                  className={[
                    "touch-target flex shrink-0 items-center justify-center rounded-full shadow-soft transition active:scale-95",
                    isSpeaking
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary",
                  ].join(" ")}
                >
                  {isSpeaking ? <Pause aria-hidden="true" size={22} /> : <Volume2 aria-hidden="true" size={22} />}
                </button>
              </div>

              <p className="mt-md max-w-[700px] whitespace-pre-wrap text-body-lg leading-relaxed text-on-surface">
                {analysis.meaning}
              </p>
            </section>

            <section className="mt-xl grid gap-xs rounded-2xl bg-surface-container-lowest p-md shadow-card sm:grid-cols-3">
              <div className="flex gap-sm">
                <CalendarDays aria-hidden="true" className="shrink-0 text-primary" size={22} />
                <div>
                  <p className="text-label-sm uppercase text-on-surface-variant">{activeCopy.timeline}</p>
                  <p className="text-label-md text-on-surface">
                    {analysis.dates.length} {analysis.dates.length === 1 ? "important date" : "important dates"}
                  </p>
                </div>
              </div>
              <div className="flex gap-sm">
                <WalletCards aria-hidden="true" className="shrink-0 text-primary" size={22} />
                <div>
                  <p className="text-label-sm uppercase text-on-surface-variant">{activeCopy.cost}</p>
                  <p className="text-label-md text-on-surface">{costSummary}</p>
                </div>
              </div>
              <div className="flex gap-sm">
                <ShieldCheck aria-hidden="true" className="shrink-0 text-primary" size={22} />
                <div>
                  <p className="text-label-sm uppercase text-on-surface-variant">{activeCopy.reliability}</p>
                  <p className="text-label-md text-on-surface">{statusText}</p>
                </div>
              </div>
            </section>

            {hasUncertainties ? (
              <section className="mt-xl">
                <h2 className="text-headline-md text-on-surface">{activeCopy.reviewTitle}</h2>
                <div className="mt-md rounded-2xl border-l-4 border-secondary-container bg-surface-container-lowest p-md shadow-card">
                  <blockquote className="rounded-xl border border-outline-variant/35 bg-surface p-md text-body-lg italic text-on-surface-variant">
                    &quot;{analysis.uncertainties[0].text}&quot;
                  </blockquote>
                  <div className="mt-md flex items-start gap-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
                      <HelpCircle aria-hidden="true" size={21} />
                    </span>
                    <p className="text-body-lg leading-relaxed text-on-surface">
                      {activeCopy.reviewBody}{" "}
                      <strong>{analysis.uncertainties[0].reason}</strong>
                    </p>
                  </div>
                  <Link
                    href="/review"
                    className="touch-target mt-lg inline-flex w-full items-center justify-center gap-sm rounded-full border border-primary bg-surface-container-lowest px-lg text-label-lg font-bold text-primary transition hover:bg-primary/5"
                  >
                    <FileBadge aria-hidden="true" size={20} />
                    {activeCopy.reviewCta}
                  </Link>
                </div>
              </section>
            ) : null}

            <section className="mt-xl">
              <h2 className="text-headline-md text-on-surface">{activeCopy.understood}</h2>

              {analysis.actions.length > 0 ? (
                <div className="mt-md rounded-2xl bg-surface-container-lowest p-md shadow-card">
                  <h3 className="mb-md flex items-center gap-sm text-headline-sm text-on-surface">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
                      <ListChecks aria-hidden="true" size={21} />
                    </span>
                    {activeCopy.actions}
                  </h3>
                  <ol className="grid gap-sm">
                    {analysis.actions.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex items-start gap-sm">
                        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container text-label-sm font-bold text-on-secondary-container">
                          {index + 1}
                        </span>
                        <span className="text-body-lg leading-relaxed text-on-surface">
                          {cleanDisplayItem(item)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {analysis.payments.length > 0 || analysis.dates.length > 0 ? (
                <div className="mt-md grid gap-md sm:grid-cols-2">
                  {analysis.payments.map((payment, index) => (
                    <div
                      key={`${payment.amount}-${payment.purpose}-${index}`}
                      className="rounded-2xl bg-surface-container-lowest p-md shadow-card"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
                        <WalletCards aria-hidden="true" size={24} />
                      </span>
                      <p className="mt-md text-label-lg text-on-surface">{activeCopy.payments}</p>
                      <p className="mt-xs text-headline-md text-on-surface">
                        {displayPaymentValue(payment.amount, activeCopy.notStated)}
                      </p>
                      <dl className="mt-sm grid gap-xs text-body-sm text-on-surface-variant">
                        <div>
                          <dt className="font-semibold text-on-surface">{activeCopy.paymentPurpose}</dt>
                          <dd>{displayPaymentValue(payment.purpose, activeCopy.notStated)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-on-surface">{activeCopy.paymentWhen}</dt>
                          <dd>{displayPaymentValue(payment.when, activeCopy.notStated)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-on-surface">{activeCopy.paymentWho}</dt>
                          <dd>{displayPaymentValue(payment.who, activeCopy.notStated)}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}

                  {analysis.dates.map((item, index) => (
                    <div
                      key={`${item.date}-${item.context}-${index}`}
                      className="rounded-2xl bg-surface-container-lowest p-md shadow-card"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
                        <CalendarDays aria-hidden="true" size={24} />
                      </span>
                      <p className="mt-md text-label-lg text-on-surface">{activeCopy.importantDate}</p>
                      <p className="mt-xs text-headline-md text-on-surface">
                        {cleanDisplayItem(item.date)}
                      </p>
                      <p className="mt-xs text-body-sm text-on-surface-variant">
                        {cleanDisplayItem(item.context)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {(hasAudience ||
                analysis.eligibility.length > 0 ||
                analysis.documents.length > 0 ||
                analysis.legacyRequirements.length > 0) ? (
                <div className="mt-md rounded-2xl bg-surface-container-high p-md shadow-card">
                  {hasAudience ? (
                    <div>
                      <h3 className="flex items-center gap-sm text-headline-sm text-on-surface">
                        <UsersRound aria-hidden="true" className="text-primary" size={22} />
                        {activeCopy.audience}
                      </h3>
                      <p className="mt-sm text-body-lg text-on-surface">{analysis.audience}</p>
                    </div>
                  ) : null}

                  {analysis.eligibility.length > 0 ? (
                    <div className={hasAudience ? "mt-lg" : ""}>
                      <h3 className="text-headline-sm text-on-surface">{activeCopy.eligibility}</h3>
                      <div className="mt-sm flex flex-wrap gap-xs">
                        {analysis.eligibility.map((item, index) => (
                          <span
                            key={`${item}-${index}`}
                            className="rounded-full bg-result-background px-sm py-xs text-label-sm font-semibold text-primary"
                          >
                            {cleanDisplayItem(item)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {analysis.documents.length > 0 ? (
                    <div className={hasAudience || analysis.eligibility.length > 0 ? "mt-lg" : ""}>
                      <h3 className="text-headline-sm text-on-surface">{activeCopy.documents}</h3>
                      <ul className="mt-sm grid gap-xs">
                        {analysis.documents.map((item, index) => (
                          <li key={`${item}-${index}`} className="flex items-start gap-xs text-body-md text-on-surface">
                            <CheckCircle2 aria-hidden="true" className="mt-1 shrink-0 text-primary" size={18} />
                            <span>{cleanDisplayItem(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {analysis.legacyRequirements.length > 0 ? (
                    <div
                      className={
                        hasAudience || analysis.eligibility.length > 0 || analysis.documents.length > 0
                          ? "mt-lg"
                          : ""
                      }
                    >
                      <h3 className="text-headline-sm text-on-surface">
                        {activeCopy.legacyRequirements}
                      </h3>
                      <ul className="mt-sm grid gap-xs">
                        {analysis.legacyRequirements.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex items-start gap-xs text-body-md text-on-surface"
                          >
                            <ClipboardCheck
                              aria-hidden="true"
                              className="mt-1 shrink-0 text-primary"
                              size={18}
                            />
                            <span>{cleanDisplayItem(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {analysis.warnings.length > 0 ? (
                <div className="mt-md rounded-2xl border border-error/20 bg-error-container/70 p-md">
                  <h3 className="mb-sm flex items-center gap-sm text-headline-sm text-on-error-container">
                    <AlertTriangle aria-hidden="true" size={22} />
                    {activeCopy.warnings}
                  </h3>
                  <ul className="grid gap-xs text-body-md text-on-error-container">
                    {analysis.warnings.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-xs">
                        <span aria-hidden="true">-</span>
                        <span>{cleanDisplayItem(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {analysis.sourceLimitations.length > 0 ? (
                <div className="mt-md rounded-2xl bg-surface-container-lowest p-md shadow-card">
                  <h3 className="mb-sm flex items-center gap-sm text-headline-sm text-primary">
                    <AlertTriangle aria-hidden="true" size={22} />
                    {activeCopy.sourceLimitations}
                  </h3>
                  <ul className="grid gap-xs text-body-md text-on-surface-variant">
                    {analysis.sourceLimitations.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-xs">
                        <span aria-hidden="true">-</span>
                        <span>{cleanDisplayItem(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="mt-xl rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-soft">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between px-md py-md text-label-lg font-bold text-on-surface">
                  <span className="flex items-center gap-sm">
                    <FileText aria-hidden="true" size={20} />
                    {activeCopy.original}
                  </span>
                  <ChevronDown aria-hidden="true" className="transition group-open:rotate-180" size={22} />
                </summary>
                <div className="border-t border-outline-variant/30 p-md">
                  <p className="whitespace-pre-wrap rounded-xl bg-surface p-sm text-body-md italic text-on-surface-variant">
                    &quot;{analysisResult.sourceText}&quot;
                  </p>
                </div>
              </details>
            </section>

            <div className="mt-xl lg:hidden">{followUpPanel}</div>

            {hasUncertainties ? null : (
              <section className="mt-lg flex items-start gap-sm rounded-2xl border border-primary-fixed-dim bg-primary-fixed/30 p-md text-primary">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={22} />
                <div>
                  <h2 className="text-label-lg font-bold">{activeCopy.clear}</h2>
                  <p className="mt-1 text-body-md text-on-surface-variant">{activeCopy.clearBody}</p>
                </div>
              </section>
            )}

            <div className="mt-lg">
              <Button
                variant="secondary"
                onClick={handleStartNewYarn}
                className="h-14 w-full text-label-lg font-bold"
              >
                <MessageSquarePlus aria-hidden="true" size={20} />
                <span>{activeCopy.newYarn}</span>
              </Button>
            </div>
          </main>

          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <div className="space-y-md">
              <section className="rounded-2xl bg-surface-container-lowest p-lg shadow-card">
                <h2 className="mb-md flex items-center gap-sm text-headline-sm text-on-surface">
                  <ClipboardCheck aria-hidden="true" className="text-secondary" size={24} />
                  Insight Source
                </h2>
                <div className="grid gap-sm border-t border-surface-container-high pt-md text-body-md text-on-surface-variant">
                  <p>{statusText}</p>
                  <p>{analysisResult.model ? `Model: ${analysisResult.model}` : "Generated by YarnMe"}</p>
                </div>
              </section>
              {followUpPanel}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
