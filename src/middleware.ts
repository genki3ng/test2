import { NextRequest, NextResponse } from "next/server";

// 可选密码门：在 Vercel 项目设置里配 SITE_PASSWORD 环境变量即启用；
// 不配则全站公开（首次部署零配置可用）。
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const expected = await sha256(password);
  const cookie = req.cookies.get("jh_auth")?.value;
  if (cookie === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // 放行登录页、登录接口、静态资源
    "/((?!login|api/login|_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};
