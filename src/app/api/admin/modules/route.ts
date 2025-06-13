// src/app/api/admin/modules/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, getCompanyDbConnection } from '@/lib/db';
import { executeClientQuery } from '@/lib/client-db';

// GET - Listar todos os módulos
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

    // Verificar se o usuário é admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      );
    }

    const userId = session.user.id as string;
    
    // Obter conexão com o banco de dados do cliente
    const clientDb = await getCompanyDbConnection(userId);
    
    try {
      // Buscar todos os módulos usando SQL puro
      const modules = await executeClientQuery(clientDb, `
        SELECT m.*, 
          (SELECT COUNT(*) FROM "Module" sm WHERE sm."parentId" = m."id") as submodules_count
        FROM "Module" m
        ORDER BY m."order" ASC
      `);
      
      return NextResponse.json(modules);
    } finally {
      await clientDb.$disconnect();
    }
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo módulo
export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário é admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Obter dados do corpo da requisição
    const { name, description, icon, order, parentId, companyId } = await request.json();

    // Validar dados
    if (!name) {
      return NextResponse.json(
        { message: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;
    
    // Obter conexão com o banco de dados do cliente
    const clientDb = await getCompanyDbConnection(userId);
    
    try {
      // Obter o ID da empresa no banco do cliente se não foi fornecido
      let actualCompanyId = companyId;
      if (!actualCompanyId) {
        const companies = await executeClientQuery<{id: string}>(clientDb, `
          SELECT "id" FROM "ClientCompany" LIMIT 1
        `);
        
        if (companies.length === 0) {
          return NextResponse.json(
            { message: 'Empresa não encontrada' },
            { status: 404 }
          );
        }
        
        actualCompanyId = companies[0].id;
      }
      
      // Criar módulo usando SQL puro
      const result = await executeClientQuery(clientDb, `
        INSERT INTO "Module" ("name", "description", "icon", "order", "parentId", "companyId", "active", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, true, $7)
        RETURNING *
      `, [name, description, icon, order || 0, parentId || null, actualCompanyId, new Date()]);
      
      return NextResponse.json(result[0], { status: 201 });
    } finally {
      await clientDb.$disconnect();
    }
  } catch (error) {
    console.error('Erro ao criar módulo:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}