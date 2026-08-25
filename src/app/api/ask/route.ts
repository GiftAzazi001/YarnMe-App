import { NextResponse } from "next/server";
import {
  handleAskUploadFormData,
  handleAskRequest,
} from "@/lib/server-analysis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const result = contentType.includes("multipart/form-data")
      ? await request
          .formData()
          .then(handleAskUploadFormData)
          .catch(() => ({
            status: 400,
            data: {
              error: "This upload could not be read. Please choose the file again.",
            },
          }))
      : await handleAskRequest(await request.json().catch(() => null));

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    console.error("Unhandled error in /api/ask route:", error);
    return NextResponse.json(
      {
        error: "Failed to answer question.",
      },
      { status: 500 },
    );
  }
}
