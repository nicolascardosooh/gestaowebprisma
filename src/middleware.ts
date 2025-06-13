// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Caminhos públicos que não precisam de autenticação
  const publicPaths = ['/', '/admin-setup'];
  
  // Verificar se o caminho atual é público
  const isPublicPath = publicPaths.includes(path);
  
  // Obter o token de autenticação
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'seu-segredo-temporario',
  });
  
  // Se o caminho não for público e não houver token, redirecionar para login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Se estiver na página de login e já estiver autenticado, redirecionar para dashboard
  if (path === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Configurar os caminhos que o middleware deve ser executado
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};