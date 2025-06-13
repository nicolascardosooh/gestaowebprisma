// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { compare } from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validar dados
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    // Verificar se o usuário existe
    if (!user) {
      return NextResponse.json(
        { message: 'Credenciais inválidas' },
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

    // Verificar a senha usando bcrypt
    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Retornar dados do usuário (sem a senha)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { message: `Erro: ${error.message}` },
      { status: 500 }
    );
  }
}