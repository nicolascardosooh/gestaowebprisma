// src/app/api/admin/profiles/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Listar todos os perfis
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

    // Buscar todos os perfis da empresa do usuário
    const profiles = await prisma.profile.findMany({
      where: { 
        companyId: session.user.companyId as string 
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            permissions: true
          }
        }
      }
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo perfil
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
    const { name, description } = await request.json();

    // Validar dados
    if (!name) {
      return NextResponse.json(
        { message: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Criar perfil
    const profile = await prisma.profile.create({
      data: {
        name,
        description,
        companyId: session.user.companyId as string,
      }
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}