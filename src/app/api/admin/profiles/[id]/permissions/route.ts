// src/app/api/admin/profiles/[id]/permissions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Obter módulos, menus e permissões para um perfil
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

    // Verificar se o perfil existe e pertence à empresa do usuário
    const profile = await prisma.profile.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId as string
      }
    });

    if (!profile) {
      return NextResponse.json(
        { message: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Buscar todos os módulos ativos com seus menus
    const modules = await prisma.module.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      include: {
        menus: {
          where: { active: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    // Buscar permissões existentes para o perfil
    const permissions = await prisma.permission.findMany({
      where: { profileId: params.id }
    });

    // Mapear permissões para os menus
    const modulesWithPermissions = modules.map(module => ({
      id: module.id,
      name: module.name,
      menus: module.menus.map(menu => {
        const permission = permissions.find(p => p.menuId === menu.id);
        return {
          id: menu.id,
          name: menu.name,
          path: menu.path,
          permissions: permission ? {
            id: permission.id,
            canView: permission.canView,
            canCreate: permission.canCreate,
            canEdit: permission.canEdit,
            canDelete: permission.canDelete
          } : null
        };
      })
    }));

    return NextResponse.json(modulesWithPermissions);
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Salvar permissões para um perfil
export async function POST(
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
    const profile = await prisma.profile.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId as string
      }
    });

    if (!profile) {
      return NextResponse.json(
        { message: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Obter dados do corpo da requisição
    const { permissions } = await request.json();

    // Validar dados
    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { message: 'Formato de dados inválido' },
        { status: 400 }
      );
    }

    // Excluir todas as permissões existentes para o perfil
    await prisma.permission.deleteMany({
      where: { profileId: params.id }
    });

    // Criar novas permissões
    if (permissions.length > 0) {
      await prisma.permission.createMany({
        data: permissions.map(p => ({
          profileId: params.id,
          menuId: p.menuId,
          canView: p.canView || false,
          canCreate: p.canCreate || false,
          canEdit: p.canEdit || false,
          canDelete: p.canDelete || false
        }))
      });
    }

    return NextResponse.json({
      message: 'Permissões salvas com sucesso',
      count: permissions.length
    });
  } catch (error) {
    console.error('Erro ao salvar permissões:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}