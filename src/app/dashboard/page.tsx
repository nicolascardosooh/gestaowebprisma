'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiGrid, FiMenu, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

// Interface para os módulos
interface Module {
  id: string;
  name: string;
  description?: string;
  icon: string;
  order: number;
  menus: Menu[];
}

// Interface para os menus
interface Menu {
  id: string;
  name: string;
  description?: string;
  path: string;
  icon?: string;
  moduleId: string;
  parentId?: string;
  children?: Menu[];
  order: number;
  permissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Carregar módulos e menus com permissões
  useEffect(() => {
    const fetchModulesAndMenus = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          setLoading(true);
          const response = await fetch('/api/dashboard/modules');
          
          if (!response.ok) {
            throw new Error('Falha ao carregar módulos');
          }
          
          const data = await response.json();
          setModules(data);
        } catch (err: any) {
          setError(err.message || 'Erro ao carregar módulos');
          console.error('Erro ao carregar módulos:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchModulesAndMenus();
  }, [status, session]);

  // Função para renderizar o ícone correto
  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'grid':
        return <FiGrid />;
      case 'user':
        return <FiUser />;
      case 'settings':
        return <FiSettings />;
      default:
        return <FiGrid />;
    }
  };

  // Função para lidar com o logout
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 transition-all duration-300 ease-in-out`}>
        <div className="flex h-20 items-center justify-between px-4">
          {sidebarOpen ? (
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="font-bold">GW</span>
              </div>
              <span className="ml-3 text-xl font-semibold">Gestão Web</span>
            </div>
          ) : (
            <div className="mx-auto h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="font-bold">GW</span>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            <FiMenu />
          </button>
        </div>

        <div className="mt-5 px-2">
          {modules.map((module) => (
            <div key={module.id} className="mb-6">
              {sidebarOpen && (
                <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {module.name}
                </h3>
              )}
              <div className="space-y-1">
                {module.menus && module.menus.length > 0 ? (
                  module.menus
                    .filter(menu => !menu.parentId && menu.permissions?.canView)
                    .sort((a, b) => a.order - b.order)
                    .map((menu) => (
                      <Link 
                        href={menu.path} 
                        key={menu.id}
                        className="flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <span className="mr-3">{renderIcon(menu.icon)}</span>
                        {sidebarOpen && <span>{menu.name}</span>}
                      </Link>
                    ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-400">Sem menus disponíveis</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-md px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white ${
              sidebarOpen ? '' : 'justify-center'
            }`}
          >
            <FiLogOut className="mr-3" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-gray-800 shadow">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="flex items-center">
              <span className="mr-4">{session?.user?.name}</span>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="font-bold">{session?.user?.name?.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-900 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div key={module.id} className="rounded-lg bg-gray-800 p-6 shadow-lg">
                <div className="mb-4 flex items-center">
                  <div className="mr-4 rounded-full bg-blue-600 p-3">
                    {renderIcon(module.icon)}
                  </div>
                  <h2 className="text-xl font-bold">{module.name}</h2>
                </div>
                <p className="mb-4 text-gray-400">{module.description}</p>
                <div className="space-y-2">
                  {module.menus && module.menus.length > 0 ? (
                    module.menus
                      .filter(menu => !menu.parentId && menu.permissions?.canView)
                      .sort((a, b) => a.order - b.order)
                      .slice(0, 3)
                      .map((menu) => (
                        <Link 
                          href={menu.path} 
                          key={menu.id}
                          className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          <span className="mr-2">{renderIcon(menu.icon)}</span>
                          <span>{menu.name}</span>
                        </Link>
                      ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-400">Sem menus disponíveis</div>
                  )}
                </div>
                {module.menus && module.menus.filter(menu => !menu.parentId && menu.permissions?.canView).length > 3 && (
                  <div className="mt-4 text-right">
                    <Link 
                      href={`/module/${module.id}`}
                      className="text-sm font-medium text-blue-400 hover:text-blue-300"
                    >
                      Ver todos
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}