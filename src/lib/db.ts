// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

// Cliente Prisma para o banco de dados principal
export const prisma = new PrismaClient();

// Função para obter um cliente Prisma para um banco de dados específico de empresa
export async function getCompanyPrismaClient(companyId: string) {
  // Buscar informações da empresa no banco de dados principal
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error(`Empresa com ID ${companyId} não encontrada`);
  }

  // Criar uma nova string de conexão para o banco de dados da empresa
  const databaseUrl = `postgresql://${company.databaseUser}:${company.databasePass}@${company.databaseHost}:${company.databasePort}/${company.databaseName}`;

  // Criar um novo cliente Prisma com a conexão específica
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

// Função para criar uma nova empresa
export async function createCompany(companyData: {
  name: string;
  databaseName: string;
  databaseHost?: string;
  databasePort?: number;
  databaseUser?: string;
  databasePass: string;
}) {
  return prisma.company.create({
    data: companyData
  });
}

// Função para criar um novo usuário
export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  companyId: string;
  role?: string;
}) {
  return prisma.user.create({
    data: userData
  });
}