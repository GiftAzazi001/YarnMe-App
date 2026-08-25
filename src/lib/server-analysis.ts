import { GoogleGenAI, type ContentListUnion } from "@google/genai";
import { z } from "zod";
import {
  analysisJsonSchema,
  analysisResultSchema,
  analyzeRequestSchema,
  analyzeResponseSchema,
  IMAGE_UPLOAD_MAX_BYTES,
  languageNames,
  languageSchema,
  PDF_UPLOAD_MAX_BYTES,
  PDF_UPLOAD_MAX_PAGES,
  supportedPdfMimeTypes,
  type AnalysisResult,
  type LanguageCode,
  type SupportedUploadMimeType,
} from "@/lib/analysis";
import {
  getGeminiModelConfig,
  type GeminiModelRole,
} from "@/lib/gemini-models";

const TIMEOUT_MS = 30000;
const TRANSIENT_GEMINI_STATUSES = new Set([429, 500, 502, 503, 504]);

const languageInstructions: Record<LanguageCode, string> = {
  "simple-english": `Simple English rules:
- Write in short, everyday Simple English sentences.
- Translate and explain any complex legal, bureaucratic, or academic jargon into plain everyday words.
- Ensure all dates, payments, and actions are crystal clear and easy to follow.`,
  pidgin: `Nigerian Pidgin language rules:
- Nigerian Pidgin must be used across EVERY explanatory field (meaning, audience, eligibility, actions, documents, payments.purpose, payments.when, payments.who, dates.context, warnings, uncertainties.reason, sourceLimitations).
- Do NOT leave payment purpose, payment when, payment who, dates context, or required documents in standard English.
- Translate required documents, statements, essays, and forms completely into natural Pidgin:
  * "Short statement of not more than 250 words explaining why you want to participate" -> "Short statement wey no pass 250 words wey dey explain why you wan join/participate"
  * "Statement of purpose" -> "Letter wey explain why you dey apply"
  * "Court Affidavit" -> "Court Affidavit (takarda wey you swear for court)"
  * "recent colored passport photograph" -> "Recent color passport photo"
  * "registration fee" -> "Money for registration"
  * "application fee" -> "Money to apply"
  * "before 30th August 2026" -> "Before 30th August 2026"
  * "at the bank" -> "For bank"
  * "Deadline for submission" -> "Last day to submit documents"
  * "Scheduled power outage for maintenance of transmission lines" -> "Time wey dem go off light so dem fit repair transmission lines"
  * "turn off electrical appliances" -> "Make you off electrical appliances wey fit spoil"
- Prefer natural Nigerian Pidgin phrasing (e.g. "People wey dey apply" instead of "Applicants").
- Keep the tone clear, respectful, practical, and Nigerian. Avoid comedic exaggeration or forced street slang.
- Retain official acronyms (JAMB, WAEC, NYSC, ARCON, NIA, B.Sc., M.Sc., HND) and URLs in their standard forms.`,
  hausa: `Hausa language rules:
- Hausa must be used across EVERY single explanatory field (meaning, audience, eligibility, actions, documents, payments.purpose, payments.when, payments.who, dates.context, warnings, uncertainties.reason, sourceLimitations).
- Do NOT mix English sentences, English document descriptions, English subject names, or English words in parentheses (e.g. write "Lissafi" and "Harshen Turanci", do NOT write "Lissafi (Mathematics)" or "Turanci (English Language)").
- Translate required documents, essays, statements, certificates, and forms completely into natural Hausa:
  * "Short statement of not more than 250 words explaining why you want to participate" -> "Takaitaccen rubutun bayani da bai wuce kalmomi 250 ba da ke bayyana dalilin da ya sa kake son shiga"
  * "Statement of purpose" -> "Takardar bayyana makasudi da dalilin nema"
  * "Curriculum Vitae / Resume" -> "Takardar tarihin karatu da aiki (CV)"
  * "Court Affidavit" -> "Takardar rantsuwa ta kotu (Affidavit)"
  * "recent colored passport photograph" -> "Sabon hoton fasfo mai launi da aka dauka a kwanan nan"
  * "Mathematics" -> "Lissafi"
  * "English Language" -> "Harshen Turanci"
  * "credits / credit passes" -> "darajar kiredit / kyakkyawan sakamako"
  * "two sittings" -> "zama biyu (watau sau biyu a jarabawa)"
  * "stepped down / rejected" -> "a ki amincewa da ita / a ajiye ta a gefe"
  * "registration fee" -> "Kudin rajista"
  * "application fee" -> "Kudin cika fom / neman shiga"
  * "examination fee" -> "Kudin jarrabawa"
  * "before 30th August 2026" -> "Kafin ranar 30 ga watan Agusta, 2026"
  * "at the bank" -> "A banki"
  * "Deadline for submission" -> "Ranar karshe ta mika takardu"
  * "Scheduled power outage for maintenance of transmission lines" -> "Lokacin da za a yanke wutar lantarki domin yin gyara a layukan wuta"
  * "turn off electrical appliances" -> "A kashe kayan wutar lantarki masu saukin lalacewa"
- Prefer natural, modern, conversational Hausa that is clear, respectful, and easy for any Hausa speaker to understand.
- Retain only proper nouns and official acronyms (e.g., JAMB, WAEC, NECO, NYSC, ARCON) and URLs in their standard forms.`,
};

const incompleteSourceCopy: Record<
  LanguageCode,
  {
    limitation: string;
    reason: string;
  }
