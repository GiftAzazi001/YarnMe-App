import { z } from "zod";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const PDF_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const PDF_UPLOAD_MAX_PAGES = 15;
export const supportedImageMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export const supportedPdfMimeTypes = ["application/pdf"] as const;
export const supportedUploadMimeTypes = [
  ...supportedImageMimeTypes,
  ...supportedPdfMimeTypes,
] as const;

export type SupportedImageMimeType = (typeof supportedImageMimeTypes)[number];
export type SupportedPdfMimeType = (typeof supportedPdfMimeTypes)[number];
export type SupportedUploadMimeType = (typeof supportedUploadMimeTypes)[number];

export const languageSchema = z.enum(["simple-english", "pidgin", "hausa"]);
export type LanguageCode = z.infer<typeof languageSchema>;

export const languageNames: Record<LanguageCode, string> = {
  "simple-english": "Simple English",
  pidgin: "Nigerian Pidgin",
  hausa: "Hausa",
};

export const analyzeRequestSchema = z.object({
  sourceText: z
    .string()
    .trim()
    .min(1, "Paste some text first so YarnMe can explain it.")
    .max(15000, "This text is too long for this phase. Try a shorter notice."),
  language: languageSchema,
});

const nonEmptyString = z.string().trim().min(1);

export const analysisResultSchema = z
  .object({
    meaning: nonEmptyString,
    audience: z.string().trim(),
    eligibility: z.array(nonEmptyString),
    actions: z.array(nonEmptyString),
    documents: z.array(nonEmptyString),
    payments: z.array(
      z
        .object({
          amount: nonEmptyString,
          purpose: nonEmptyString,
          when: nonEmptyString,
          who: nonEmptyString,
        })
        .strict(),
    ),
    dates: z.array(
      z
        .object({
          date: nonEmptyString,
          context: nonEmptyString,
        })
        .strict(),
    ),
    warnings: z.array(nonEmptyString),
    uncertainties: z.array(
      z
        .object({
          text: nonEmptyString,
          reason: nonEmptyString,
        })
        .strict(),
    ),
    sourceLimitations: z.array(nonEmptyString),
  })
  .strict();

export const analyzeResponseSchema = z
  .object({
    analysis: analysisResultSchema,
    language: languageSchema,
    sourceText: nonEmptyString,
    model: z.string().trim().optional(),
  })
  .strict();

export const pendingAnalysisSchema = analyzeRequestSchema.extend({
  createdAt: z.string().datetime(),
});

export const storedAnalysisSchema = analyzeResponseSchema.extend({
  createdAt: z.string().datetime(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
export type PendingAnalysis = z.infer<typeof pendingAnalysisSchema>;
export type StoredAnalysis = z.infer<typeof storedAnalysisSchema>;

type GeminiJsonSchema = {
  type: "object" | "array" | "string";
  description?: string;
  properties?: Record<string, GeminiJsonSchema>;
  items?: GeminiJsonSchema;
  required?: string[];
  additionalProperties?: boolean;
  minLength?: number;
  propertyOrdering?: string[];
};

const requiredAnalysisFields = [
  "meaning",
  "audience",
  "eligibility",
  "actions",
  "documents",
  "payments",
  "dates",
  "warnings",
  "uncertainties",
  "sourceLimitations",
] as const;

const nonEmptyStringJsonSchema = {
  type: "string",
  minLength: 1,
} satisfies GeminiJsonSchema;

export const analysisJsonSchema = {
  type: "object",
  description:
    "A YarnMe translation and explanation of a supplied source text in the selected output language.",
  additionalProperties: false,
  properties: {
    meaning: {
      ...nonEmptyStringJsonSchema,
      description:
        "The main translation and plain-language explanation of what the supplied source means, written entirely in the selected output language.",
    },
    audience: {
      type: "string",
      description:
        "Who the source concerns, written in the selected output language. If not clearly stated, explain in the selected output language that it is not stated.",
    },
    eligibility: {
      type: "array",
      description:
        "Eligibility conditions explicitly stated in the source, translated into the selected output language. Do not complete partial requirements or add common institutional requirements.",
      items: nonEmptyStringJsonSchema,
    },
    actions: {
      type: "array",
      description:
        "Step-by-step actions the user should take, translated into the selected output language, only when directly supported by the source. Return an empty array if none are stated. Do not number the strings.",
      items: nonEmptyStringJsonSchema,
    },
    documents: {
      type: "array",
      description:
        "Documents, forms, IDs, photos, certificates, or other items explicitly required by the source, described in the selected output language. Do not complete partial document names or image requirements.",
      items: nonEmptyStringJsonSchema,
    },
    payments: {
      type: "array",
      description:
        "Payments, fees, or charges explicitly stated in the source. Return an empty array if none are stated.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          amount: {
            ...nonEmptyStringJsonSchema,
            description:
              "The exact amount stated in the source. If the amount is missing or cut off, say in the selected output language that it is not stated or incomplete.",
          },
          purpose: {
            ...nonEmptyStringJsonSchema,
            description:
              "What the payment is for, translated into the selected output language. If missing or cut off, say in the selected output language that it is not stated or incomplete.",
          },
          when: {
            ...nonEmptyStringJsonSchema,
            description:
              "When the payment is due or should be made, translated into the selected output language. If missing or cut off, say in the selected output language that it is not stated or incomplete.",
          },
          who: {
            ...nonEmptyStringJsonSchema,
            description:
              "Who should pay or who receives the payment, translated into the selected output language. If missing or cut off, say in the selected output language that it is not stated or incomplete.",
          },
        },
        required: ["amount", "purpose", "when", "who"],
        propertyOrdering: ["amount", "purpose", "when", "who"],
      },
    },
    dates: {
      type: "array",
      description:
        "Dates or deadlines explicitly present in the source. Return an empty array if none are present. Never invent missing dates.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          date: {
            ...nonEmptyStringJsonSchema,
            description: "The exact date or deadline as stated in the source.",
          },
          context: {
            ...nonEmptyStringJsonSchema,
            description:
              "What the date means (such as a deadline, event date, or submission date), translated into the selected output language.",
          },
        },
        required: ["date", "context"],
        propertyOrdering: ["date", "context"],
      },
    },
    warnings: {
      type: "array",
      description:
        "Important warnings, consequences, limits, or conditions stated or clearly implied by the source, translated into the selected output language.",
      items: nonEmptyStringJsonSchema,
    },
    uncertainties: {
      type: "array",
      description:
        "Ambiguous, missing, or uncertain parts that a human should review before acting. Return an empty array when everything is clear.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: {
            ...nonEmptyStringJsonSchema,
            description: "The unclear source wording or missing point from the original text.",
          },
          reason: {
            ...nonEmptyStringJsonSchema,
            description: "Why this part is unclear or needs review, written in the selected output language.",
          },
        },
        required: ["text", "reason"],
        propertyOrdering: ["text", "reason"],
      },
    },
    sourceLimitations: {
      type: "array",
      description:
        "Important things the source does not say but a user might need before acting, written in the selected output language. Do not turn these into facts.",
      items: nonEmptyStringJsonSchema,
    },
  },
  required: [...requiredAnalysisFields],
  propertyOrdering: [...requiredAnalysisFields],
} satisfies GeminiJsonSchema;
