// src/app/api/admin/profiles/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Obter um perfil específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Buscar perfil
    const profile = await prisma.profile.findUnique({
      where: { 
        id: params.id,
        companyId: session.user.companyId as string
      },
      include: {
        _count: {
          select: {
            users: true,
            permissions: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json(
        { message: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um perfil
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { name, description, active } = await request.json();

    // Validar dados
    if (!name) {
      return NextResponse.json(
        { message: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o perfil existe e pertence à empresa do usuário
    const existingProfile = await prisma.profile.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId as string
      }
    });

    if (!existingProfile) {
      return NextResponse.json(
        { message: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar perfil
    const profile = await prisma.profile.update({
      where: { id: params.id },
      data: {
        name,
        description,
        active: active !== undefined ? active : existingProfile.active
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um perfil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verificar se o perfil existe e pertence à empresa do usuário
    const existingProfile = await prisma.profile.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId as string
      },
      include: {
        users: true
      }
    });

    if (!existingProfile) {
      return NextResponse.json(
        { message: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se há usuários associados ao perfil
    if (existingProfile.users.length > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir um perfil com usuários associados' },
        { status: 400 }
      );
    }

    // Excluir permissões associadas ao perfil
    await prisma.permission.deleteMany({
      where: { profileId: params.id }
    });

    // Excluir perfil
    await prisma.profile.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Perfil excluído com sucesso' }
    );
  } catch (error) {
    console.error('Erro ao excluir perfil:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}