> = {
  "simple-english": {
    limitation:
      "The supplied notice appears incomplete. Some lines are cut off, so YarnMe has only explained information that is clearly visible.",
    reason:
      "This passage appears incomplete or cut off, so YarnMe cannot safely infer the missing words.",
  },
  pidgin: {
    limitation:
      "Some part of this information look like say dem cut off or no complete. YarnMe no go guess the part wey no show. YarnMe explain only the parts wey clear for the source.",
    reason:
      "This part no complete or e cut off, so YarnMe no fit safely guess the words wey no show.",
  },
  hausa: {
    limitation:
      "Wasu sassan wannan bayanin sun yanke ko ba su cika ba. YarnMe ba zai yi hasashen bayanin da ya bace ba. YarnMe ya yi bayani ne kawai kan abin da ya bayyana a rubutun.",
    reason:
      "Wannan sashe ya yanke ko bai cika ba, don haka YarnMe ba zai yi hasashen kalmomin da suka bace ba.",
  },
};

type ErrorRecord = Record<string, unknown>;

type GeminiErrorInfo = {
  name: string;
  message: string;
  upstreamStatus?: number;
  upstreamStatusText?: string;
  code?: string | number;
  retryAfterMs?: number;
  isAbort: boolean;
};

class GeminiRequestError extends Error {
  info: GeminiErrorInfo;
  constructor(info: GeminiErrorInfo) {
    super(info.message);
    this.name = "GeminiRequestError";
    this.info = info;
  }
}

type GeminiAttemptOptions = {
  modelRole: Exclude<GeminiModelRole, "advanced">;
};

type SourceFileKind = "image" | "pdf";

type SourceFileAnalyzeInput = {
  data: string;
  fileName: string;
  kind: SourceFileKind;
  mimeType: SupportedUploadMimeType;
  size: number;
};

type AnalyzeInput =
  | {
      kind: "text";
      sourceText: string;
    }
  | {
      kind: "file";
      file: SourceFileAnalyzeInput;
    };

type ParsedGeminiAnalysis = {
  analysis: AnalysisResult;
  sourceText: string;
};

const fileAnalysisResultSchema = z
  .object({
    visibleText: z.string().trim().min(1),
    analysis: analysisResultSchema,
  })
  .strict();

const fileAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    visibleText: {
      type: "string",
      minLength: 1,
      description:
        "The exact readable text visible or extractable from the uploaded source file, preserving line breaks where useful. If text is unreadable, blurry, obscured, cut off, or missing from a PDF page, say exactly that instead of guessing.",
    },
    analysis: analysisJsonSchema,
  },
  required: ["visibleText", "analysis"],
  propertyOrdering: ["visibleText", "analysis"],
};

