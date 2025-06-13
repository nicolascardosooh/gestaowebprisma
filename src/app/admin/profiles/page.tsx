'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';

// Interface para perfis
interface Profile {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    permissions: number;
  };
}

export default function ProfilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Carregar perfis
  useEffect(() => {
    const fetchProfiles = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          setLoading(true);
          const response = await fetch('/api/admin/profiles');
          
          if (!response.ok) {
            throw new Error('Falha ao carregar perfis');
          }
          
          const data = await response.json();
          setProfiles(data);
        } catch (err: any) {
          setError(err.message || 'Erro ao carregar perfis');
          console.error('Erro ao carregar perfis:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfiles();
  }, [status, session]);

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = isEditing 
        ? `/api/admin/profiles/${formData.id}` 
        : '/api/admin/profiles';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao ${isEditing ? 'atualizar' : 'criar'} perfil`);
      }
      
      const data = await response.json();
      
      if (isEditing) {
        setProfiles(profiles.map(profile => 
          profile.id === data.id ? data : profile
        ));
      } else {
        setProfiles([...profiles, data]);
      }
      
      resetForm();
    } catch (err: any) {
      setError(err.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} perfil`);
    }
  };

  // Função para editar um perfil
  const handleEdit = (profile: Profile) => {
    setFormData({
      id: profile.id,
      name: profile.name,
      description: profile.description || '',
    });
    setIsEditing(true);
    setShowForm(true);
  };

  // Função para excluir um perfil
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/profiles/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Falha ao excluir perfil');
      }
      
      setProfiles(profiles.filter(profile => profile.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir perfil');
    }
  };

  // Função para configurar permissões de um perfil
  const handleConfigurePermissions = (id: string) => {
    router.push(`/admin/profiles/${id}/permissions`);
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
    });
    setIsEditing(false);
    setShowForm(false);
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
        <h1 className="text-2xl font-bold">Perfis de Usuário</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : 'Novo Perfil'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-900/50 border border-red-700 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-lg bg-gray-800 p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold">{isEditing ? 'Editar Perfil' : 'Novo Perfil'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nome
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-700 text-white block w-full rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-700 text-white block w-full rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {isEditing ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Nome
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Descrição
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-800">
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-400">
                  Nenhum perfil encontrado
                </td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                    {profile.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {profile.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      profile.active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                    }`}>
                      {profile.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleConfigurePermissions(profile.id)}
                      className="mr-2 text-blue-400 hover:text-blue-300"
                      title="Configurar Permissões"
                    >
                      <FiCheck className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(profile)}
                      className="mr-2 text-yellow-400 hover:text-yellow-300"
                      title="Editar"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Excluir"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}