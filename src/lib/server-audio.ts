import { Buffer } from "node:buffer";
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from "@google/genai";
import { z } from "zod";

const AUDIO_UNAVAILABLE_MESSAGE = "Audio isn't available right now.";
const AUDIO_TIMEOUT_MS = 28000;
const AUDIO_SAMPLE_RATE = 24000;
const AUDIO_CHANNELS = 1;
const AUDIO_BITS_PER_SAMPLE = 16;
const AUDIO_MAX_TEXT_CHARS = 3000;

export const DEFAULT_GEMINI_AUDIO_MODEL = "gemini-3.1-flash-live-preview";
export const DEFAULT_GEMINI_AUDIO_FALLBACK_MODEL =
  "gemini-2.5-flash-native-audio-preview-12-2025";
export const DEFAULT_GEMINI_AUDIO_VOICE = "Kore";

const audioLanguageSchema = z.enum(["english", "pidgin", "hausa"]);

export const audioRequestSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "There is no explanation to read yet.")
      .max(AUDIO_MAX_TEXT_CHARS, "This explanation is too long to read aloud right now."),
    language: audioLanguageSchema,
  })
  .strict();

type AudioLanguage = z.infer<typeof audioLanguageSchema>;

type ErrorRecord = Record<string, unknown>;

type GeminiAudioErrorInfo = {
  name: string;
  message: string;
  upstreamStatus?: number;
  upstreamStatusText?: string;
  code?: string | number;
  isAbort: boolean;
};

type AudioAttemptRole = "primary" | "fallback";
type AudioFailureCategory =
  | "auth"
  | "connection"
  | "invalid-request"
  | "resource"
  | "timeout"
  | "upstream"
  | "unknown";

type AudioRouteResult =
  | {
      ok: true;
      status: 200;
      audio: Uint8Array;
      headers: HeadersInit;
    }
  | {
      ok: false;
      status: number;
      data: {
        error: string;
      };
    };

class AudioGenerationTimeoutError extends Error {
  constructor() {
    super("Audio generation timed out");
    this.name = "AudioGenerationTimeoutError";
  }
}

class AudioNoChunksError extends Error {
  status = 502;

  constructor() {
    super("Gemini audio returned no audio chunks.");
    this.name = "AudioNoChunksError";
  }
}

function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim();
}

function getAudioPrimaryModel() {
  return process.env.GEMINI_AUDIO_MODEL?.trim() || DEFAULT_GEMINI_AUDIO_MODEL;
}

function getAudioFallbackModel() {
  return (
    process.env.GEMINI_AUDIO_FALLBACK_MODEL?.trim() ||
    DEFAULT_GEMINI_AUDIO_FALLBACK_MODEL
  );
}