function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENAI_API_KEY?.trim() ||
    process.env.API_KEY?.trim()
  );
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  return new GoogleGenAI({
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function buildPrompt(sourceText: string, language: LanguageCode) {
  const selectedLangName = languageNames[language];
  return `You are YarnMe, an assistant that explains confusing Nigerian official notices in plain, everyday language.

The user has selected: ${selectedLangName}

Given the notice text below, explain and translate ENTIRELY in ${selectedLangName}.
Do not mix in English words or sentences, except for proper nouns (names of places, institutions, documents, or official terms with no direct translation).

Goal:
1. Explain what the notice is actually saying in complete, natural ${selectedLangName} (the way someone would explain it to a friend). Do not stop partway through — explain the FULL notice, not just the first part.
2. Provide a clear, actionable list of steps (actions) based ONLY on what is in the notice. If no actions are mentioned, keep the actions array empty []. Complete the full list without cutting off partway.
3. Extract any audience, eligibility, documents, payments (amount, purpose, when, who), dates (date, context), and warnings — translating descriptions thoroughly into ${selectedLangName}.
4. Confidence note / source limitations: If any part of the notice is unclear, ambiguous, or uses an expression you are not fully sure how to explain in ${selectedLangName}, state so directly (in ${selectedLangName}) in sourceLimitations or uncertainties rather than switching to English or guessing. Flag the specific unclear part instead of skipping it.

Core Rules:
- Only use information present in the notice. Never add information not stated.
- Keep language natural and conversational — not textbook or overly formal.
- Complete your full response in ${selectedLangName} from start to finish. Do not truncate or leave any section unfinished.
- If the notice is entirely unclear or not a real official notice, explain so honestly in ${selectedLangName}.
- Return valid JSON matching the schema.

Target Language: ${selectedLangName}.
ALL EXPLANATORY AND EXTRACTED STRING FIELDS IN THE JSON MUST BE IN ${selectedLangName.toUpperCase()}.
${languageInstructions[language]}

Source text:
"""
${sourceText}
"""`;
}

function buildImagePrompt(fileName: string, language: LanguageCode) {
  const selectedLangName = languageNames[language];
  return `You are YarnMe, an assistant that explains confusing Nigerian official notices in plain, everyday language.

The user has selected: ${selectedLangName}

The user uploaded an image named "${fileName}". The image may be a notice, flyer, screenshot, announcement, or photographed document.

Read ONLY the text and information that is visible in the attached image. Then explain and translate the visible information ENTIRELY in ${selectedLangName}.
Do not mix in English words or sentences, except for proper nouns (names of places, institutions, documents, or official terms with no direct translation).

Return valid JSON with:
1. visibleText: the exact readable text you can see in the image. Preserve line breaks where useful. If text is blurry, cropped, obscured, unreadable, or incomplete, say that directly in visibleText instead of guessing.
2. analysis: the same YarnMe structured analysis fields used for text notices.

Image source-grounding rules:
- Use the attached image as the source of truth.
- Only use information visible in the image. Never add information not visible.
- Never complete blurry, cropped, obscured, or cut-off words, sentences, amounts, dates, URLs, document names, eligibility requirements, or common institutional wording.
- If a line is cut off or unreadable, put the exact visible fragment in uncertainties.text and explain why it cannot be safely interpreted in uncertainties.reason.
- If any part of the image cannot be read reliably, add a sourceLimitations item explaining that the uploaded image is blurry, cropped, obscured, unreadable, or incomplete.
- If the image does not contain a readable notice, say so honestly in ${selectedLangName}; keep arrays empty unless something is clearly visible.

Core Rules:
- Explain rather than merely translate.
- Preserve the meaning of the visible source.
- Extract only actions, eligibility, documents, payments, dates, and warnings that are directly visible in the image.
- Return empty arrays when something is not present or not readable.
- Complete your full response in ${selectedLangName} from start to finish. Do not truncate or leave any section unfinished.

Target Language: ${selectedLangName}.
ALL EXPLANATORY AND EXTRACTED STRING FIELDS IN analysis MUST BE IN ${selectedLangName.toUpperCase()}.
${languageInstructions[language]}`;
}

function buildPdfPrompt(fileName: string, language: LanguageCode) {
  const selectedLangName = languageNames[language];
  return `You are YarnMe, an assistant that explains confusing Nigerian official notices in plain, everyday language.

The user has selected: ${selectedLangName}

The user uploaded a PDF named "${fileName}". The PDF may be a notice, flyer, announcement, form, or scanned document.

Read ONLY the text and information that is clearly present in the attached PDF. Then explain and translate the readable information ENTIRELY in ${selectedLangName}.
Do not mix in English words or sentences, except for proper nouns (names of places, institutions, documents, or official terms with no direct translation).

Return valid JSON with:
1. visibleText: the exact readable text you can reliably read from the PDF. Preserve page breaks and line breaks where useful. If a page, scan, sentence, table, amount, date, URL, or instruction is blurry, missing, cut off, obscured, unreadable, or incomplete, say that directly in visibleText instead of guessing.
2. analysis: the same YarnMe structured analysis fields used for text notices.

PDF source-grounding rules:
- Use the attached PDF as the source of truth.
- Only use information clearly present in the PDF. Never add information not present.
- Never complete missing pages, unreadable scans, cut-off text, unclear tables, incomplete sentences, amounts, dates, URLs, document names, eligibility requirements, or common institutional wording.
- If a passage is cut off, unreadable, missing, or unclear, put the exact readable fragment in uncertainties.text and explain why it cannot be safely interpreted in uncertainties.reason.
- If any page or section cannot be read reliably, add a sourceLimitations item explaining that the uploaded PDF has missing, cut-off, obscured, scanned, unreadable, or incomplete information.
- If the PDF does not contain a readable notice, say so honestly in ${selectedLangName}; keep arrays empty unless something is clearly present.

Core Rules:
- Explain rather than merely translate.
- Preserve the meaning of the readable source.
- Extract only actions, eligibility, documents, payments, dates, and warnings that are directly present in the PDF.
- Return empty arrays when something is not present or not readable.
- Complete your full response in ${selectedLangName} from start to finish. Do not truncate or leave any section unfinished.

Target Language: ${selectedLangName}.
ALL EXPLANATORY AND EXTRACTED STRING FIELDS IN analysis MUST BE IN ${selectedLangName.toUpperCase()}.
${languageInstructions[language]}`;
}

export const askRequestSchema = z.object({
  sourceText: z.string().trim().min(1, "Source text is required."),
  language: languageSchema,
  question: z.string().trim().min(1, "Question is required."),
  meaning: z.string().optional(),
});

function buildAskPrompt(
  sourceText: string,
  question: string,
  language: LanguageCode,
  meaning?: string,
) {
  return `You are YarnMe, a helpful assistant answering a question about a notice/text for a Nigerian user.
Source text:
"""
${sourceText}
"""
${meaning ? `Existing explanation: "${meaning}"` : ""}

User question: "${question}"
Target Language: ${languageNames[language]}.

Instructions:
- Answer the user's question directly, clearly, and concisely in ${languageNames[language]}.
- Keep the answer strictly grounded in the source text. Do not invent details not present in the source.
- If the source text does not contain the answer, politely state in ${languageNames[language]} that the provided text does not mention this detail.
- Keep the response friendly, respectful, and easy to understand.
- Return ONLY the answer as plain text.`;
}

function buildImageAskPrompt(
  sourceText: string,
  question: string,
  language: LanguageCode,
  fileName: string,
  meaning?: string,
) {
  return `You are YarnMe, a helpful assistant answering a question about an uploaded notice image for a Nigerian user.

The uploaded image is named "${fileName}" and is attached to this request.

Visible text/transcript from the earlier image analysis:
"""
${sourceText}
"""
${meaning ? `Existing explanation: "${meaning}"` : ""}

User question: "${question}"
Target Language: ${languageNames[language]}.

Instructions:
- Answer the user's question directly, clearly, and concisely in ${languageNames[language]}.
- Use the attached image as the source of truth. The transcript above may be incomplete.
- Keep the answer strictly grounded in what is visible in the image or already captured in the visible text/transcript.
- Do not invent details not visible in the uploaded image.
- If the image is blurry, cut off, obscured, unreadable, or does not contain the answer, politely say in ${languageNames[language]} that the provided image does not show this detail clearly.
- Keep the response friendly, respectful, and easy to understand.
- Return ONLY the answer as plain text.`;
}

function buildPdfAskPrompt(
  sourceText: string,
  question: string,
  language: LanguageCode,
  fileName: string,
  meaning?: string,
) {
  return `You are YarnMe, a helpful assistant answering a question about an uploaded PDF notice for a Nigerian user.

The uploaded PDF is named "${fileName}" and is attached to this request.

Readable text/transcript from the earlier PDF analysis:
"""
${sourceText}
"""
${meaning ? `Existing explanation: "${meaning}"` : ""}

User question: "${question}"
Target Language: ${languageNames[language]}.

Instructions:
- Answer the user's question directly, clearly, and concisely in ${languageNames[language]}.
- Use the attached PDF as the source of truth. The transcript above may be incomplete.
- Keep the answer strictly grounded in what is present in the PDF or already captured in the readable text/transcript.
- Do not invent details not present in the uploaded PDF.
- If the PDF is missing pages, scanned unclearly, cut off, obscured, unreadable, or does not contain the answer, politely say in ${languageNames[language]} that the provided PDF does not give that information clearly.
- Keep the response friendly, respectful, and easy to understand.
- Return ONLY the answer as plain text.`;
}

function parseJsonText(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(withoutFence);
}

type IncompleteSourceIssue = {
  text: string;
  reason: string;
};

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function stripListMarker(item: string) {
  return item
    .trim()
    .replace(/^(?:svg\s+)+/i, "")
    .replace(/^(?:(?:[-*•]|\d+[\).])\s+)+/, "")
    .trim();
}

function normalizeAnalysisLists(analysis: AnalysisResult): AnalysisResult {
  return {
    ...analysis,
    eligibility: uniqueStrings(analysis.eligibility.map(stripListMarker)),
    actions: uniqueStrings(analysis.actions.map(stripListMarker)),
    documents: uniqueStrings(analysis.documents.map(stripListMarker)),
    payments: analysis.payments.map((payment) => ({
      amount: stripListMarker(payment.amount),
      purpose: stripListMarker(payment.purpose),
      when: stripListMarker(payment.when),
      who: stripListMarker(payment.who),
    })),
    warnings: uniqueStrings(analysis.warnings.map(stripListMarker)),
    sourceLimitations: uniqueStrings(
      analysis.sourceLimitations.map(stripListMarker),
    ),
  };
}

function snippet(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized;
}

function detectIncompleteSourceIssues(sourceText: string): IncompleteSourceIssue[] {
  const issues: IncompleteSourceIssue[] = [];
  const lines = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const trimmedSource = sourceText.trim();

  function addIssue(text: string, reason: string) {
    const issueText = snippet(text);
    if (
      !issueText ||
      issues.some((issue) => issue.text.toLowerCase() === issueText.toLowerCase())
    ) {
      return;
    }
    issues.push({ text: issueText, reason });
  }

  for (const line of lines) {
    if (/^(?:[-*•]|\d+[\).])\s*$/.test(line)) {
      addIssue(line, "A list item appears to have no visible content.");
    }
    if (/[,:;/-]\s*$/.test(line)) {
      addIssue(line, "The line ends in a way that suggests more text may be missing.");
    }
    if (
      /\b(?:and|or|as|of|to|for|with|against|against a|before|after|from|at|on|in|by|not less than|minimum|maximum)\s*$/i.test(
        line,
      )
    ) {
      addIssue(line, "The line ends with a connector or incomplete phrase.");
    }
    if (/(?:\.\.\.|…)\s*$/.test(line)) {
      addIssue(line, "The line ends with an ellipsis, suggesting the text is cut off.");
    }
    if (
      /\b(?:https?:\/\/|www\.|visit|apply at|go to|click|open)\s*:?\s*$/i.test(
        line,
      )
    ) {
      addIssue(line, "A URL or instruction appears to be missing.");
    }
  }

  if (/(?:\.\.\.|…)\s*$/.test(trimmedSource)) {
    addIssue(trimmedSource, "The source ends with an ellipsis.");
  }
  if (/[,:;/-]\s*$/.test(trimmedSource)) {
    addIssue(trimmedSource, "The source appears to end mid-phrase.");
  }
  if (
    /\b(?:and|or|as|of|to|for|with|against|against a|before|after|from|at|on|in|by|minimum|maximum)\s*$/i.test(
      trimmedSource,
    )
  ) {
    addIssue(trimmedSource, "The source ends with a connector or incomplete phrase.");
  }
  if (
    /[,:;]\s*\r?\n\s*(?:as|and|or|with|for|to|before|after|their|his|her|its)\b/i.test(
      sourceText,
    )
  ) {
    addIssue(
      sourceText,
      "A line break after punctuation creates a grammatical fragment that may be missing text.",
    );
  }

  return issues.slice(0, 5);
}

