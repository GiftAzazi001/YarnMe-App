import {
  IMAGE_UPLOAD_MAX_BYTES,
  type LanguageCode,
} from "@/lib/analysis";

const uploadLimitMb = Math.floor(IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024));

export const analysisLanguageOptions: Array<{
  label: string;
  value: LanguageCode;
}> = [
  { label: "Simple English", value: "simple-english" },
  { label: "Pidgin", value: "pidgin" },
  { label: "Hausa", value: "hausa" },
];

export const analysisLanguageLabels: Record<LanguageCode, string> = {
  "simple-english": "Simple English",
  pidgin: "Pidgin",
  hausa: "Hausa",
};

export type HomeExampleKey = "scholarship" | "government" | "school";

type HomeCopy = {
  eyebrow: string;
  heading: string;
  supporting: string;
  desktopSupporting: string;
  languageLine: string;
  explainIn: string;
  pasteTab: string;
  uploadTab: string;
  textareaLabel: string;
  textareaPlaceholder: string;
  uploadTitle: string;
  uploadSubtitle: string;
  browseFiles: string;
  replaceFile: string;
  pdfDocument: string;
  removeUploadedFile: string;
  imagePreviewAlt: (name: string) => string;
  fileTypes: Record<"image" | "pdf", string>;
  ready: string;
  cta: string;
  analyzing: string;
  tryOne: string;
  trust: string;
  examples: Record<HomeExampleKey, string>;
  howItWorks: Array<{
    title: string;
    body: string;
  }>;
  errors: {
    unsupportedFile: string;
    unreadableFile: string;
    fileTooLarge: (limitMb: number) => string;
    uploadRequired: string;
    pasteRequired: string;
  };
};

type HistoryCopy = {
  title: string;
  emptyBody: string;
  startYarn: string;
  trySampleNotice: string;
  subtitle: string;
  fallbackTitle: string;
  today: string;
  incomplete: string;
  clear: string;
  explainAnother: string;
};

type SettingsCopy = {
  title: string;
  defaultLanguage: string;
  textSize: string;
  textSizeOptions: Record<"small" | "medium" | "large", string>;
};

type NavigationCopy = {
  yarn: string;
  history: string;
  settings: string;
  homeAria: string;
};

type RuntimeErrorCopy = {
  emptySource: string;
  genericAnalysis: string;
  unexpectedFormat: string;
  parseFailed: string;
  connection: string;
};

type AppCopy = {
  navigation: NavigationCopy;
  home: HomeCopy;
  history: HistoryCopy;
  settings: SettingsCopy;
  runtimeErrors: RuntimeErrorCopy;
};

