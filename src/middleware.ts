import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/webhook", "/api/contacts"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORS para todas las rutas API
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders() });
  }

  // Rutas públicas — no requieren auth
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) {
    const res = NextResponse.next();
    if (pathname.startsWith("/api/")) {
      Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v));
    }
    return res;
  }

  // Verificar sesión en todas las demás rutas
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const username = token ? await verifySessionToken(token) : null;

  if (!username) {
    // Redirigir a login si no está autenticado
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Autenticado — aplicar CORS si es API y continuar
  const res = NextResponse.next();
  if (pathname.startsWith("/api/")) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v));
  }
  return res;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