function applyIncompleteSourceSafeguards(
  analysis: AnalysisResult,
  sourceText: string,
  language: LanguageCode,
): AnalysisResult {
  const issues = detectIncompleteSourceIssues(sourceText);
  if (issues.length === 0) return normalizeAnalysisLists(analysis);

  const copy = incompleteSourceCopy[language];
  const existingLimitationText = analysis.sourceLimitations
    .join(" ")
    .toLowerCase();
  const sourceLimitations = existingLimitationText.match(
    /incomplete|cut off|truncated|missing|damaged|ocr|no complete|bai cika|yanke/,
  )
    ? analysis.sourceLimitations
    : [copy.limitation, ...analysis.sourceLimitations];

  const uncertainties = [
    ...analysis.uncertainties,
    ...issues
      .filter(
        (issue) =>
          !analysis.uncertainties.some((item) =>
            item.text.toLowerCase().includes(issue.text.toLowerCase()),
          ),
      )
      .map((issue) => ({
        text: issue.text,
        reason: `${copy.reason} (${issue.reason})`,
      })),
  ];

  return normalizeAnalysisLists({
    ...analysis,
    sourceLimitations,
    uncertainties,
  });
}

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: ErrorRecord | null, key: string) {
  const value = record?.[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: ErrorRecord | null, key: string) {
  const value = record?.[key];
  return typeof value === "number" ? value : undefined;
}

function parseJsonRecord(value: string | undefined): ErrorRecord | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseRetryAfterMs(headerValue: string | undefined): number | undefined {
  if (!headerValue) return undefined;
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, 10000);
  }
  const dateMs = Date.parse(headerValue);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? Math.min(delta, 10000) : undefined;
  }
  return undefined;
}

