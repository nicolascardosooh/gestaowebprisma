// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Buscar usuário pelo email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: { company: true },
          });

          // Verificar se o usuário existe
          if (!user) {
            return null;
          }
          
          // Verificar se a senha está correta usando bcrypt
          const bcrypt = require('bcrypt');
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (!passwordMatch) {
            return null;
          }

          // Verificar se o usuário está ativo
          if (!user.active) {
            throw new Error('Usuário desativado');
          }

          // Verificar se a empresa está ativa
          if (!user.company.active) {
            throw new Error('Empresa desativada');
          }

          // Retornar dados do usuário
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            companyName: user.company.name,
          };
        } catch (error) {
          console.error('Erro na autenticação:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Adicionar dados adicionais ao token
      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
      }
      return token;
    },
    async session({ session, token }) {
      // Adicionar dados adicionais à sessão
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.companyName = token.companyName as string;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  secret: process.env.NEXTAUTH_SECRET || 'seu-segredo-temporario',
}