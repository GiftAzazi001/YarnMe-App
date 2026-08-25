"use client";

import { useRef, useState } from "react";
import { useRouter } from "@/lib/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  CloudUpload,
  FileCheck,
  FolderOpen,
  GraduationCap,
  Loader2,
  Lock,
  Megaphone,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { type LanguageCode } from "@/lib/analysis";
import { useYarnContext } from "@/lib/yarn-context";
import { devTestInputs } from "@/lib/dev-test-inputs";

const languages: Array<{
  label: string;
  value: LanguageCode;
}> = [
  { label: "Simple English", value: "simple-english" },
  { label: "Pidgin", value: "pidgin" },
  { label: "Hausa", value: "hausa" },
];

const examples = [
  { label: "Scholarship notice", icon: GraduationCap, index: 1, tone: "mint" },
  { label: "Government application", icon: BriefcaseBusiness, index: 0, tone: "amber" },
  { label: "School announcement", icon: Megaphone, index: 2, tone: "blue" },
];

export function HomeScreen() {
  const {
    sourceText,
    setSourceText,
    language,
    setLanguage,
    isAnalyzing,
    error,
    setError,
    runAnalysis,
  } = useYarnContext();

  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  function handleUseExample(index: number) {
    const selected = devTestInputs[index] || devTestInputs[0];
    setSourceText(selected.text);
    setUploadedFileName(null);
    setMode("paste");
    setError(null);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    setError(null);
    setUploadedFileName(file.name);

    if (
      file.type.startsWith("text/") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".csv")
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || "";
        setSourceText(content);
        setIsReadingFile(false);
        setMode("paste");
      };
      reader.onerror = () => {
        setError("Could not read this file. Please paste the text instead.");
        setIsReadingFile(false);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setSourceText(
          `[Uploaded Document: ${file.name}]\nPlease explain the requirements, dates, fees, and instructions from this notice.`,
        );
        setIsReadingFile(false);
        setMode("paste");
      };
      reader.onerror = () => {
        setError("Could not read this file. Please paste the text instead.");
        setIsReadingFile(false);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleStartYarn() {
    const trimmed = sourceText.trim();
    if (!trimmed) {
      setError("Please paste your notice first, or tap one of the examples below.");
      if (mode !== "paste") setMode("paste");
      window.setTimeout(() => textareaRef.current?.focus(), 0);
      return;
    }

    setError(null);
    router.push("/processing");
    const success = await runAnalysis(trimmed, language);
    if (success) {
      router.push("/result");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleStartYarn();
    }
  }

  const uploadCard = (
    <div className="space-y-md">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex min-h-[330px] cursor-pointer flex-col items-center justify-center gap-md rounded-2xl border-2 border-dashed border-primary-fixed-dim bg-surface/55 px-lg py-xl text-center transition hover:bg-primary-fixed/15"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.pdf,.png,.jpg,.jpeg,.doc,.docx"
          className="hidden"
        />
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-on-primary shadow-button">
          {isReadingFile ? (
            <Loader2 className="animate-spin" size={42} />
          ) : (
            <CloudUpload aria-hidden="true" size={44} />
          )}
        </div>
        <div>
          <p className="text-headline-md text-on-surface">Drop your document here</p>
          <p className="mt-xs text-body-lg text-on-surface-variant">
            PDF, JPG or PNG up to 10MB
          </p>
        </div>
        <Button
          variant="primary"
          className="h-14 px-xl text-label-lg"
          disabled={isReadingFile}
        >
          <FolderOpen aria-hidden="true" size={22} />
          <span>{isReadingFile ? "Reading..." : "Browse files"}</span>
        </Button>
      </div>

      {uploadedFileName ? (
        <div className="flex items-center gap-md rounded-2xl border border-surface-container-high bg-surface-container-lowest p-md shadow-soft">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-error-container text-error">
            <FileCheck aria-hidden="true" size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-lg font-bold text-on-surface">
              {uploadedFileName}
            </p>
            <p className="text-body-md text-on-surface-variant">Ready to review</p>
          </div>
          <button
            type="button"
            aria-label="Remove uploaded file"
            onClick={() => {
              setUploadedFileName(null);
              setSourceText("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="touch-target flex items-center justify-center rounded-full text-on-surface transition hover:bg-surface-container hover:text-error"
          >
            <Trash2 aria-hidden="true" size={24} />
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <AppShell
      header="brand"
      className="lg:bg-result-background"
      mainClassName="lg:max-w-none lg:px-0"
    >
      <div className="mx-auto w-full max-w-[720px] pb-xl pt-lg lg:grid lg:min-h-[calc(100dvh-72px)] lg:max-w-[1180px] lg:grid-cols-[1fr_560px] lg:items-center lg:gap-xl lg:px-lg lg:py-xl">
        <section className="lg:max-w-[560px]">
          <div className="hidden lg:mb-xl lg:flex lg:items-center">
            <div className="flex -space-x-3">
              <span className="h-14 w-14 rounded-full border-4 border-result-background bg-primary-fixed" />
              <span className="h-14 w-14 rounded-full border-4 border-result-background bg-surface-container-high" />
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-result-background bg-surface-container-highest text-label-lg font-bold text-on-surface-variant">
                +5k
              </span>
            </div>
            <span className="ml-md text-label-lg uppercase text-on-surface-variant">
              People yarning daily
            </span>
          </div>

          <h1 className="text-[40px] font-extrabold leading-[1.08] text-on-surface lg:text-[64px] lg:leading-[1.05] lg:text-primary">
            {mode === "upload" ? "What are we reviewing?" : "Wetin you no understand?"}
          </h1>
          <p className="mt-sm text-body-lg text-on-surface-variant lg:text-[28px] lg:leading-[38px]">
            {mode === "upload"
              ? "Upload a document for intelligent analysis."
              : "Drop am here. YarnMe go break am down."}
          </p>
        </section>

        <section className="mt-xl lg:mt-0">
          <div
            className={[
              mode === "paste"
                ? "rounded-2xl bg-surface-container-lowest p-md shadow-card"
                : "space-y-xl",
              "lg:rounded-2xl lg:bg-surface-container-lowest lg:p-xl lg:shadow-card",
            ].join(" ")}
          >
            <div
              className={[
                mode === "paste"
                  ? "mb-md flex border-b border-surface-container-highest"
                  : "mb-xl grid grid-cols-2 rounded-full bg-surface-container-high p-1",
                "lg:mb-lg lg:inline-grid lg:grid-cols-2 lg:rounded-xl lg:bg-surface-container-low lg:p-1",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={[
                  mode === "paste"
                    ? "border-b-2 border-primary text-primary"
                    : "border-b-2 border-transparent text-on-surface-variant",
                  "min-h-[52px] px-md text-label-lg font-bold transition lg:rounded-lg lg:border-b-0",
                  mode === "paste" ? "lg:bg-surface-container-lowest lg:shadow-sm" : "",
                ].join(" ")}
              >
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={[
                  mode === "upload"
                    ? "bg-primary text-on-primary shadow-button"
                    : "text-on-surface-variant",
                  "min-h-[52px] rounded-full px-md text-label-lg font-bold transition lg:rounded-lg",
                ].join(" ")}
              >
                Upload document
              </button>
            </div>

            {mode === "paste" ? (
              <>
                <label className="sr-only" htmlFor="yarn-input">
                  Paste the information
                </label>
                <textarea
                  id="yarn-input"
                  ref={textareaRef}
                  value={sourceText}
                  onChange={(event) => {
                    setSourceText(event.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste the information you want YarnMe to explain..."
                  className={`yarn-input min-h-[214px] w-full resize-none rounded-xl p-md text-body-lg text-on-surface placeholder:text-on-surface-variant/55 lg:min-h-[310px] ${
                    error ? "border-error focus:border-error" : ""
                  }`}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "yarn-input-error" : undefined}
                />

                <div className="mt-lg">
                  <p className="mb-sm text-label-lg text-on-surface">
                    Make am clear in
                  </p>
                  <div className="flex flex-wrap gap-xs">
                    {languages.map((item) => {
                      const isSelected = language === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setLanguage(item.value)}
                          aria-pressed={isSelected}
                          className={[
                            "touch-target rounded-full border px-md text-label-lg transition active:scale-95",
                            isSelected
                              ? "border-primary bg-primary text-on-primary shadow-button"
                              : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:text-primary",
                          ].join(" ")}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              uploadCard
            )}

            {uploadedFileName && mode === "paste" ? (
              <div className="mt-sm flex items-center justify-between rounded-xl bg-surface-container-low px-sm py-xs text-label-sm text-on-surface">
                <span className="flex min-w-0 items-center gap-xs truncate">
                  <FileCheck aria-hidden="true" size={16} className="shrink-0 text-primary" />
                  Loaded: {uploadedFileName}
                </span>
                <button
                  type="button"
                  aria-label="Clear uploaded text"
                  onClick={() => {
                    setUploadedFileName(null);
                    setSourceText("");
                  }}
                  className="rounded-full p-1 text-on-surface-variant hover:bg-error/10 hover:text-error"
                >
                  <X aria-hidden="true" size={16} />
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="mt-md rounded-xl border border-error/20 bg-error-container/70 p-sm">
                <p id="yarn-input-error" className="text-label-md text-on-error-container">
                  {error}
                </p>
              </div>
            ) : null}

            <Button
              onClick={() => void handleStartYarn()}
              disabled={isAnalyzing || isReadingFile}
              className="mt-xl h-[74px] w-full text-headline-sm font-bold"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={26} />
                  <span>Yarning...</span>
                </>
              ) : (
                <>
                  <span>{mode === "upload" ? "Start Yarning" : "Yarn am"}</span>
                  {mode === "upload" ? (
                    <Sparkles aria-hidden="true" size={24} />
                  ) : (
                    <ArrowRight aria-hidden="true" size={30} />
                  )}
                </>
              )}
            </Button>
          </div>
        </section>

        <section className="mt-xl lg:col-span-2 lg:mt-0 lg:max-w-[560px]">
          <h2 className="mb-md text-label-lg uppercase text-on-surface-variant">
            Try One
          </h2>
          <div className="grid gap-md lg:grid-cols-3">
            {examples.map((example) => {
              const Icon = example.icon;
              const tone =
                example.tone === "amber"
                  ? "bg-secondary-fixed text-on-secondary-fixed"
                  : example.tone === "mint"
                    ? "bg-primary-fixed text-primary"
                    : "bg-surface-container-high text-primary";

              return (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => handleUseExample(example.index)}
                  className="flex min-h-[100px] items-center gap-md rounded-2xl bg-surface-container-low p-md text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-container active:translate-y-0 lg:min-h-[88px]"
                >
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tone}`}>
                    <Icon aria-hidden="true" size={24} strokeWidth={2.2} />
                  </span>
                  <span className="text-body-lg font-bold text-on-surface">
                    {example.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mx-auto mt-xl flex max-w-[380px] items-center justify-center gap-md text-center text-label-lg text-on-surface-variant lg:mx-0 lg:justify-start">
            <Lock aria-hidden="true" size={18} />
            <span>Your information is only used to explain what you send.</span>
          </p>
        </section>
      </div>
    </AppShell>
  );
}
