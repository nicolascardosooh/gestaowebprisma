'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import Link from 'next/link';

// Interface para módulos
interface Module {
  id: string;
  name: string;
  menus: Menu[];
}

// Interface para menus
interface Menu {
  id: string;
  name: string;
  path: string;
  permissions: Permission | null;
}

// Interface para permissões
interface Permission {
  id?: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function PermissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;
  
  const [modules, setModules] = useState<Module[]>([]);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Carregar perfil e permissões
  useEffect(() => {
    const fetchProfileAndPermissions = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          setLoading(true);
          
          // Buscar perfil
          const profileResponse = await fetch(`/api/admin/profiles/${profileId}`);
          if (!profileResponse.ok) {
            throw new Error('Falha ao carregar perfil');
          }
          const profileData = await profileResponse.json();
          setProfileName(profileData.name);
          
          // Buscar módulos, menus e permissões
          const permissionsResponse = await fetch(`/api/admin/profiles/${profileId}/permissions`);
          if (!permissionsResponse.ok) {
            throw new Error('Falha ao carregar permissões');
          }
          const modulesData = await permissionsResponse.json();
          setModules(modulesData);
        } catch (err: any) {
          setError(err.message || 'Erro ao carregar dados');
          console.error('Erro ao carregar dados:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfileAndPermissions();
  }, [status, session, profileId]);

  // Função para atualizar permissões localmente
  const updatePermission = (moduleIndex: number, menuIndex: number, field: keyof Permission, value: boolean) => {
    const newModules = [...modules];
    const menu = newModules[moduleIndex].menus[menuIndex];
    
    if (!menu.permissions) {
      menu.permissions = {
        canView: field === 'canView' ? value : false,
        canCreate: field === 'canCreate' ? value : false,
        canEdit: field === 'canEdit' ? value : false,
        canDelete: field === 'canDelete' ? value : false
      };
    } else {
      menu.permissions[field] = value;
      
      // Se desmarcar visualização, desmarcar todas as outras permissões
      if (field === 'canView' && !value) {
        menu.permissions.canCreate = false;
        menu.permissions.canEdit = false;
        menu.permissions.canDelete = false;
      }
      
      // Se marcar qualquer outra permissão, garantir que visualização esteja marcada
      if (field !== 'canView' && value) {
        menu.permissions.canView = true;
      }
    }
    
    setModules(newModules);
  };

  // Função para salvar todas as permissões
  const savePermissions = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Preparar dados para envio
      const permissionsData = modules.flatMap(module => 
        module.menus.map(menu => ({
          menuId: menu.id,
          ...menu.permissions
        }))
      ).filter(p => p.canView || p.canCreate || p.canEdit || p.canDelete);
      
      // Enviar para a API
      const response = await fetch(`/api/admin/profiles/${profileId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions: permissionsData }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao salvar permissões');
      }
      
      setSuccess('Permissões salvas com sucesso');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar permissões');
      console.error('Erro ao salvar permissões:', err);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin/profiles" className="mr-4 rounded-full p-2 hover:bg-gray-800">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Permissões: {profileName}</h1>
        </div>
        <button
          onClick={savePermissions}
          disabled={saving}
          className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-70"
        >
          {saving ? (
            <>
              <span className="mr-2">Salvando...</span>
            </>
          ) : (
            <>
              <FiSave className="mr-2" />
              <span>Salvar Permissões</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-900/50 border border-red-700 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-green-900/50 border border-green-700 p-4 text-sm text-green-200">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="rounded-lg bg-gray-800 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">{module.name}</h2>
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Menu
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
                    Visualizar
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
                    Criar
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
                    Editar
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
                    Excluir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {module.menus.map((menu, menuIndex) => (
                  <tr key={menu.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                      {menu.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={menu.permissions?.canView || false}
                        onChange={(e) => updatePermission(moduleIndex, menuIndex, 'canView', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={menu.permissions?.canCreate || false}
                        onChange={(e) => updatePermission(moduleIndex, menuIndex, 'canCreate', e.target.checked)}
                        disabled={!menu.permissions?.canView}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={menu.permissions?.canEdit || false}
                        onChange={(e) => updatePermission(moduleIndex, menuIndex, 'canEdit', e.target.checked)}
                        disabled={!menu.permissions?.canView}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={menu.permissions?.canDelete || false}
                        onChange={(e) => updatePermission(moduleIndex, menuIndex, 'canDelete', e.target.checked)}
                        disabled={!menu.permissions?.canView}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}