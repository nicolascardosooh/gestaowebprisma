import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Cliente Prisma para o banco de dados principal
export const prisma = new PrismaClient();

// Função para criar um cliente Prisma para o banco de dados específico de uma empresa
export function getClientPrisma(databaseUrl: string) {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

// Função para construir a URL de conexão do banco de dados do cliente
export function buildClientDatabaseUrl(company: { 
  databaseHost: string; 
  databasePort: number; 
  databaseUser: string; 
  databasePass: string; 
  databaseName: string;
}) {
  // Codificar a senha para lidar com caracteres especiais
  const encodedPass = encodeURIComponent(company.databasePass);
  return `postgresql://${company.databaseUser}:${encodedPass}@${company.databaseHost}:${company.databasePort}/${company.databaseName}`;
}

// Função para obter conexão com o banco de dados da empresa do usuário
export async function getCompanyDbConnection(userId: string) {
  // Buscar usuário e empresa associada
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  });

  if (!user || !user.company) {
    throw new Error('Usuário ou empresa não encontrados');
  }

  // Construir URL de conexão
  const dbUrl = buildClientDatabaseUrl(user.company);
  
  // Criar e retornar cliente Prisma para o banco de dados da empresa
  return getClientPrisma(dbUrl);
}

// Função para criar uma nova empresa
export async function createCompany({ 
  name, 
  databaseName, 
  databaseHost = 'localhost',
  databasePort = 5432,
  databaseUser = 'postgres',
  databasePass 
}: { 
  name: string; 
  databaseName: string; 
  databaseHost?: string;
  databasePort?: number;
  databaseUser?: string;
  databasePass: string;
}) {
  try {
    // Criar a empresa no banco de dados principal
    const company = await prisma.company.create({
      data: {
        name,
        databaseName,
        databaseHost,
        databasePort,
        databaseUser,
        databasePass,
      },
    });

    try {
      // Conectar ao PostgreSQL e criar o banco de dados
      // Usar credenciais do .env se disponíveis, caso contrário usar as fornecidas
      const pgUser = process.env.POSTGRES_USER || databaseUser;
      const pgPass = process.env.POSTGRES_PASSWORD || databasePass;
      const pgHost = process.env.POSTGRES_HOST || databaseHost;
      const pgPort = process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : databasePort;
      
      console.log(`Tentando conectar ao PostgreSQL como ${pgUser}@${pgHost}:${pgPort}`);
      
      // Codificar a senha para lidar com caracteres especiais
      const encodedPass = encodeURIComponent(pgPass);
      const pgUrl = `postgresql://${pgUser}:${encodedPass}@${pgHost}:${pgPort}/postgres`;
      const createDbCommand = `CREATE DATABASE "${databaseName}"`;
      
      // Usar o cliente pg para executar o comando SQL
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: pgUrl });
      await pool.query(createDbCommand);
      await pool.end();
      
      // Inicializar o esquema do banco de dados do cliente
      const clientDbUrl = buildClientDatabaseUrl({
        databaseHost,
        databasePort,
        databaseUser,
        databasePass,
        databaseName,
      });
      
      // Criar as tabelas no banco de dados do cliente usando um script SQL
      const clientDb = getClientPrisma(clientDbUrl);
      
      // Criar as tabelas no banco de dados do cliente uma por uma
      // Tabela ClientCompany
      await clientDb.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ClientCompany" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" TEXT NOT NULL,
          "mainId" TEXT UNIQUE NOT NULL,
          "active" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      
      // Tabela ClientUser
      await clientDb.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ClientUser" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" TEXT NOT NULL,
          "email" TEXT UNIQUE NOT NULL,
          "mainId" TEXT UNIQUE NOT NULL,
          "companyId" UUID NOT NULL,
          "profileId" UUID,
          "role" TEXT NOT NULL DEFAULT 'user',
          "active" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("companyId") REFERENCES "ClientCompany"("id")
        )
      `;
      
      // Tabela Profile
      await clientDb.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Profile" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" TEXT NOT NULL,
          "description" TEXT,
          "companyId" UUID NOT NULL,
          "active" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("companyId") REFERENCES "ClientCompany"("id")
        )
      `;
      
      // Tabela Module
      await clientDb.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Module" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" TEXT NOT NULL,
          "description" TEXT,
          "icon" TEXT,
          "path" TEXT,
          "order" INTEGER NOT NULL DEFAULT 0,
          "parentId" UUID,
          "companyId" UUID NOT NULL,
          "active" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("companyId") REFERENCES "ClientCompany"("id")
        )
      `;
      
      // Adicionar chave estrangeira para parentId após a tabela Module ser criada
      await clientDb.$executeRaw`
        ALTER TABLE "Module" ADD FOREIGN KEY ("parentId") REFERENCES "Module"("id")
      `;
      
      // Tabela Menu
      await clientDb.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Menu" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" TEXT NOT NULL,
          "description" TEXT,
          "path" TEXT NOT NULL,
          "icon" TEXT,
          "moduleId" UUID NOT NULL,
          "parentId" UUID,
          "order" INTEGER NOT NULL DEFAULT 0,
          "active" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("moduleId") REFERENCES "Module"("id"),
          FOREIGN KEY ("parentId") REFERENCES "Menu"("id")
        )
      `;
      
      // Tabela Permission
      await clientDb.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Permission" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "profileId" UUID NOT NULL,
          "moduleId" UUID NOT NULL,
          "canView" BOOLEAN NOT NULL DEFAULT false,
          "canCreate" BOOLEAN NOT NULL DEFAULT false,
          "canEdit" BOOLEAN NOT NULL DEFAULT false,
          "canDelete" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("profileId") REFERENCES "Profile"("id"),
          FOREIGN KEY ("moduleId") REFERENCES "Module"("id"),
          UNIQUE ("profileId", "moduleId")
        )
      `;
      
      // Adicionar chave estrangeira para profileId em ClientUser
      await clientDb.$executeRaw`
        ALTER TABLE "ClientUser" ADD FOREIGN KEY ("profileId") REFERENCES "Profile"("id")
      `;
      
      // Inserir a empresa no banco de dados do cliente usando SQL puro
      const clientCompanyResult = await clientDb.$queryRaw<Array<{id: string}>>`
        INSERT INTO "ClientCompany" ("name", "mainId", "updatedAt")
        VALUES (${company.name}, ${company.id}, ${new Date()})
        RETURNING "id"
      `;
      
      const clientCompanyId = clientCompanyResult[0].id;
      
      // Criar perfil de administrador
      const adminProfileResult = await clientDb.$queryRaw<Array<{id: string}>>`
        INSERT INTO "Profile" ("name", "description", "companyId", "active", "updatedAt")
        VALUES ('Administrador', 'Perfil com acesso total ao sistema', ${clientCompanyId}::uuid, true, ${new Date()})
        RETURNING "id"
      `;
      
      const adminProfileId = adminProfileResult[0].id;
      
      // Criar módulos básicos
      console.log('Criando módulos básicos...');
      
      // Dashboard
      const dashboardResult = await clientDb.$queryRaw<Array<{id: string}>>`
        INSERT INTO "Module" ("name", "description", "icon", "path", "order", "companyId", "active", "updatedAt")
        VALUES ('Dashboard', 'Painel principal', 'dashboard', '/dashboard', 1, ${clientCompanyId}::uuid, true, ${new Date()})
        RETURNING "id"
      `;
      
      // Usuários
      const usersResult = await clientDb.$queryRaw<Array<{id: string}>>`
        INSERT INTO "Module" ("name", "description", "icon", "path", "order", "companyId", "active", "updatedAt")
        VALUES ('Usuários', 'Gerenciamento de usuários', 'users', '/users', 2, ${clientCompanyId}::uuid, true, ${new Date()})
        RETURNING "id"
      `;
      
      // Perfis
      const profilesResult = await clientDb.$queryRaw<Array<{id: string}>>`
        INSERT INTO "Module" ("name", "description", "icon", "path", "order", "companyId", "active", "updatedAt")
        VALUES ('Perfis', 'Gerenciamento de perfis', 'shield', '/profiles', 3, ${clientCompanyId}::uuid, true, ${new Date()})
        RETURNING "id"
      `;
      
      // Configurações
      const settingsResult = await clientDb.$queryRaw<Array<{id: string}>>`
        INSERT INTO "Module" ("name", "description", "icon", "path", "order", "companyId", "active", "updatedAt")
        VALUES ('Configurações', 'Configurações do sistema', 'settings', '/settings', 4, ${clientCompanyId}::uuid, true, ${new Date()})
        RETURNING "id"
      `;
      
      // Criar menus para cada módulo
      console.log('Criando menus básicos...');
      
      // Menus para Dashboard
      await clientDb.$executeRaw`
        INSERT INTO "Menu" ("name", "description", "path", "icon", "moduleId", "order", "active", "updatedAt")
        VALUES ('Visão Geral', 'Visão geral do sistema', '/dashboard', 'grid', ${dashboardResult[0].id}::uuid, 1, true, ${new Date()})
      `;
      
      // Menus para Usuários
      await clientDb.$executeRaw`
        INSERT INTO "Menu" ("name", "description", "path", "icon", "moduleId", "order", "active", "updatedAt")
        VALUES ('Listar Usuários', 'Lista de todos os usuários', '/users', 'user', ${usersResult[0].id}::uuid, 1, true, ${new Date()})
      `;
      
      await clientDb.$executeRaw`
        INSERT INTO "Menu" ("name", "description", "path", "icon", "moduleId", "order", "active", "updatedAt")
        VALUES ('Novo Usuário', 'Criar novo usuário', '/users/new', 'user-plus', ${usersResult[0].id}::uuid, 2, true, ${new Date()})
      `;
      
      // Menus para Perfis
      await clientDb.$executeRaw`
        INSERT INTO "Menu" ("name", "description", "path", "icon", "moduleId", "order", "active", "updatedAt")
        VALUES ('Listar Perfis', 'Lista de todos os perfis', '/profiles', 'shield', ${profilesResult[0].id}::uuid, 1, true, ${new Date()})
      `;
      
      await clientDb.$executeRaw`
        INSERT INTO "Menu" ("name", "description", "path", "icon", "moduleId", "order", "active", "updatedAt")
        VALUES ('Novo Perfil', 'Criar novo perfil', '/profiles/new', 'plus-circle', ${profilesResult[0].id}::uuid, 2, true, ${new Date()})
      `;
      
      // Menus para Configurações
      await clientDb.$executeRaw`
        INSERT INTO "Menu" ("name", "description", "path", "icon", "moduleId", "order", "active", "updatedAt")
        VALUES ('Configurações Gerais', 'Configurações gerais do sistema', '/settings', 'settings', ${settingsResult[0].id}::uuid, 1, true, ${new Date()})
      `;
      
      // Criar permissões para o perfil de administrador
      console.log('Criando permissões para o perfil de administrador...');
      
      // Permissão para Dashboard
      await clientDb.$executeRaw`
        INSERT INTO "Permission" ("profileId", "moduleId", "canView", "canCreate", "canEdit", "canDelete", "updatedAt")
        VALUES (${adminProfileId}::uuid, ${dashboardResult[0].id}::uuid, true, true, true, true, ${new Date()})
      `;
      
      // Permissão para Usuários
      await clientDb.$executeRaw`
        INSERT INTO "Permission" ("profileId", "moduleId", "canView", "canCreate", "canEdit", "canDelete", "updatedAt")
        VALUES (${adminProfileId}::uuid, ${usersResult[0].id}::uuid, true, true, true, true, ${new Date()})
      `;
      
      // Permissão para Perfis
      await clientDb.$executeRaw`
        INSERT INTO "Permission" ("profileId", "moduleId", "canView", "canCreate", "canEdit", "canDelete", "updatedAt")
        VALUES (${adminProfileId}::uuid, ${profilesResult[0].id}::uuid, true, true, true, true, ${new Date()})
      `;
      
      // Permissão para Configurações
      await clientDb.$executeRaw`
        INSERT INTO "Permission" ("profileId", "moduleId", "canView", "canCreate", "canEdit", "canDelete", "updatedAt")
        VALUES (${adminProfileId}::uuid, ${settingsResult[0].id}::uuid, true, true, true, true, ${new Date()})
      `;
      
      await clientDb.$disconnect();
      
      console.log(`Banco de dados ${databaseName} criado e inicializado com sucesso`);
      
      return company;
    } catch (error) {
      // Se houver um erro, excluir a empresa do banco de dados principal
      await prisma.company.delete({ where: { id: company.id } });
      console.error('Erro ao criar banco de dados:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    throw error;
  }
}

// Função para criar um novo usuário
export async function createUser({
  name,
  email,
  password,
  companyId,
  role = 'user',
}: {
  name: string;
  email: string;
  password: string;
  companyId: string;
  role?: string;
}) {
  // Criar o usuário no banco de dados principal
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
      companyId,
      role,
    },
    include: {
      company: true,
    },
  });

  try {
    // Criar o usuário também no banco de dados do cliente
    const clientDbUrl = buildClientDatabaseUrl(user.company);
    const clientDb = getClientPrisma(clientDbUrl);
    
    try {
      // Obter a empresa no banco de dados do cliente usando SQL puro
      const clientCompany = await clientDb.$queryRaw<Array<{id: string, mainId: string}>>`
        SELECT * FROM "ClientCompany" WHERE "mainId" = ${companyId} LIMIT 1
      `;
      
      if (!clientCompany || clientCompany.length === 0) {
        console.error('Empresa não encontrada no banco de dados do cliente');
        return user;
      }
      
      console.log('Criando usuário no banco do cliente com companyId:', clientCompany[0].id);
      
      // Obter o perfil de administrador se o usuário for admin
      let profileId = null;
      if (role === 'admin') {
        const adminProfile = await clientDb.$queryRaw<Array<{id: string}>>`
          SELECT "id" FROM "Profile" WHERE "name" = 'Administrador' LIMIT 1
        `;
        
        if (adminProfile && adminProfile.length > 0) {
          profileId = adminProfile[0].id;
          console.log('Perfil de administrador encontrado:', profileId);
        } else {
          console.log('Perfil de administrador não encontrado');
        }
      }
      
      // Verificar se o usuário já existe no banco de dados do cliente
      const existingUser = await clientDb.$queryRaw<Array<{id: string}>>`
        SELECT "id" FROM "ClientUser" WHERE "mainId" = ${user.id} LIMIT 1
      `;
      
      if (existingUser && existingUser.length > 0) {
        console.log('Usuário já existe no banco de dados do cliente, atualizando...');
        // Atualizar o usuário com ou sem perfil
        if (profileId) {
          await clientDb.$executeRaw`
            UPDATE "ClientUser" 
            SET "name" = ${user.name}, 
                "email" = ${user.email}, 
                "profileId" = ${profileId}::uuid, 
                "role" = ${user.role}, 
                "updatedAt" = ${new Date()}
            WHERE "mainId" = ${user.id}
          `;
        } else {
          await clientDb.$executeRaw`
            UPDATE "ClientUser" 
            SET "name" = ${user.name}, 
                "email" = ${user.email}, 
                "profileId" = NULL, 
                "role" = ${user.role}, 
                "updatedAt" = ${new Date()}
            WHERE "mainId" = ${user.id}
          `;
        }
      } else {
        console.log('Criando novo usuário no banco de dados do cliente...');
        // Criar o usuário no banco de dados do cliente usando SQL puro
        // Criar o usuário com ou sem perfil
        if (profileId) {
          await clientDb.$executeRaw`
            INSERT INTO "ClientUser" ("name", "email", "mainId", "companyId", "profileId", "role", "active", "updatedAt")
            VALUES (
              ${user.name}, 
              ${user.email}, 
              ${user.id}, 
              ${clientCompany[0].id}::uuid, 
              ${profileId}::uuid, 
              ${user.role}, 
              true, 
              ${new Date()}
            )
          `;
        } else {
          await clientDb.$executeRaw`
            INSERT INTO "ClientUser" ("name", "email", "mainId", "companyId", "role", "active", "updatedAt")
            VALUES (
              ${user.name}, 
              ${user.email}, 
              ${user.id}, 
              ${clientCompany[0].id}::uuid, 
              ${user.role}, 
              true, 
              ${new Date()}
            )
          `;
        }
      }
      
      console.log('Usuário criado/atualizado com sucesso no banco de dados do cliente');
    } catch (error) {
      console.error('Erro ao criar/atualizar usuário no banco de dados do cliente:', error);
    }
    
    await clientDb.$disconnect();
    
    return user;
  } catch (error) {
    console.error('Erro ao criar usuário no banco de dados do cliente:', error);
    // Não vamos excluir o usuário do banco principal se houver erro no banco do cliente
    // Isso pode ser tratado posteriormente
    return user;
  }
}