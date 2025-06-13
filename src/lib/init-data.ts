import { PrismaClient } from '@prisma/client';

// Função para inicializar dados básicos no banco de dados do cliente
export async function initializeClientData(clientDb: PrismaClient, companyId: string) {
  try {
    console.log('Iniciando inicialização de dados básicos...');
    
    // Verificar se já existe um perfil de administrador
    const adminProfile = await clientDb.$queryRaw<any[]>`
      SELECT * FROM "Profile" WHERE "name" = 'Administrador' LIMIT 1
    `;
    
    let profileId;
    
    // Criar perfil de administrador se não existir
    if (adminProfile.length === 0) {
      console.log('Criando perfil de administrador...');
      const result = await clientDb.$queryRaw<any[]>`
        INSERT INTO "Profile" ("name", "description", "companyId", "active", "updatedAt")
        VALUES ('Administrador', 'Perfil com acesso total ao sistema', ${companyId}::uuid, true, ${new Date()})
        RETURNING "id"
      `;
      profileId = result[0].id;
    } else {
      profileId = adminProfile[0].id;
    }
    
    // Verificar se já existem módulos
    const modulesCount = await clientDb.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "Module"
    `;
    
    // Criar módulos básicos se não existirem
    if (modulesCount[0].count === 0) {
      console.log('Criando módulos básicos...');
      
      // Dashboard
      const dashboardResult = await clientDb.$queryRaw<any[]>`
        INSERT INTO "Module" ("name", "description", "icon", "path", "order", "companyId", "active", "updatedAt")
        VALUES ('Dashboard', 'Painel principal', 'dashboard', '/dashboard', 1, ${companyId}::uuid, true, ${new Date()})
        RETURNING "id"
      `;
      const dashboardId = dashboardResult[0].id;
      
      // Usuários
      const usersResult = await clientDb.$queryRaw<any[]>`
        INSERT INTO "Module" ("name", "description", "icon", "path", "order", "companyId", "active", "updatedAt")
        VALUES ('Usuários', 'Gerenciamento de usuários', 'users', '/users', 2, ${companyId}::uuid, true, ${new Date()})
        RETURNING "id"
      `;
      const usersId = usersResult[0].id;
      
      // Perfis
      const profilesResult = await clientDb.$queryRaw<any[]>`
        INSERT INTO "Module" ("name", "description", "icon", "path", "order", "companyId", "active", "updatedAt")
        VALUES ('Perfis', 'Gerenciamento de perfis', 'shield', '/profiles', 3, ${companyId}::uuid, true, ${new Date()})
        RETURNING "id"
      `;
      const profilesId = profilesResult[0].id;
      
      // Criar permissões para o perfil de administrador
      console.log('Criando permissões para o perfil de administrador...');
      
      // Permissão para Dashboard
      await clientDb.$executeRaw`
        INSERT INTO "Permission" ("profileId", "moduleId", "canView", "canCreate", "canEdit", "canDelete", "updatedAt")
        VALUES (${profileId}::uuid, ${dashboardId}::uuid, true, true, true, true, ${new Date()})
      `;
      
      // Permissão para Usuários
      await clientDb.$executeRaw`
        INSERT INTO "Permission" ("profileId", "moduleId", "canView", "canCreate", "canEdit", "canDelete", "updatedAt")
        VALUES (${profileId}::uuid, ${usersId}::uuid, true, true, true, true, ${new Date()})
      `;
      
      // Permissão para Perfis
      await clientDb.$executeRaw`
        INSERT INTO "Permission" ("profileId", "moduleId", "canView", "canCreate", "canEdit", "canDelete", "updatedAt")
        VALUES (${profileId}::uuid, ${profilesId}::uuid, true, true, true, true, ${new Date()})
      `;
    }
    
    // Atualizar o usuário administrador para associá-lo ao perfil de administrador
    const adminUser = await clientDb.$queryRaw<any[]>`
      SELECT * FROM "ClientUser" WHERE "role" = 'admin' LIMIT 1
    `;
    
    if (adminUser.length > 0 && adminUser[0].profileId === null) {
      console.log('Associando usuário administrador ao perfil de administrador...');
      await clientDb.$executeRaw`
        UPDATE "ClientUser" SET "profileId" = ${profileId}::uuid, "updatedAt" = ${new Date()}
        WHERE "id" = ${adminUser[0].id}::uuid
      `;
    }
    
    console.log('Inicialização de dados básicos concluída com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar dados básicos:', error);
    return false;
  }
}