export const appCopy: Record<LanguageCode, AppCopy> = {
  "simple-english": {
    navigation: {
      yarn: "Yarn",
      history: "History",
      settings: "Settings",
      homeAria: "YarnMe home",
    },
    home: {
      eyebrow: "LOCAL-LANGUAGE INFORMATION ASSISTANT",
      heading: "What do you need explained?",
      supporting: "Paste it here. YarnMe will make it clear.",
      desktopSupporting:
        "Turn confusing notices and documents into clear information and next steps.",
      languageLine: "Hausa - Nigerian Pidgin - Simple English",
      explainIn: "Explain in",
      pasteTab: "Paste Text",
      uploadTab: "Upload File",
      textareaLabel: "Paste the information",
      textareaPlaceholder:
        "Paste the notice or information you want YarnMe to explain…",
      uploadTitle: "Drop a PDF or image here",
      uploadSubtitle: `PDF, JPG, PNG or WEBP - up to ${uploadLimitMb}MB`,
      browseFiles: "Browse files",
      replaceFile: "Replace file",
      pdfDocument: "PDF document",
      removeUploadedFile: "Remove uploaded file",
      imagePreviewAlt: (name) => `Preview of ${name}`,
      fileTypes: {
        image: "Image",
        pdf: "PDF",
      },
      ready: "ready",
      cta: "Explain it →",
      analyzing: "Explaining...",
      tryOne: "Try an example",
      trust: "YarnMe only explains what it can confirm. It won't guess.",
      examples: {
        scholarship: "Scholarship notice",
        government: "Government notice",
        school: "School announcement",
      },
      howItWorks: [
        { title: "Drop it", body: "Paste text or upload file." },
        { title: "Choose language", body: "Hausa, Pidgin or Simple English." },
        {
          title: "Understand it",
          body: "See important details and what you need to do next.",
        },
      ],
      errors: {
        unsupportedFile:
          "YarnMe can read PNG, JPG, JPEG, WEBP, and PDF files for now.",
        unreadableFile: "This file could not be read. Please choose another file.",
        fileTooLarge: (limitMb) =>
          `This file is too large. Please upload a file under ${limitMb}MB.`,
        uploadRequired:
          "Please upload a PNG, JPG, JPEG, WEBP, or PDF file first.",
        pasteRequired:
          "Please paste your notice first, or tap one of the examples below.",
      },
    },
    history: {
      title: "Your Yarn",
      emptyBody:
        "Your recent explanations will appear here after you yarn a notice.",
      startYarn: "Paste new notice",
      trySampleNotice: "Try sample notice",
      subtitle: "Review your recent explanations and insights.",
      fallbackTitle: "YarnMe explanation",
      today: "Today",
      incomplete: "Incomplete",
      clear: "Clear",
      explainAnother: "Explain another notice",
    },
    settings: {
      title: "Settings",
      defaultLanguage: "Default Language",
      textSize: "Text Size",
      textSizeOptions: {
        small: "Small",
        medium: "Medium",
        large: "Large",
      },
    },
    runtimeErrors: {
      emptySource: "Please enter, paste, or upload your notice first.",
      genericAnalysis:
        "YarnMe could not explain this notice right now. Please try again.",
      unexpectedFormat:
        "Received an unexpected format from the server. Please try again.",
      parseFailed: "Could not parse the explanation response.",
      connection:
        "Could not connect to YarnMe server. Please check your internet connection.",
    },
  },
  pidgin: {
    navigation: {
      yarn: "Yarn",
      history: "History",
      settings: "Settings",
      homeAria: "YarnMe home",
    },
    home: {
      eyebrow: "LOCAL-LANGUAGE INFORMATION ASSISTANT",
      heading: "Wetin you no understand?",
      supporting: "Drop am here, YarnMe go break am down.",
      desktopSupporting:
        "Turn confusing notices and documents into clear information and next steps.",
      languageLine: "Hausa - Nigerian Pidgin - Simple English",
      explainIn: "Make am clear in",
      pasteTab: "Paste Text",
      uploadTab: "Upload File",
      textareaLabel: "Paste the information",
      textareaPlaceholder:
        "Paste the notice or information wey you want make YarnMe explain…",
      uploadTitle: "Drop PDF or image here",
      uploadSubtitle: `PDF, JPG, PNG or WEBP - up to ${uploadLimitMb}MB`,
      browseFiles: "Browse files",
      replaceFile: "Replace file",
      pdfDocument: "PDF document",
      removeUploadedFile: "Remove uploaded file",
      imagePreviewAlt: (name) => `Preview of ${name}`,
      fileTypes: {
        image: "Image",
        pdf: "PDF",
      },
      ready: "ready",
      cta: "Yarn am →",
      analyzing: "We dey yarn am...",
      tryOne: "Try example",
      trust: "If the source no talk am, YarnMe no go guess.",
      examples: {
        scholarship: "Scholarship notice",
        government: "Government notice",
        school: "School announcement",
      },
      howItWorks: [
        { title: "Drop am", body: "Paste text or upload file." },
        { title: "Choose language", body: "Hausa, Pidgin or Simple English." },
        {
          title: "Understand am",
          body: "See important details and wetin you need do next.",
        },
      ],
      errors: {
        unsupportedFile:
          "YarnMe fit read PNG, JPG, JPEG, WEBP, and PDF files for now.",
        unreadableFile: "YarnMe no fit read this file. Choose another file.",
        fileTooLarge: (limitMb) =>
          `This file too large. Abeg upload file wey dey under ${limitMb}MB.`,
        uploadRequired: "Abeg upload PNG, JPG, JPEG, WEBP, or PDF file first.",
        pasteRequired: "Abeg paste your notice first, or tap one example below.",
      },
    },
    history: {
      title: "Your Yarn",
      emptyBody:
        "Paste notice, upload document, or try one example make you see how YarnMe works.",
      startYarn: "Paste new notice",
      trySampleNotice: "Try sample notice",
      subtitle: "Check your recent explanations and insights.",
      fallbackTitle: "YarnMe explanation",
      today: "Today",
      incomplete: "Incomplete",
      clear: "Clear",
      explainAnother: "Explain another notice",
    },
    settings: {
      title: "Settings",
      defaultLanguage: "Default Language",
      textSize: "Text Size",
      textSizeOptions: {
        small: "Small",
        medium: "Normal",
        large: "Large",
      },
    },
    runtimeErrors: {
      emptySource: "Abeg enter, paste, or upload your notice first.",
      genericAnalysis:
        "YarnMe no fit explain this notice now. Abeg try again.",
      unexpectedFormat:
        "Server send format wey YarnMe no expect. Abeg try again.",
      parseFailed: "YarnMe no fit read the explanation response.",
      connection:
        "YarnMe no fit connect to server. Abeg check your internet connection.",
    },
  },
  hausa: {
    navigation: {
      yarn: "Bayani",
      history: "Tarihi",
      settings: "Saituna",
      homeAria: "Shafin YarnMe",
    },
    home: {
      eyebrow: "MAI TAIMAKON BAYANI A YAREN GIDA",
      heading: "Me kake son fahimta?",
      supporting: "Saka shi nan, YarnMe zai saukaka maka.",
      desktopSupporting:
        "Mayar da sanarwa da takardu masu rikitarwa zuwa bayani mai sauki da matakai na gaba.",
      languageLine: "Hausa - Nigerian Pidgin - Simple English",
      explainIn: "A bayyana da",
      pasteTab: "Manna Rubutu",
      uploadTab: "Saka Fayil",
      textareaLabel: "Manna bayanin",
      textareaPlaceholder:
        "Manna sanarwa ko bayanin da kake son YarnMe ya bayyana…",
      uploadTitle: "Ajiye PDF ko hoto a nan",
      uploadSubtitle: `PDF, JPG, PNG ko WEBP - har zuwa ${uploadLimitMb}MB`,
      browseFiles: "Zabi fayil",
      replaceFile: "Sauya fayil",
      pdfDocument: "Takardar PDF",
      removeUploadedFile: "Cire fayil din da aka saka",
      imagePreviewAlt: (name) => `Samfurin ${name}`,
      fileTypes: {
        image: "Hoto",
        pdf: "PDF",
      },
      ready: "a shirye",
      cta: "Fayyace shi →",
      analyzing: "Ana fayyacewa...",
      tryOne: "Gwada misali",
      trust:
        "YarnMe yana bayyana abin da zai iya tabbatarwa ne kawai. Ba zai yi zato ba.",
      examples: {
        scholarship: "Sanarwar tallafin karatu",
        government: "Sanarwar gwamnati",
        school: "Sanarwar makaranta",
      },
      howItWorks: [
        { title: "Saka shi", body: "Manna rubutu ko saka fayil." },
        { title: "Zabi yare", body: "Hausa, Pidgin ko Simple English." },
        {
          title: "Fahimce shi",
          body: "Duba muhimman bayanai da abin da za ka yi na gaba.",
        },
      ],
      errors: {
        unsupportedFile:
          "A yanzu YarnMe na iya karanta fayilolin PNG, JPG, JPEG, WEBP, da PDF.",
        unreadableFile: "Ba a iya karanta wannan fayil ba. Zabi wani fayil.",
        fileTooLarge: (limitMb) =>
          `Wannan fayil ya yi girma. Saka fayil kasa da ${limitMb}MB.`,
        uploadRequired:
          "Da farko, saka fayil na PNG, JPG, JPEG, WEBP, ko PDF.",
        pasteRequired:
          "Da farko, manna sanarwarka ko ka taba daya daga cikin misalan kasa.",
      },
    },
    history: {
      title: "Bayanan ka",
      emptyBody:
        "Bayanan da ka yi kwanan nan za su bayyana a nan bayan ka fayyace sanarwa.",
      startYarn: "Fara Bayani",
      trySampleNotice: "Gwada Misalin Sanarwa",
      subtitle: "Duba bayanan da aka saukaka kwanan nan.",
      fallbackTitle: "Bayanin YarnMe",
      today: "Yau",
      incomplete: "Bai cika ba",
      clear: "Ya bayyana",
      explainAnother: "Fayyace wata sanarwa",
    },
    settings: {
      title: "Saituna",
      defaultLanguage: "Yaren Farko",
      textSize: "Girman Rubutu",
      textSizeOptions: {
        small: "Karami",
        medium: "Matsakaici",
        large: "Babba",
      },
    },
    runtimeErrors: {
      emptySource: "Da farko, shigar, manna, ko saka sanarwarka.",
      genericAnalysis:
        "YarnMe bai iya bayyana wannan sanarwa yanzu ba. Sake gwadawa.",
      unexpectedFormat:
        "An karbi tsari da YarnMe bai zata daga uwar garke ba. Sake gwadawa.",
      parseFailed: "Ba a iya karanta amsar bayanin ba.",
      connection:
        "Ba a iya hada YarnMe da uwar garke ba. Duba hadin intanet dinka.",
    },
  },
};
