import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  // Simulate processing delay (randomly return 'processing' or 'success')
  // In a real app, this would check a database or queue
  const isComplete = Math.random() > 0.3; // 70% chance of completion for demo purposes

  if (!isComplete) {
    return NextResponse.json({
      jobId,
      status: "processing",
      message: "Verification in progress...",
    });
  }

  return NextResponse.json({
    jobId,
    status: "success", // or 'failed'
    message: "Contract verified successfully!",
    result: {
      verifiedAt: new Date().toISOString(),
      compilerVersion: "v0.8.19+commit.7dd6d404",
      optimization: true,
    },
  });
}
