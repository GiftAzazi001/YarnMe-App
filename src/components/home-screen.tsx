"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/navigation";
import {
  BriefcaseBusiness,
  CloudUpload,
  FileCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  Loader2,
  Lock,
  Megaphone,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import {
  IMAGE_UPLOAD_MAX_BYTES,
  PDF_UPLOAD_MAX_BYTES,
  supportedPdfMimeTypes,
} from "@/lib/analysis";
import {
  useYarnContext,
  type SourceImageInput,
} from "@/lib/yarn-context";
import { useYarnSettings } from "@/lib/settings";
import { devTestInputs } from "@/lib/dev-test-inputs";
import {
  analysisLanguageOptions,
  appCopy,
} from "@/lib/app-copy";

const examples = [
  { key: "scholarship" as const, icon: GraduationCap, index: 1, tone: "mint" },
  { key: "government" as const, icon: BriefcaseBusiness, index: 0, tone: "amber" },
  { key: "school" as const, icon: Megaphone, index: 2, tone: "blue" },
];

const uploadLimitMb = Math.floor(IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024));

function getUploadDetails(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type.trim().toLowerCase();
  const pdfMimeTypes = supportedPdfMimeTypes as readonly string[];
  const hasNoMimeType = mimeType.length === 0;

  if (extension === "png") {
    if (!hasNoMimeType && mimeType !== "image/png") return null;
    return {
      kind: "image" as const,
      mimeType: "image/png",
      maxBytes: IMAGE_UPLOAD_MAX_BYTES,
    };
  }
  if (extension === "jpg" || extension === "jpeg") {
    if (!hasNoMimeType && mimeType !== "image/jpeg" && mimeType !== "image/jpg") {
      return null;
    }
    return {
      kind: "image" as const,
      mimeType: "image/jpeg",
      maxBytes: IMAGE_UPLOAD_MAX_BYTES,
    };
  }
  if (extension === "webp") {
    if (!hasNoMimeType && mimeType !== "image/webp") return null;
    return {
      kind: "image" as const,
      mimeType: "image/webp",
      maxBytes: IMAGE_UPLOAD_MAX_BYTES,
    };
  }
  if (extension === "pdf") {
    if (!hasNoMimeType && !pdfMimeTypes.includes(mimeType)) return null;
    return {
      kind: "pdf" as const,
      mimeType: "application/pdf",
      maxBytes: PDF_UPLOAD_MAX_BYTES,
    };
  }
  return null;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

export function HomeScreen() {
  const {
    sourceText,
    setSourceText,
    sourceImage,
    setSourceImage,
    language,
    setLanguage,
    isAnalyzing,
    analysisResult,
    error,
    setError,
    setAnalysisResult,
    resetAll,
  } = useYarnContext();
  const { settings } = useYarnSettings();
  const activeCopy = appCopy[settings.language].home;

  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLanguage(settings.language);
  }, [settings.language, setLanguage]);

  useEffect(() => {
    if (!analysisResult || isAnalyzing) {
      return;
    }

    const resultSourceText = analysisResult.sourceText.trim();
    const currentSourceText = sourceText.trim();
    const homeIsShowingPreviousResult =
      sourceImage !== null ||
      (resultSourceText.length > 0 && currentSourceText === resultSourceText);

    if (homeIsShowingPreviousResult) {
      resetAll();
    }
  }, [analysisResult, isAnalyzing, resetAll, sourceImage, sourceText]);

  useEffect(() => {
    if (!sourceImage || sourceImage.kind !== "image") {
      setImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(sourceImage.file);
    setImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [sourceImage]);

  function handleUseExample(index: number) {
    const selected = devTestInputs[index] || devTestInputs[0];
    setSourceText(selected.text);
    setSourceImage(null);
    setMode("paste");
    setError(null);
    setAnalysisResult(null);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    handleSelectedImage(file);
  }

  function handleSelectedImage(file: File) {
    const uploadDetails = getUploadDetails(file);
    setError(null);

    if (!uploadDetails) {
      setSourceImage(null);
      setError(activeCopy.errors.unsupportedFile);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size <= 0) {
      setSourceImage(null);
      setError(activeCopy.errors.unreadableFile);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > uploadDetails.maxBytes) {
      setSourceImage(null);
      setError(activeCopy.errors.fileTooLarge(uploadLimitMb));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const imageInput: SourceImageInput = {
      file,
      kind: uploadDetails.kind,
      name: file.name || "uploaded-image",
      mimeType: uploadDetails.mimeType,
      size: file.size,
    };

    setAnalysisResult(null);
    setSourceImage(imageInput);
    setSourceText("");
    setMode("upload");
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingImage(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleSelectedImage(file);
  }

  function clearSelectedImage() {
    setSourceImage(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleStartYarn() {
    const trimmed = sourceText.trim();
    if (mode === "upload") {
      if (!sourceImage) {
        setError(activeCopy.errors.uploadRequired);
        return;
      }

      setError(null);
      setAnalysisResult(null);
      router.push("/processing");
      return;
    }

    if (!trimmed) {
      setError(activeCopy.errors.pasteRequired);
      if (mode !== "paste") setMode("paste");
      window.setTimeout(() => textareaRef.current?.focus(), 0);
      return;
    }

    setError(null);
    setSourceText(trimmed);
    setSourceImage(null);
    setAnalysisResult(null);
    router.push("/processing");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleStartYarn();
    }
  }

  const languageSelector = (
    <div className="mt-sm md:mt-md">
      <p className="mb-xs text-label-lg text-on-surface">
        {activeCopy.explainIn}
      </p>
      <div className="flex flex-wrap gap-xs sm:gap-sm">
        {analysisLanguageOptions.map((item) => {
          const isSelected = language === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setLanguage(item.value)}
              aria-pressed={isSelected}
              className={[
                "min-h-[44px] rounded-full border px-md text-label-lg transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none motion-reduce:active:scale-100",
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
  );

  const uploadCard = (
    <div className="space-y-md">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingImage(true);
        }}
        onDragLeave={() => setIsDraggingImage(false)}
        onDrop={handleDrop}
        className={[
          "flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-md rounded-2xl border-2 border-dashed px-md py-lg text-center transition md:min-h-[250px] md:px-lg lg:min-h-[260px]",
          isDraggingImage
            ? "border-primary bg-primary-fixed/25"
            : "border-primary-fixed-dim bg-surface/55 hover:bg-primary-fixed/15",
        ].join(" ")}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
        />

        {sourceImage ? (
          <div className="w-full space-y-md">
            {sourceImage.kind === "image" && imagePreviewUrl ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-container-low">
                <Image
                  src={imagePreviewUrl}
                  alt={activeCopy.imagePreviewAlt(sourceImage.name)}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 500px, 90vw"
                  className="object-contain p-sm"
                />
              </div>
            ) : (
              <div className="flex min-h-[170px] w-full flex-col items-center justify-center rounded-xl bg-surface-container-low px-md py-lg md:min-h-[190px]">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-primary-fixed text-primary md:h-20 md:w-20">
                  <FileText aria-hidden="true" size={42} />
                </div>
                <p className="mt-md text-headline-sm text-on-surface">
                  {activeCopy.pdfDocument}
                </p>
                <p className="mt-xs max-w-full truncate text-body-md text-on-surface-variant">
                  {sourceImage.name}
                </p>
              </div>
            )}
            <div className="flex items-center gap-md rounded-2xl border border-surface-container-high bg-surface-container-lowest p-md text-left shadow-soft">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
                {sourceImage.kind === "pdf" ? (
                  <FileText aria-hidden="true" size={28} />
                ) : (
                  <FileCheck aria-hidden="true" size={28} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-lg font-bold text-on-surface">
                  {sourceImage.name}
                </p>
                <p className="text-body-md text-on-surface-variant">
                  {activeCopy.fileTypes[sourceImage.kind]} - {formatFileSize(sourceImage.size)} {activeCopy.ready}
                </p>
              </div>
              <button
                type="button"
                aria-label={activeCopy.removeUploadedFile}
                onClick={(event) => {
                  event.stopPropagation();
                  clearSelectedImage();
                }}
                className="touch-target flex items-center justify-center rounded-full text-on-surface transition hover:bg-surface-container hover:text-error"
              >
                <Trash2 aria-hidden="true" size={24} />
              </button>
            </div>
              <Button
                variant="secondary"
                className="h-12 w-full text-label-lg"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
              >
                <FolderOpen aria-hidden="true" size={20} />
                <span>{activeCopy.replaceFile}</span>
              </Button>
            </div>
          ) : (
            <>
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary text-on-primary shadow-button md:h-20 md:w-20">
              <CloudUpload aria-hidden="true" size={38} />
            </div>
            <div>
              <p className="text-headline-sm text-on-surface md:text-headline-md">
                {activeCopy.uploadTitle}
              </p>
              <p className="mt-xs text-body-md text-on-surface-variant md:text-body-lg">
                {activeCopy.uploadSubtitle}
              </p>
            </div>
            <Button
              variant="primary"
              className="h-12 px-lg text-label-lg md:h-14 md:px-xl"
            >
              <FolderOpen aria-hidden="true" size={22} />
              <span>{activeCopy.browseFiles}</span>
            </Button>
          </>
        )}
      </div>

      {languageSelector}
    </div>
  );

  return (
    <AppShell
      header="brand"
      className="bg-result-background"
      mainClassName="md:max-w-[850px] lg:max-w-none lg:px-0"
    >
      <div className="mx-auto w-full pb-xl pt-md md:pb-xl md:pt-md lg:grid lg:min-h-[calc(100dvh-76px)] lg:max-w-[1240px] lg:grid-cols-[minmax(0,0.82fr)_minmax(520px,1.18fr)] lg:items-center lg:gap-lg lg:px-lg lg:py-lg xl:max-w-[1280px]">
        <section className="py-sm md:py-lg lg:max-w-[520px] lg:-translate-y-[104px] lg:py-0">
          <p className="home-hero-enter text-label-sm font-bold uppercase text-on-surface-variant">
            {activeCopy.eyebrow}
          </p>
          <h1 className="home-hero-enter home-hero-enter-delay-1 mt-xs max-w-[340px] text-[38px] font-extrabold leading-[1.08] text-primary md:mt-sm md:max-w-[720px] md:text-[52px] md:leading-[1.04] lg:max-w-[520px] lg:text-[64px] lg:leading-[1.02]">
            {activeCopy.heading}
          </h1>
          <p className="home-hero-enter home-hero-enter-delay-2 mt-xs max-w-[620px] text-body-lg text-on-surface-variant md:mt-sm md:text-[20px] md:leading-[30px] lg:max-w-[500px] lg:text-[24px] lg:leading-[34px]">
            {activeCopy.supporting}
          </p>
          <p className="home-hero-enter home-hero-enter-delay-2 mt-sm hidden max-w-[520px] text-body-lg text-on-surface-variant lg:block">
            {activeCopy.desktopSupporting}
          </p>
          <p className="home-hero-enter home-hero-enter-delay-3 mt-sm text-label-lg font-bold text-primary md:mt-md">
            {activeCopy.languageLine}
          </p>
        </section>

        <section className="lg:mt-0">
          <div className="home-card-enter rounded-2xl bg-surface-container-lowest p-sm shadow-card md:p-md lg:p-xl">
            <div className="mb-md grid grid-cols-2 rounded-full bg-surface-container-high p-1 lg:mb-lg lg:rounded-xl lg:bg-surface-container-low">
              <button
                type="button"
                onClick={() => setMode("paste")}
                aria-pressed={mode === "paste"}
                className={[
                  mode === "paste"
                    ? "bg-primary text-on-primary shadow-button"
                    : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary",
                  "min-h-[48px] rounded-full px-md text-label-lg font-bold transition duration-200 ease-out hover:-translate-y-px hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none motion-reduce:active:scale-100 lg:rounded-lg",
                ].join(" ")}
              >
                {activeCopy.pasteTab}
              </button>
              <button
                type="button"
                onClick={() => setMode("upload")}
                aria-pressed={mode === "upload"}
                className={[
                  mode === "upload"
                    ? "bg-primary text-on-primary shadow-button"
                    : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary",
                  "min-h-[48px] rounded-full px-md text-label-lg font-bold transition duration-200 ease-out hover:-translate-y-px hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none motion-reduce:active:scale-100 lg:rounded-lg",
                ].join(" ")}
              >
                {activeCopy.uploadTab}
              </button>
            </div>

            {mode === "paste" ? (
              <>
                <label className="sr-only" htmlFor="yarn-input">
                  {activeCopy.textareaLabel}
                </label>
                <textarea
                  id="yarn-input"
                  ref={textareaRef}
                  value={sourceText}
                  onChange={(event) => {
                    setSourceText(event.target.value);
                    setSourceImage(null);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={activeCopy.textareaPlaceholder}
                  className={`yarn-input min-h-[176px] w-full resize-y rounded-xl p-md text-body-lg text-on-surface placeholder:text-on-surface-variant/55 md:min-h-[210px] lg:min-h-[240px] ${
                    error ? "border-error focus:border-error" : ""
                  }`}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "yarn-input-error" : undefined}
                />

                {languageSelector}
              </>
            ) : (
              uploadCard
            )}

            {error ? (
              <div className="mt-md rounded-xl border border-error/20 bg-error-container/70 p-sm">
                <p id="yarn-input-error" className="text-label-md text-on-error-container">
                  {error}
                </p>
              </div>
            ) : null}

            <Button
              onClick={handleStartYarn}
              disabled={isAnalyzing}
              className="mt-md h-14 w-full text-label-lg font-bold duration-200 ease-out hover:-translate-y-0.5 hover:brightness-105 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 md:h-[56px] lg:mt-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span>{activeCopy.analyzing}</span>
                </>
              ) : (
                <span>{activeCopy.cta}</span>
              )}
            </Button>

            <p className="mt-md flex items-start gap-sm text-label-md text-on-surface-variant">
              <Lock aria-hidden="true" className="mt-[1px] shrink-0" size={16} />
              <span>{activeCopy.trust}</span>
            </p>
          </div>
        </section>

        <section className="mt-lg md:mt-xl lg:col-span-2 lg:mt-[40px]">
          <div className="grid gap-sm rounded-2xl border border-outline-variant/35 bg-surface-container-lowest/70 p-sm shadow-soft md:grid-cols-3 md:p-md">
            {activeCopy.howItWorks.map((item) => (
              <div key={item.title} className="rounded-xl bg-surface-container-low p-md">
                <h2 className="text-label-lg font-bold text-primary">
                  {item.title}
                </h2>
                <p className="mt-xs text-body-sm text-on-surface-variant">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <h2 className="mb-sm mt-lg text-label-lg uppercase text-on-surface-variant">
            {activeCopy.tryOne}
          </h2>
          <div className="grid gap-sm md:grid-cols-3">
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
                  key={example.key}
                  type="button"
                  onClick={() => handleUseExample(example.index)}
                  className="flex min-h-[84px] items-center gap-md rounded-2xl bg-surface-container-low p-md text-left shadow-soft transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-surface-container hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-soft motion-reduce:active:scale-100"
                >
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tone}`}>
                    <Icon aria-hidden="true" size={24} strokeWidth={2.2} />
                  </span>
                  <span className="text-body-lg font-bold text-on-surface">
                    {activeCopy.examples[example.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
