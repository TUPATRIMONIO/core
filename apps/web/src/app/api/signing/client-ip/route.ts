import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get IP from headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  // Determine the best IP to use
  // x-forwarded-for can be a comma-separated list, take the first one
  let ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp;
  
  // Fallback if no headers found (e.g. local dev)
  if (!ip) {
    ip = "127.0.0.1";
  }

  return NextResponse.json({ ip });
}
