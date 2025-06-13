import { PrismaClient } from '@prisma/client';

// Interfaces para os tipos de retorno das consultas
interface ClientCompany {
  id: string;
  name: string;
  mainId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientUser {
  id: string;
  name: string;
  email: string;
  mainId: string;
  companyId: string;
  profileId: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Profile {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Module {
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
}

interface Permission {
  id: string;
  profileId: string;
  moduleId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Função para executar consultas SQL no banco de dados do cliente
export async function executeClientQuery<T>(clientDb: PrismaClient, query: string, params: any[] = []): Promise<T[]> {
  try {
    // Usar $queryRawUnsafe para executar consultas SQL parametrizadas
    return await clientDb.$queryRawUnsafe(query, ...params) as T[];
  } catch (error) {
    console.error('Erro ao executar consulta no banco do cliente:', error);
    throw error;
  }
}

// Função para obter módulos do menu para um usuário
export async function getUserModules(clientDb: PrismaClient, userId: string): Promise<Module[]> {
  try {
    // Primeiro, verificar se as tabelas existem
    const tableCheck = await clientDb.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Module'
      ) as module_exists
    `;
    
    if (!tableCheck[0].module_exists) {
      console.error('Tabela Module não existe no banco de dados');
      return [];
    }
    
    // Verificar se o usuário tem um perfil associado
    const user = await clientDb.$queryRaw<any[]>`
      SELECT * FROM "ClientUser" WHERE "mainId" = ${userId}
    `;
    
    if (user.length === 0) {
      console.error('Usuário não encontrado no banco de dados do cliente');
      return [];
    }
    
    let modules = [];
    
    if (!user[0].profileId) {
      console.log('Usuário não tem perfil associado');
      // Se o usuário não tem perfil, mas é admin, retornar todos os módulos
      if (user[0].role === 'admin') {
        modules = await clientDb.$queryRaw`
          SELECT * FROM "Module" 
          WHERE "active" = true 
          ORDER BY "order" ASC
        `;
      } else {
        return [];
      }
    } else {
      // Buscar módulos com base no perfil do usuário
      modules = await clientDb.$queryRaw`
        SELECT m.*
        FROM "Module" m
        JOIN "Permission" p ON p."moduleId" = m."id"
        WHERE p."profileId" = ${user[0].profileId}::uuid
          AND p."canView" = true
          AND m."active" = true
        ORDER BY m."order" ASC
      `;
    }
    
    // Para cada módulo, buscar seus menus
    const modulesWithMenus = [];
    
    for (const module of modules) {
      // Buscar menus do módulo
      const menus = await clientDb.$queryRaw`
        SELECT * FROM "Menu"
        WHERE "moduleId" = ${module.id}::uuid
          AND "active" = true
        ORDER BY "order" ASC
      `;
      
      // Adicionar permissões aos menus
      const menusWithPermissions = menus.map(menu => ({
        ...menu,
        permissions: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true
        }
      }));
      
      // Adicionar menus ao módulo
      modulesWithMenus.push({
        ...module,
        menus: menusWithPermissions
      });
    }
    
    return modulesWithMenus;
  } catch (error) {
    console.error('Erro ao obter módulos do usuário:', error);
    return [];
  }
}

// Função para obter perfil do usuário
export async function getUserProfile(clientDb: PrismaClient, userId: string): Promise<(ClientUser & { profile: Profile | null }) | null> {
  try {
    const query = `
      SELECT u.*, p.*
      FROM "ClientUser" u
      LEFT JOIN "Profile" p ON u."profileId" = p."id"
      WHERE u."mainId" = $1
    `;
    
    const results = await clientDb.$queryRawUnsafe(query, userId) as any[];
    if (results.length === 0) return null;
    
    // Processar o resultado para formar o objeto esperado
    const result = results[0];
    return {
      id: result.id,
      name: result.name,
      email: result.email,
      mainId: result.mainId,
      companyId: result.companyId,
      profileId: result.profileId,
      role: result.role,
      active: result.active,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      profile: result.profileId ? {
        id: result.profile_id,
        name: result.profile_name,
        description: result.profile_description,
        companyId: result.profile_companyId,
        active: result.profile_active,
        createdAt: result.profile_createdAt,
        updatedAt: result.profile_updatedAt
      } : null
    };
  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error);
    return null;
  }
}

// Função para verificar permissão do usuário em um módulo
export async function checkUserPermission(
  clientDb: PrismaClient, 
  userId: string, 
  modulePath: string, 
  permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete'
): Promise<boolean> {
  try {
    const query = `
      SELECT p."${permission}" as hasPermission
      FROM "Permission" p
      JOIN "Module" m ON p."moduleId" = m."id"
      JOIN "Profile" pr ON p."profileId" = pr."id"
      JOIN "ClientUser" u ON u."profileId" = pr."id"
      WHERE u."mainId" = $1
        AND m."path" = $2
      LIMIT 1
    `;
    
    const results = await clientDb.$queryRawUnsafe(query, userId, modulePath) as Array<{hasPermission: boolean}>;
    return results.length > 0 ? results[0].hasPermission : false;
  } catch (error) {
    console.error('Erro ao verificar permissão do usuário:', error);
    return false;
  }
}