function redactSecrets(text: string) {
  return text
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_GEMINI_API_KEY]")
    .replace(
      /(authorization|x-goog-api-key|api[_-]?key)\s*[:=]\s*["']?[^"',\s}]+/gi,
      "$1=[REDACTED]",
    )
    .replace(/([?&](?:key|api_key|apiKey)=)[^&\s]+/gi, "$1[REDACTED]");
}

function limitDetail(value: string) {
  return value.length > 1200 ? `${value.slice(0, 1200)}...` : value;
}

function extractGeminiErrorInfo(error: unknown): GeminiErrorInfo {
  const errorRecord = isRecord(error) ? error : null;
  const causeRecord = isRecord(errorRecord?.cause) ? errorRecord.cause : null;
  const responseRecord = isRecord(errorRecord?.response)
    ? (errorRecord.response as ErrorRecord)
    : isRecord(errorRecord?.rawResponse)
      ? (errorRecord.rawResponse as ErrorRecord)
      : null;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown Gemini error";

  const causeMessage = readString(causeRecord, "message");
  const parsedMessage = parseJsonRecord(message);
  const parsedMessageError = isRecord(parsedMessage?.error)
    ? (parsedMessage.error as ErrorRecord)
    : parsedMessage;
  const bodyRecord = parseJsonRecord(readString(errorRecord, "body"));
  const bodyError = isRecord(bodyRecord?.error)
    ? (bodyRecord.error as ErrorRecord)
    : bodyRecord;

  const upstreamStatus =
    readNumber(errorRecord, "status") ??
    readNumber(errorRecord, "statusCode") ??
    readNumber(responseRecord, "status") ??
    readNumber(parsedMessageError, "code") ??
    readNumber(bodyError, "code");

  const upstreamStatusText =
    readString(errorRecord, "statusText") ??
    readString(responseRecord, "statusText") ??
    readString(parsedMessageError, "status") ??
    readString(bodyError, "status");

  const code =
    readString(errorRecord, "code") ??
    readNumber(errorRecord, "code") ??
    readString(causeRecord, "code") ??
    readNumber(causeRecord, "code") ??
    readString(causeRecord, "errno") ??
    readString(parsedMessageError, "status") ??
    readNumber(parsedMessageError, "code") ??
    readString(bodyError, "status") ??
    readNumber(bodyError, "code");

  const retryAfterMs = parseRetryAfterMs(
    (readString(errorRecord?.headers as ErrorRecord, "retry-after") ??
      readString(responseRecord?.headers as ErrorRecord, "retry-after")),
  );

  const name =
    error instanceof Error
      ? error.name
      : readString(errorRecord, "name") ?? "UnknownError";

  const isAbort =
    name === "AbortError" ||
    name === "APIUserAbortError" ||
    message.toLowerCase().includes("aborted");

  return {
    name,
    message: limitDetail(
      redactSecrets(causeMessage ? `${message}; cause: ${causeMessage}` : message),
    ),
    upstreamStatus,
    upstreamStatusText: upstreamStatusText
      ? redactSecrets(upstreamStatusText)
      : undefined,
    code,
    retryAfterMs,
    isAbort,
  };
}

function logGeminiError(
  info: GeminiErrorInfo,
  model: string,
  modelRole: GeminiAttemptOptions["modelRole"],
) {
  console.error("[YarnMe] Gemini request failed", {
    model,
    modelRole,
    fallbackUsed: modelRole === "fallback",
    errorName: info.name,
    errorMessage: info.message,
    upstreamStatus: info.upstreamStatus,
    upstreamStatusText: info.upstreamStatusText,
    errorCode: info.code,
  });
}

function logGeminiFallback(
  primaryModel: string,
  fallbackModel: string,
  info: GeminiErrorInfo,
) {
  console.warn("[YarnMe] Gemini model fallback triggered", {
    primaryModel,
    fallbackModel,
    fallbackUsed: true,
    reason: {
      upstreamStatus: info.upstreamStatus,
      upstreamStatusText: info.upstreamStatusText,
      errorCode: info.code,
    },
  });
}

