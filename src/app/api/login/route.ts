import { NextRequest, NextResponse } from "next/server";

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const input = String(form.get("password") ?? "");
  const password = process.env.SITE_PASSWORD;

  if (!password || input !== password) {
    return NextResponse.redirect(new URL("/login?err=1", req.url), 303);
  }

  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set("jh_auth", await sha256(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
