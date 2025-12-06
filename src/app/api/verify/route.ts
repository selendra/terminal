import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, compiler, version, license, sourceCode } = body;

    // Basic validation
    if (!address || !compiler || !version || !sourceCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate a mock job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return NextResponse.json({
      jobId,
      status: "queued",
      message: "Verification request submitted successfully",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