function isTransientUpstreamFailure(info: GeminiErrorInfo) {
  return (
    typeof info.upstreamStatus === "number" &&
    TRANSIENT_GEMINI_STATUSES.has(info.upstreamStatus)
  );
}

function mapGeminiFailureStatus(info: GeminiErrorInfo) {
  if (info.isAbort) return 504;
  switch (info.upstreamStatus) {
    case 401:
      return 401;
    case 403:
      return 403;
    case 429:
      return 429;
    case 500:
    case 502:
    case 503:
    case 504:
      return 503;
    default:
      return 502;
  }
}

function buildAnalysisContents(
  input: AnalyzeInput,
  language: LanguageCode,
): ContentListUnion {
  if (input.kind === "text") {
    return buildPrompt(input.sourceText, language);
  }

  const prompt =
    input.file.kind === "pdf"
      ? buildPdfPrompt(input.file.fileName, language)
      : buildImagePrompt(input.file.fileName, language);

  return [
    { text: prompt },
    {
      inlineData: {
        data: input.file.data,
        mimeType: input.file.mimeType,
      },
    },
  ];
}

function parseGeminiAnalysis(
  input: AnalyzeInput,
  aiJson: unknown,
): ParsedGeminiAnalysis | null {
  if (input.kind === "text") {
    const parsedAnalysis = analysisResultSchema.safeParse(aiJson);
    if (!parsedAnalysis.success) return null;
    return {
      analysis: parsedAnalysis.data,
      sourceText: input.sourceText,
    };
  }

  const parsedFileAnalysis = fileAnalysisResultSchema.safeParse(aiJson);
  if (!parsedFileAnalysis.success) return null;
  const sourceLabel = input.file.kind === "pdf" ? "PDF" : "image";
  return {
    analysis: parsedFileAnalysis.data.analysis,
    sourceText: [
      `[Uploaded ${sourceLabel}: ${input.file.fileName}]`,
      parsedFileAnalysis.data.visibleText,
    ].join("\n"),
  };
}

function getResponseJsonSchema(input: AnalyzeInput) {
  return input.kind === "file" ? fileAnalysisJsonSchema : analysisJsonSchema;
}

async function generateGeminiContent(
  ai: GoogleGenAI,
  model: string,
  input: AnalyzeInput,
  language: LanguageCode,
  options: GeminiAttemptOptions,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await ai.models.generateContent({
      model,
      contents: buildAnalysisContents(input, language),
      config: {
        abortSignal: controller.signal,
        responseMimeType: "application/json",
        responseJsonSchema: getResponseJsonSchema(input),
        temperature: 0.1,
      },
    });
  } catch (error) {
    const info = extractGeminiErrorInfo(error);
    logGeminiError(info, model, options.modelRole);
    throw new GeminiRequestError(info);
  } finally {
    clearTimeout(timeout);
  }
}

async function runGeminiAnalysis(
  input: AnalyzeInput,
  language: LanguageCode,
): Promise<{
  status: number;
  data: unknown;
}> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      status: 500,
      data: {
        error: "Gemini is not configured",
        details:
          "Missing GEMINI_API_KEY. Please configure GEMINI_API_KEY in your deployment environment variables or Settings > Secrets.",
      },
    };
  }

  const models = getGeminiModelConfig();
  const ai = getGeminiClient();

  const candidateModels = Array.from(
    new Set([
      "gemini-3.1-flash-lite",
      models.primary,
      models.fallback,
      "gemini-flash-latest",
      models.advanced,
      "gemini-3.7-flash",
    ]),
  ).filter((m): m is string => typeof m === "string" && m.startsWith("gemini-"));

  let lastError: unknown = null;
  let successfulResponse: {
    analysis: AnalysisResult;
    sourceText: string;
    model: string;
  } | null = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    const role: GeminiAttemptOptions["modelRole"] = i === 0 ? "primary" : "fallback";

    try {
      const geminiResponse = await generateGeminiContent(
        ai,
        currentModel,
        input,
        language,
        { modelRole: role },
      );

      const outputText = geminiResponse.text;
      if (!outputText) {
        continue;
      }

      let aiJson: unknown;
      try {
        aiJson = parseJsonText(outputText);
      } catch {
        continue;
      }

      const parsedAnalysis = parseGeminiAnalysis(input, aiJson);
      if (!parsedAnalysis) {
        continue;
      }

      successfulResponse = {
        analysis: parsedAnalysis.analysis,
        sourceText: parsedAnalysis.sourceText,
        model: currentModel,
      };
      break;
    } catch (err) {
      lastError = err;
      console.warn(`[YarnMe] Attempt with model ${currentModel} failed:`, err instanceof Error ? err.message : err);
      // Continue to next candidate model
    }
  }

  if (!successfulResponse) {
    if (lastError instanceof GeminiRequestError) {
      const details = limitDetail(
        [
          `${lastError.info.name}: ${lastError.info.message}`,
          lastError.info.upstreamStatusText
            ? `statusText=${lastError.info.upstreamStatusText}`
            : "",
          typeof lastError.info.code !== "undefined"
            ? `code=${String(lastError.info.code)}`
            : "",
        ]
          .filter(Boolean)
          .join(" | "),
      );

      return {
        status: mapGeminiFailureStatus(lastError.info),
        data: {
          error: "YarnMe could not explain this right now. Please try again.",
          upstreamStatus: lastError.info.upstreamStatus ?? null,
          details,
        },
      };
    }

    return {
      status: 502,
      data: {
        error: "YarnMe could not explain this right now. Please try again.",
      },
    };
  }

  const groundedAnalysis = applyIncompleteSourceSafeguards(
    successfulResponse.analysis,
    successfulResponse.sourceText,
    language,
  );

  const response = analyzeResponseSchema.parse({
    analysis: groundedAnalysis,
    language,
    sourceText: successfulResponse.sourceText,
    model: successfulResponse.model,
  });

  return {
    status: 200,
    data: response,
  };
}

