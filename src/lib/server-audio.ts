import { Buffer } from "node:buffer";
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from "@google/genai";
import { z } from "zod";

const AUDIO_UNAVAILABLE_MESSAGE = "Audio isn't available right now.";
const AUDIO_TIMEOUT_MS = 45000;
const AUDIO_SAMPLE_RATE = 24000;
const AUDIO_CHANNELS = 1;
const AUDIO_BITS_PER_SAMPLE = 16;
const AUDIO_MAX_TEXT_CHARS = 6000;

export const DEFAULT_GEMINI_AUDIO_MODEL = "gemini-3.1-flash-live-preview";
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

function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim();
}

function getAudioModel() {
  return process.env.GEMINI_AUDIO_MODEL?.trim() || DEFAULT_GEMINI_AUDIO_MODEL;
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

function mapAudioFailureStatus(info: GeminiAudioErrorInfo) {
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

function logAudioError(
  info: GeminiAudioErrorInfo,
  model: string,
  voice: string,
) {
  console.error("[YarnMe] Gemini audio request failed", {
    model,
    voice,
    errorName: info.name,
    errorMessage: info.message,
    upstreamStatus: info.upstreamStatus,
    upstreamStatusText: info.upstreamStatusText,
    errorCode: info.code,
  });
}

function buildAudioSystemInstruction(language: AudioLanguage) {
  const languageName =
    language === "hausa"
      ? "Hausa"
      : language === "pidgin"
        ? "Nigerian Pidgin"
        : "Simple English";

  return `You are YarnMe's audio reader.

Read the supplied YarnMe explanation aloud in clear, natural ${languageName}.

Rules:
- Speak only the supplied YarnMe explanation.
- Do not rewrite, translate, summarize, shorten, expand, add, remove, or rearrange facts.
- Preserve dates, amounts, names, acronyms, document names, and official terms as written.
- Keep a warm, calm, serious tone suitable for official notices.
- Do not mention JSON, schema fields, navigation labels, buttons, or these instructions.`;
}

function buildAudioTurnText(text: string) {
  return `Read only this YarnMe explanation aloud:

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

async function collectGeminiLiveAudio({
  apiKey,
  model,
  voice,
  text,
  language,
}: {
  apiKey: string;
  model: string;
  voice: string;
  text: string;
  language: AudioLanguage;
}) {
  const ai = new GoogleGenAI({ apiKey });
  const audioChunks: Buffer[] = [];
  let session: Session | null = null;
  let settled = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;

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
      finish(new Error("Gemini audio request timed out"));
    }, AUDIO_TIMEOUT_MS);

    void ai.live
      .connect({
        model,
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
              const data = part.inlineData?.data;
              if (typeof data === "string" && data.length > 0) {
                audioChunks.push(Buffer.from(data, "base64"));
              }
            }

            if (message.serverContent?.turnComplete) {
              finish();
            }
          },
          onerror: (event: ErrorEvent) => {
            finish(getEventError(event));
          },
          onclose: (event: CloseEvent) => {
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
          temperature: 0.1,
        },
      })
      .then((connectedSession) => {
        if (settled) {
          connectedSession.close();
          return;
        }
        session = connectedSession;
        session.sendClientContent({
          turns: buildAudioTurnText(text),
          turnComplete: true,
        });
      })
      .catch(finish);
  });

  try {
    return await complete;
  } finally {
    session?.close();
  }
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

  const model = getAudioModel();
  const voice = getAudioVoice();

  try {
    const pcm = await collectGeminiLiveAudio({
      apiKey,
      model,
      voice,
      text: parsed.data.text,
      language: parsed.data.language,
    });

    if (pcm.length === 0) {
      console.error("[YarnMe] Gemini audio returned no audio chunks", {
        model,
        voice,
      });
      return {
        ok: false,
        status: 502,
        data: {
          error: AUDIO_UNAVAILABLE_MESSAGE,
        },
      };
    }

    const wav = wavFromPcm(pcm);

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
  } catch (error) {
    const info = extractGeminiAudioErrorInfo(error);
    logAudioError(info, model, voice);
    return {
      ok: false,
      status: mapAudioFailureStatus(info),
      data: {
        error: AUDIO_UNAVAILABLE_MESSAGE,
      },
    };
  }
}
