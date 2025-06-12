'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api';

export default function SetupPage() {
  const [accessCode, setAccessCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Formulário de setup
  const [companyName, setCompanyName] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [databasePass, setDatabasePass] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // Código de acesso secreto - em produção, use variáveis de ambiente
  const SECRET_ACCESS_CODE = 'admin123setup';

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === SECRET_ACCESS_CODE) {
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Código de acesso inválido');
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiService.post('/setup', {
        companyName,
        databaseName,
        databasePass,
        userName,
        userEmail,
        userPassword
      });

      setSuccess('Configuração inicial concluída com sucesso! Redirecionando para login...');
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar configuração inicial');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
        <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
          <h1 className="mb-6 text-center text-2xl font-bold text-white">Acesso Restrito</h1>
          
          {error && (
            <div className="mb-4 rounded-md bg-red-900/50 border border-red-700 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleAccessSubmit}>
            <div className="mb-4">
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-300 mb-2">
                Código de Acesso
              </label>
              <input
                type="password"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="bg-gray-700 text-white block w-full rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Acessar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-4xl mx-auto rounded-lg bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">Configuração Inicial do Sistema</h1>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-900/50 border border-red-700 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 rounded-md bg-green-900/50 border border-green-700 p-4 text-sm text-green-200">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSetupSubmit}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">Dados da Empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-gray-700 text-white block w-full rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="databaseName" className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Banco de Dados
                </label>
                <input
                  type="text"
                  id="databaseName"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  className="bg-gray-700 text-white block w-full rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="databasePass" className="block text-sm font-medium text-gray-300 mb-2">
                  Senha do Banco de Dados
                </label>
                <input
                  type="password"
                  id="databasePass"
                  value={databasePass}
                  onChange={(e) => setDatabasePass(e.target.value)}
                  className="bg-gray-700 text-white block w-full rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">Dados do Administrador</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Usuário
                </label>
                <input
                  type="text"
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-gray-700 text-white block w-full rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-300 mb-2">
                  Email do Usuário
                </label>
                <input
                  type="email"
                  id="userEmail"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="bg-gray-700 text-white block w-full rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="userPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Senha do Usuário
                </label>
                <input
                  type="password"
                  id="userPassword"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="bg-gray-700 text-white block w-full rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-blue-800 disabled:opacity-70"
            >
              {loading ? 'Configurando...' : 'Concluir Configuração'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}