export async function handleAnalyzeRequest(body: unknown): Promise<{
  status: number;
  data: unknown;
}> {
  const parsedRequest = analyzeRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    const firstIssue = parsedRequest.error.issues[0];
    if (firstIssue?.path[0] === "language") {
      return {
        status: 400,
        data: { error: "Choose Simple English, Pidgin, or Hausa." },
      };
    }
    return {
      status: 400,
      data: {
        error:
          firstIssue?.message || "Paste some text first so YarnMe can explain it.",
      },
    };
  }

  const { sourceText, language } = parsedRequest.data;
  return runGeminiAnalysis({ kind: "text", sourceText }, language);
}

function getUploadDetails(file: File):
  | {
      kind: SourceFileKind;
      mimeType: SupportedUploadMimeType;
      maxBytes: number;
    }
  | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type.trim().toLowerCase();
  const pdfMimeTypes = supportedPdfMimeTypes as readonly string[];
  const hasNoMimeType = mimeType.length === 0;

  if (extension === "png") {
    if (!hasNoMimeType && mimeType !== "image/png") return null;
    return {
      kind: "image",
      mimeType: "image/png",
      maxBytes: IMAGE_UPLOAD_MAX_BYTES,
    };
  }
  if (extension === "jpg" || extension === "jpeg") {
    if (!hasNoMimeType && mimeType !== "image/jpeg" && mimeType !== "image/jpg") {
      return null;
    }
    return {
      kind: "image",
      mimeType: "image/jpeg",
      maxBytes: IMAGE_UPLOAD_MAX_BYTES,
    };
  }
  if (extension === "webp") {
    if (!hasNoMimeType && mimeType !== "image/webp") return null;
    return {
      kind: "image",
      mimeType: "image/webp",
      maxBytes: IMAGE_UPLOAD_MAX_BYTES,
    };
  }
  if (extension === "pdf") {
    if (!hasNoMimeType && !pdfMimeTypes.includes(mimeType)) return null;
    return {
      kind: "pdf",
      mimeType: "application/pdf",
      maxBytes: PDF_UPLOAD_MAX_BYTES,
    };
  }
  return null;
}

function getUploadFile(formData: FormData) {
  return formData.get("file") ?? formData.get("image");
}

function formatUploadLimit(bytes = IMAGE_UPLOAD_MAX_BYTES) {
  return `${Math.floor(bytes / (1024 * 1024))}MB`;
}

function estimatePdfPageCount(buffer: Buffer) {
  const pdfText = buffer.toString("latin1");
  return pdfText.match(/\/Type\s*\/Page\b/g)?.length ?? null;
}

function validatePdfPageLimit(
  uploadDetails: { kind: SourceFileKind },
  buffer: Buffer,
):
  | {
      status: number;
      data: unknown;
    }
  | null {
  if (uploadDetails.kind !== "pdf") return null;
  const pageCount = estimatePdfPageCount(buffer);
  if (pageCount !== null && pageCount > PDF_UPLOAD_MAX_PAGES) {
    return {
      status: 413,
      data: {
        error: `This PDF has about ${pageCount} pages. Please upload a PDF with ${PDF_UPLOAD_MAX_PAGES} pages or fewer.`,
      },
    };
  }
  return null;
}

function supportedUploadMessage() {
  return "YarnMe can read PNG, JPG, JPEG, WEBP, and PDF files for now.";
}

export async function handleAnalyzeUploadFormData(
  formData: FormData,
): Promise<{
  status: number;
  data: unknown;
}> {
  const parsedLanguage = languageSchema.safeParse(formData.get("language"));
  if (!parsedLanguage.success) {
    return {
      status: 400,
      data: { error: "Choose Simple English, Pidgin, or Hausa." },
    };
  }

  const uploadValue = getUploadFile(formData);
  if (!(uploadValue instanceof File)) {
    return {
      status: 400,
      data: { error: "Choose an image or PDF file for YarnMe to read." },
    };
  }

  if (uploadValue.size <= 0) {
    return {
      status: 400,
      data: { error: "This file could not be read. Please choose another file." },
    };
  }

  const uploadDetails = getUploadDetails(uploadValue);
  if (!uploadDetails) {
    return {
      status: 415,
      data: {
        error: supportedUploadMessage(),
      },
    };
  }

  if (uploadValue.size > uploadDetails.maxBytes) {
    return {
      status: 413,
      data: {
        error: `This file is too large. Please upload a PNG, JPG, JPEG, WEBP, or PDF file under ${formatUploadLimit(uploadDetails.maxBytes)}.`,
      },
    };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await uploadValue.arrayBuffer());
  } catch {
    return {
      status: 400,
      data: { error: "This file could not be read. Please choose another file." },
    };
  }

  const pageLimitError = validatePdfPageLimit(uploadDetails, buffer);
  if (pageLimitError) return pageLimitError;

  const data = buffer.toString("base64");

  return runGeminiAnalysis(
    {
      kind: "file",
      file: {
        data,
        fileName: uploadValue.name || `uploaded-${uploadDetails.kind}`,
        kind: uploadDetails.kind,
        mimeType: uploadDetails.mimeType,
        size: uploadValue.size,
      },
    },
    parsedLanguage.data,
  );
}

