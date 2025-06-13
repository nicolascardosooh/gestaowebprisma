import { auth } from "./auth"
 
export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnAdminSetup = req.nextUrl.pathname.startsWith('/admin-setup')
  
  // Permitir acesso à página admin-setup sem autenticação
  if (isOnAdminSetup) {
    return
  }
  
  // Permitir acesso à página inicial para login
  if (req.nextUrl.pathname === '/') {
    return
  }
  
  // Redirecionar para login se não estiver autenticado
  if (!isLoggedIn) {
    return Response.redirect(new URL('/', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}