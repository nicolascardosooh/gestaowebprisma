// src/types/next-auth.d.ts
import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
    companyName: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      companyId: string;
      companyName: string;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    companyId?: string;
    companyName?: string;
  }
}