export async function handleAskRequest(body: unknown): Promise<{
  status: number;
  data: unknown;
}> {
  const parsedRequest = askRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    const firstIssue = parsedRequest.error.issues[0];
    return {
      status: 400,
      data: { error: firstIssue?.message || "Invalid question request." },
    };
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      status: 500,
      data: {
        error: "Gemini is not configured",
        details:
          "Missing GEMINI_API_KEY. Please configure GEMINI_API_KEY in your deployment environment variables or Settings > Secrets.",
      },
    };
  }

  const models = getGeminiModelConfig();
  const { sourceText, language, question, meaning } = parsedRequest.data;
  const ai = getGeminiClient();

  const candidateModels = Array.from(
    new Set([
      "gemini-3.1-flash-lite",
      models.primary,
      models.fallback,
      "gemini-flash-latest",
      models.advanced,
      "gemini-3.7-flash",
    ]),
  ).filter((m): m is string => typeof m === "string" && m.startsWith("gemini-"));

  for (const currentModel of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: buildAskPrompt(sourceText, question, language, meaning),
        config: {
          temperature: 0.2,
        },
      });

      const answer = response.text?.trim();
      if (answer) {
        return {
          status: 200,
          data: { answer },
        };
      }
    } catch (err) {
      logGeminiError(
        extractGeminiErrorInfo(err),
        currentModel,
        currentModel === models.primary ? "primary" : "fallback",
      );
    }
  }

  return {
    status: 502,
    data: { error: "Could not generate an answer right now. Please try again." },
  };
}

export async function handleAskUploadFormData(formData: FormData): Promise<{
  status: number;
  data: unknown;
}> {
  const parsedLanguage = languageSchema.safeParse(formData.get("language"));
  const sourceTextValue = formData.get("sourceText");
  const questionValue = formData.get("question");
  const meaningValue = formData.get("meaning");

  if (!parsedLanguage.success) {
    return {
      status: 400,
      data: { error: "Choose Simple English, Pidgin, or Hausa." },
    };
  }

  const sourceText = typeof sourceTextValue === "string" ? sourceTextValue.trim() : "";
  const question = typeof questionValue === "string" ? questionValue.trim() : "";
  const meaning = typeof meaningValue === "string" ? meaningValue.trim() : undefined;

  if (!sourceText || !question) {
    return {
      status: 400,
      data: { error: "Invalid question request." },
    };
  }

  const uploadValue = getUploadFile(formData);
  if (!(uploadValue instanceof File)) {
    return {
      status: 400,
      data: { error: "The uploaded file is no longer available for this question." },
    };
  }

  if (uploadValue.size <= 0) {
    return {
      status: 400,
      data: { error: "This file could not be read. Please upload it again." },
    };
  }

  const uploadDetails = getUploadDetails(uploadValue);
  if (!uploadDetails) {
    return {
      status: 415,
      data: {
        error: supportedUploadMessage(),
      },
    };
  }

  if (uploadValue.size > uploadDetails.maxBytes) {
    return {
      status: 413,
      data: {
        error: `This file is too large. Please upload a PNG, JPG, JPEG, WEBP, or PDF file under ${formatUploadLimit(uploadDetails.maxBytes)}.`,
      },
    };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await uploadValue.arrayBuffer());
  } catch {
    return {
      status: 400,
      data: { error: "This file could not be read. Please upload it again." },
    };
  }

  const pageLimitError = validatePdfPageLimit(uploadDetails, buffer);
  if (pageLimitError) return pageLimitError;

  const data = buffer.toString("base64");

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      status: 500,
      data: {
        error: "Gemini is not configured",
        details:
          "Missing GEMINI_API_KEY. Please configure GEMINI_API_KEY in your deployment environment variables or Settings > Secrets.",
      },
    };
  }

  const models = getGeminiModelConfig();
  const ai = getGeminiClient();
  const candidateModels = Array.from(
    new Set([
      "gemini-3.1-flash-lite",
      models.primary,
      models.fallback,
      "gemini-flash-latest",
      models.advanced,
      "gemini-3.7-flash",
    ]),
  ).filter((m): m is string => typeof m === "string" && m.startsWith("gemini-"));

  for (const currentModel of candidateModels) {
    try {
      const prompt =
        uploadDetails.kind === "pdf"
          ? buildPdfAskPrompt(
              sourceText,
              question,
              parsedLanguage.data,
              uploadValue.name || "uploaded-pdf",
              meaning,
            )
          : buildImageAskPrompt(
              sourceText,
              question,
              parsedLanguage.data,
              uploadValue.name || "uploaded-image",
              meaning,
            );

      const response = await ai.models.generateContent({
        model: currentModel,
        contents: [
          {
            text: prompt,
          },
          {
            inlineData: {
              data,
              mimeType: uploadDetails.mimeType,
            },
          },
        ],
        config: {
          temperature: 0.2,
        },
      });

      const answer = response.text?.trim();
      if (answer) {
        return {
          status: 200,
          data: { answer },
        };
      }
    } catch (err) {
      logGeminiError(
        extractGeminiErrorInfo(err),
        currentModel,
        currentModel === models.primary ? "primary" : "fallback",
      );
    }
  }

  return {
    status: 502,
    data: { error: "Could not generate an answer right now. Please try again." },
  };
}
