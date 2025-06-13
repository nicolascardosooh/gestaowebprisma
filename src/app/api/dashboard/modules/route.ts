// src/app/api/dashboard/modules/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, getCompanyDbConnection } from '@/lib/db';
import { getUserModules } from '@/lib/client-db';

// Definir interfaces para os tipos
interface ModuleWithSubs {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  path: string | null;
  order: number;
  parentId: string | null;
  companyId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  submodules: ModuleWithSubs[];
}

export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;

    // Obter o usuário do banco principal para verificar a empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return NextResponse.json(
        { message: 'Usuário ou empresa não encontrados' },
        { status: 404 }
      );
    }

    // Obter conexão com o banco de dados do cliente
    const clientDb = await getCompanyDbConnection(userId);

    // Buscar os módulos do usuário usando a função do client-db.ts
    const modules = await getUserModules(clientDb, userId);

    // Organizar os módulos em uma estrutura hierárquica
    const moduleMap = new Map<string, ModuleWithSubs>();
    const rootModules: ModuleWithSubs[] = [];

    // Primeiro passo: mapear todos os módulos por ID
    modules.forEach(module => {
      moduleMap.set(module.id, {
        ...module,
        submodules: []
      });
    });

    // Segundo passo: construir a hierarquia
    modules.forEach(module => {
      const moduleWithSubs = moduleMap.get(module.id);
      
      if (moduleWithSubs) {
        if (module.parentId && moduleMap.has(module.parentId)) {
          // Este é um submódulo, adicionar ao pai
          const parent = moduleMap.get(module.parentId);
          if (parent) {
            parent.submodules.push(moduleWithSubs);
          }
        } else {
          // Este é um módulo raiz
          rootModules.push(moduleWithSubs);
        }
      }
    });

    // Ordenar os módulos e submódulos por ordem
    const sortByOrder = (a: ModuleWithSubs, b: ModuleWithSubs) => a.order - b.order;
    rootModules.sort(sortByOrder);
    rootModules.forEach(module => {
      module.submodules.sort(sortByOrder);
    });

    await clientDb.$disconnect();

    return NextResponse.json(rootModules);
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}