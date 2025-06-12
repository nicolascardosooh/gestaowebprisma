// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    // Verificar se o usuário existe e a senha está correta
    if (!user || user.password !== password) {
      return NextResponse.json(
        { message: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    // Verificar se o usuário está ativo
    if (!user.active) {
      return NextResponse.json(
        { message: 'Usuário desativado' },
        { status: 403 }
      );
    }

    // Verificar se a empresa está ativa
    if (!user.company.active) {
      return NextResponse.json(
        { message: 'Empresa desativada' },
        { status: 403 }
      );
    }

    // Em produção, use JWT para gerar um token seguro
    const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');

    // Retornar dados do usuário e token
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
