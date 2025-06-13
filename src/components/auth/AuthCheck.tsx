'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthCheckProps {
  children: React.ReactNode;
  excludePaths?: string[];
}

export function AuthCheck({ children, excludePaths = ['/admin-setup'] }: AuthCheckProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  const isExcludedPath = excludePaths.includes(pathname);
  const isLoginPage = pathname === '/';
  
  useEffect(() => {
    // Se estiver carregando, não fazer nada ainda
    if (status === 'loading') return;
    
    // Se estiver em uma rota excluída, não verificar autenticação
    if (isExcludedPath) return;
    
    // Se não estiver autenticado e não estiver na página de login, redirecionar para login
    if (!session && !isLoginPage) {
      router.push('/');
    }
    
    // Se estiver autenticado e estiver na página de login, redirecionar para dashboard
    if (session && isLoginPage) {
      router.push('/dashboard');
    }
  }, [session, status, isExcludedPath, isLoginPage, router]);
  
  // Se estiver carregando e não for uma rota excluída, mostrar indicador de carregamento
  if (status === 'loading' && !isExcludedPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }
  
  return <>{children}</>;
}