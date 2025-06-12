// src/app/api/setup/route.ts
import { NextResponse } from 'next/server';
import { createCompany, createUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { companyName, databaseName, databasePass, userName, userEmail, userPassword } = await request.json();

    // Criar empresa
    const company = await createCompany({
      name: companyName,
      databaseName,
      databasePass,
    });

    // Criar usuário administrador
    const user = await createUser({
      name: userName,
      email: userEmail,
      password: userPassword,
      companyId: company.id,
      role: 'admin',
    });

    return NextResponse.json({
      message: 'Configuração inicial concluída com sucesso',
      company: {
        id: company.id,
        name: company.name,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Erro na configuração inicial:', error);
    return NextResponse.json(
      { message: `Erro: ${error.message}` },
      { status: 500 }
    );
  }
}
