import { NextResponse } from "next/server";
import {
  handleAnalyzeUploadFormData,
  handleAnalyzeRequest,
} from "@/lib/server-analysis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const result = contentType.includes("multipart/form-data")
      ? await request
          .formData()
          .then(handleAnalyzeUploadFormData)
          .catch(() => ({
            status: 400,
            data: {
              error: "This upload could not be read. Please choose the file again.",
            },
          }))
      : await handleAnalyzeRequest(await request.json().catch(() => null));

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    console.error("Unhandled error in /api/analyze route:", error);
    return NextResponse.json(
      {
        error: "YarnMe server encountered an unexpected error. Please try again.",
      },
      { status: 500 },
    );
  }
}