function getAudioVoice() {
  return process.env.GEMINI_AUDIO_VOICE?.trim() || DEFAULT_GEMINI_AUDIO_VOICE;
}

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: ErrorRecord | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: ErrorRecord | null | undefined, key: string) {
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

function audioElapsedMs(startedAt: number) {
  return Date.now() - startedAt;
}

function logAudioDiagnostic(
  message: string,
  startedAt: number,
  details: ErrorRecord = {},
) {
  console.info(message, {
    elapsedMs: audioElapsedMs(startedAt),
    ...details,
  });
}

function extractGeminiAudioErrorInfo(error: unknown): GeminiAudioErrorInfo {
  const errorRecord = isRecord(error) ? error : null;
  const causeRecord = isRecord(errorRecord?.cause) ? errorRecord.cause : null;
  const responseRecord = isRecord(errorRecord?.response)
    ? (errorRecord.response as ErrorRecord)
    : isRecord(errorRecord?.rawResponse)
      ? (errorRecord.rawResponse as ErrorRecord)
      : null;

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : readString(errorRecord, "message") ?? "Unknown Gemini audio error";
  const causeMessage = readString(causeRecord, "message");
  const parsedMessage = parseJsonRecord(rawMessage);
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

  const name =
    error instanceof Error
      ? error.name
      : readString(errorRecord, "name") ?? "UnknownError";
  const message = limitDetail(
    redactSecrets(causeMessage ? `${rawMessage}; cause: ${causeMessage}` : rawMessage),
  );

  return {
    name,
    message,
    upstreamStatus,
    upstreamStatusText: upstreamStatusText
      ? redactSecrets(upstreamStatusText)
      : undefined,
    code,
    isAbort:
      name === "AbortError" ||
      name === "APIUserAbortError" ||
      message.toLowerCase().includes("aborted") ||
      message.toLowerCase().includes("timed out"),
  };
}

function audioErrorText(info: GeminiAudioErrorInfo) {
  return [
    info.name,
    info.message,
    info.upstreamStatusText,
    info.code === undefined ? "" : String(info.code),
  ]
    .join(" ")
    .toUpperCase();
}

function isAudioAuthFailure(info: GeminiAudioErrorInfo) {
  const text = audioErrorText(info);
  return (
    info.upstreamStatus === 401 ||
    info.upstreamStatus === 403 ||
    text.includes("UNAUTHENTICATED") ||
    text.includes("PERMISSION_DENIED") ||
    text.includes("API KEY NOT VALID") ||
    text.includes("API_KEY_NOT_VALID") ||
    text.includes("INVALID API_KEY") ||
    text.includes("INVALID_API_KEY")
  );
}

function isAudioResourceExhausted(info: GeminiAudioErrorInfo) {
  const text = audioErrorText(info);
  return (
    info.upstreamStatus === 429 ||
    text.includes("RESOURCE_EXHAUSTED") ||
    text.includes("RESOURCE HAS BEEN EXHAUSTED") ||
    text.includes("RESOURCE EXHAUSTED") ||
    text.includes("RATE LIMIT") ||
    text.includes("RATE_LIMIT") ||
    text.includes("QUOTA") ||
    text.includes("CAPACITY")
  );
}

function isAudioConnectionFailure(info: GeminiAudioErrorInfo) {
  const text = audioErrorText(info);
  return (
    text.includes("ECONN") ||
    text.includes("ENOTFOUND") ||
    text.includes("ETIMEDOUT") ||
    text.includes("NETWORK") ||
    text.includes("SOCKET") ||
    text.includes("WEBSOCKET") ||
    text.includes("CONNECTION") ||
    text.includes("CONNECTION CLOSED") ||
    text.includes("SESSION CLOSED")
  );
}

function getAudioFailureCategory(info: GeminiAudioErrorInfo): AudioFailureCategory {
  if (isAudioAuthFailure(info)) return "auth";
  if (isAudioResourceExhausted(info)) return "resource";
  if (
    info.isAbort ||
    info.name === "AudioGenerationTimeoutError" ||
    info.message.toLowerCase().includes("timed out") ||
    info.message.toLowerCase().includes("timeout")
  ) {
    return "timeout";
  }
  if (isAudioConnectionFailure(info)) return "connection";
  if (info.upstreamStatus === 400) return "invalid-request";
  if (
    info.upstreamStatus === 500 ||
    info.upstreamStatus === 502 ||
    info.upstreamStatus === 503 ||
    info.upstreamStatus === 504
  ) {
    return "upstream";
  }
  return "unknown";
}

function isAudioTransientFailure(info: GeminiAudioErrorInfo) {
  return ["connection", "resource", "timeout", "upstream"].includes(
    getAudioFailureCategory(info),
  );
}

function mapAudioFailureStatus(info: GeminiAudioErrorInfo) {
  if (info.isAbort) return 504;
  if (isAudioResourceExhausted(info)) return 429;
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

function logAudioError(
  info: GeminiAudioErrorInfo,
  model: string,
  voice: string,
  startedAt: number,
  label = "[YarnMe] Gemini audio request failed",
) {
  console.error(label, {
    elapsedMs: audioElapsedMs(startedAt),
    model,
    voice,
    errorName: info.name,
    errorMessage: info.message,
    upstreamStatus: info.upstreamStatus,
    upstreamStatusText: info.upstreamStatusText,
    errorCode: info.code,
    errorCategory: getAudioFailureCategory(info),
  });
}

function logAudioAttempt(
  message: string,
  startedAt: number,
  model: string,
  details: ErrorRecord = {},
) {
  logAudioDiagnostic(message, startedAt, {
    model,
    ...details,
  });
}

function isAudioTimeoutError(error: unknown) {
  return (
    error instanceof AudioGenerationTimeoutError ||
    (isRecord(error) &&
      readString(error, "name") === "AudioGenerationTimeoutError") ||
    (error instanceof Error && error.message === "Audio generation timed out")
  );
}

function buildAudioSystemInstruction(language: AudioLanguage) {
  const languageName =
    language === "hausa"
      ? "Hausa"
      : language === "pidgin"
        ? "Nigerian Pidgin"
        : "Simple English";

  return `You are the voice of YarnMe.

Read the following explanation clearly and naturally.

Do not summarize it.
Do not translate it.
Do not add or remove facts.
Do not answer questions.

Preserve names, dates, amounts, acronyms and official terms.

Selected language: ${languageName}

For Hausa:
Speak naturally in Hausa.

For Nigerian Pidgin:
Use a calm natural Nigerian conversational delivery. Do not convert the text into Standard English.

For Simple English:
Use clear, calm conversational delivery.

Read only the supplied text.`;
}

function buildAudioTurnText(text: string) {
  return `Read only the supplied text:

"""
${text}
"""`;
}

function wavFromPcm(pcm: Buffer) {
  const byteRate = AUDIO_SAMPLE_RATE * AUDIO_CHANNELS * (AUDIO_BITS_PER_SAMPLE / 8);
  const blockAlign = AUDIO_CHANNELS * (AUDIO_BITS_PER_SAMPLE / 8);
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(AUDIO_CHANNELS, 22);
  header.writeUInt32LE(AUDIO_SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(AUDIO_BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

function getEventError(event: ErrorEvent) {
  return event.error ?? event.message ?? event;
}

async function generateLiveAudio({
  apiKey,
  model,
  voice,
  text,
  language,
  startedAt,
  role,
}: {
  apiKey: string;
  model: string;
  voice: string;
  text: string;
  language: AudioLanguage;
  startedAt: number;
  role: AudioAttemptRole;
}) {
  const ai = new GoogleGenAI({ apiKey });
  const audioChunks: Buffer[] = [];
  let session: Session | null = null;
  let settled = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let firstServerMessageLogged = false;
  let firstAudioChunkLogged = false;
  let sessionClosedLogged = false;
  let turnComplete = false;

  function closeSession(activeSession: Session | null, reason: string) {
    if (activeSession) {
      try {
        activeSession.close();
      } catch (error) {
        const info = extractGeminiAudioErrorInfo(error);
        logAudioError(info, model, voice, startedAt, "[Audio] session close failed");
      }
    }
    if (!sessionClosedLogged) {
      sessionClosedLogged = true;
      logAudioDiagnostic("[Audio] session closed", startedAt, {
        hadSession: Boolean(activeSession),
        model,
        reason,
        role,
      });
    }
  }

  logAudioDiagnostic("[Audio] connecting", startedAt, { model, role, voice });

  const complete = new Promise<Buffer>((resolve, reject) => {
    function finish(error?: unknown) {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      if (error) {
        reject(error);
        return;
      }
      resolve(Buffer.concat(audioChunks));
    }

    timeout = setTimeout(() => {
      logAudioDiagnostic("[Audio] timeout", startedAt, {
        model,
        timeoutMs: AUDIO_TIMEOUT_MS,
      });
      finish(new AudioGenerationTimeoutError());
      closeSession(session, "timeout");
    }, AUDIO_TIMEOUT_MS);

    void ai.live
      .connect({
        model,
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts ?? [];
            if (!firstServerMessageLogged) {
              firstServerMessageLogged = true;
              logAudioDiagnostic("[Audio] first server message", startedAt, {
                model,
                partCount: parts.length,
                role,
              });
            }

            for (const part of parts) {
              const data = part.inlineData?.data;
              if (typeof data === "string" && data.length > 0) {
                const chunk = Buffer.from(data, "base64");
                audioChunks.push(chunk);
                if (!firstAudioChunkLogged) {
                  firstAudioChunkLogged = true;
                  logAudioDiagnostic("[Audio] first audio chunk", startedAt, {
                    model,
                    chunkBytes: chunk.length,
                    role,
                  });
                }
              }
            }

            if (message.serverContent?.turnComplete) {
              turnComplete = true;
              logAudioDiagnostic("[Audio] turn complete", startedAt, {
                model,
                chunkCount: audioChunks.length,
                pcmBytes: audioChunks.reduce((total, chunk) => total + chunk.length, 0),
                role,
              });
              finish();
            }
          },
          onerror: (event: ErrorEvent) => {
            const error = getEventError(event);
            const info = extractGeminiAudioErrorInfo(error);
            logAudioError(info, model, voice, startedAt, "[Audio] onerror");
            finish(error);
          },
          onclose: (event: CloseEvent) => {
            logAudioDiagnostic("[Audio] onclose", startedAt, {
              model,
              code: event.code,
              reason: event.reason ? limitDetail(redactSecrets(event.reason)) : "",
              role,
              turnComplete,
              wasClean: event.wasClean,
            });
            if (!settled) {
              finish(new Error(event.reason || "Gemini audio session closed before completion"));
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
          systemInstruction: buildAudioSystemInstruction(language),
        },
      })
      .then((connectedSession) => {
        logAudioDiagnostic(
          role === "fallback" ? "[Audio] fallback connected" : "[Audio] connected",
          startedAt,
          { model, role },
        );
        if (settled) {
          closeSession(connectedSession, "connected after request settled");
          return;
        }
        session = connectedSession;
        session.sendRealtimeInput({
          text: buildAudioTurnText(text),
        });
        logAudioDiagnostic("[Audio] text sent", startedAt, {
          model,
          role,
          textLength: text.length,
        });
      })
      .catch((error: unknown) => {
        const info = extractGeminiAudioErrorInfo(error);
        logAudioError(info, model, voice, startedAt, "[Audio] connect failed");
        finish(error);
      });
  });

  try {
    const pcm = await complete;
    if (pcm.length === 0) {
      throw new AudioNoChunksError();
    }
    return pcm;
  } finally {
    closeSession(session, "request settled");
  }
}

function createAudioResponse(
  pcm: Buffer,
  model: string,
  startedAt: number,
  role: AudioAttemptRole,
): Extract<AudioRouteResult, { ok: true }> {
  const wav = wavFromPcm(pcm);
  logAudioDiagnostic("[Audio] wav created", startedAt, {
    fallbackUsed: role === "fallback",
    model,
    pcmBytes: pcm.length,
    role,
    wavBytes: wav.length,
  });

  return {
    ok: true,
    status: 200,
    audio: new Uint8Array(wav),
    headers: {
      "Cache-Control": "no-store",
      "Content-Length": String(wav.length),
      "Content-Type": "audio/wav",
      "X-YarnMe-Audio-Model": model,
    },
  };
}

function clientAudioErrorMessage(_info: GeminiAudioErrorInfo, error: unknown) {
  if (isAudioTimeoutError(error)) {
    return "Audio generation timed out";
  }
  return AUDIO_UNAVAILABLE_MESSAGE;
}

export async function handleAudioRequest(body: unknown): Promise<AudioRouteResult> {
  const parsed = audioRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      data: {
        error:
          parsed.error.issues[0]?.message ||
          "YarnMe could not prepare this explanation for audio.",
      },
    };
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.error("[YarnMe] Gemini audio is not configured", {
      missing: "GEMINI_API_KEY",
    });
    return {
      ok: false,
      status: 500,
      data: {
        error: AUDIO_UNAVAILABLE_MESSAGE,
      },
    };
  }

  const primaryModel = getAudioPrimaryModel();
  const fallbackModel = getAudioFallbackModel();
  const voice = getAudioVoice();
  const startedAt = Date.now();

  logAudioAttempt("[Audio] trying primary model", startedAt, primaryModel, {
    fallbackModel,
    transcriptChars: parsed.data.text.length,
    voice,
  });

  try {
    const pcm = await generateLiveAudio({
      apiKey,
      model: primaryModel,
      voice,
      text: parsed.data.text,
      language: parsed.data.language,
      startedAt,
      role: "primary",
    });

    return createAudioResponse(pcm, primaryModel, startedAt, "primary");
  } catch (primaryError) {
    const primaryInfo = extractGeminiAudioErrorInfo(primaryError);
    logAudioError(
      primaryInfo,
      primaryModel,
      voice,
      startedAt,
      "[YarnMe] Gemini primary audio request failed",
    );

    const shouldFallback =
      fallbackModel !== primaryModel && isAudioTransientFailure(primaryInfo);

    if (shouldFallback) {
      const primaryCategory = getAudioFailureCategory(primaryInfo);
      logAudioDiagnostic(
        primaryCategory === "resource"
          ? "[Audio] primary resource exhausted"
          : "[Audio] primary transient failure",
        startedAt,
        {
          errorCode: primaryInfo.code,
          errorCategory: primaryCategory,
          fallbackUsed: true,
          fallbackModel,
          model: primaryModel,
          upstreamStatus: primaryInfo.upstreamStatus,
          upstreamStatusText: primaryInfo.upstreamStatusText,
        },
      );
      logAudioAttempt("[Audio] trying fallback model", startedAt, fallbackModel, {
        transcriptChars: parsed.data.text.length,
        voice,
      });

      try {
        const fallbackPcm = await generateLiveAudio({
          apiKey,
          model: fallbackModel,
          voice,
          text: parsed.data.text,
          language: parsed.data.language,
          startedAt,
          role: "fallback",
        });

        return createAudioResponse(fallbackPcm, fallbackModel, startedAt, "fallback");
      } catch (fallbackError) {
        const fallbackInfo = extractGeminiAudioErrorInfo(fallbackError);
        logAudioError(
          fallbackInfo,
          fallbackModel,
          voice,
          startedAt,
          "[YarnMe] Gemini fallback audio request failed",
        );
        return {
          ok: false,
          status: mapAudioFailureStatus(fallbackInfo),
          data: {
            error: clientAudioErrorMessage(fallbackInfo, fallbackError),
          },
        };
      }
    }

    return {
      ok: false,
      status: mapAudioFailureStatus(primaryInfo),
      data: {
        error: clientAudioErrorMessage(primaryInfo, primaryError),
      },
    };
  }
}
