// src/app/api/setup/route.ts
import { NextResponse } from 'next/server';
import { createCompany, createUser } from '@/lib/db';
import { hash } from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { companyName, databaseName, databasePass, userName, userEmail, userPassword } = await request.json();

    // Validar dados
    if (!companyName || !databaseName || !databasePass || !userName || !userEmail || !userPassword) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar empresa (isso também criará o banco de dados e inicializará as tabelas)
    const company = await createCompany({
      name: companyName,
      databaseName,
      databasePass,
    });

    // Criar usuário administrador
    const hashedPassword = await hash(userPassword, 10);
    const user = await createUser({
      name: userName,
      email: userEmail,
      password: hashedPassword,
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
