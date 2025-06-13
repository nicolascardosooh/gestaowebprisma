# Gestão Web ERP

Sistema de gestão empresarial completo com controle de permissões e menu dinâmico.

## Tecnologias

- Next.js 14
- TypeScript
- Prisma ORM
- PostgreSQL
- NextAuth.js
- TailwindCSS
- React Icons

## Funcionalidades

- Autenticação de usuários
- Sistema multi-tenant (cada empresa tem seu próprio banco de dados)
- Controle de permissões por perfil de usuário
- Menu dinâmico baseado nas permissões do usuário
- Módulos: RH, Cadastros, Fiscal, PDV

## Configuração Inicial

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env` com as informações do banco de dados:
   ```
   DATABASE_URL="postgresql://postgres:senha@localhost:5432/gestaoweb"
   NEXTAUTH_SECRET="seu-segredo-super-seguro"
   NEXTAUTH_URL="http://localhost:3005"
   ```
4. Execute as migrações do Prisma:
   ```bash
   npx prisma migrate dev
   ```
5. Popule o banco de dados com dados iniciais:
   ```bash
   npm run seed
   ```
6. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
7. Acesse http://localhost:3005

## Usuário Padrão

- Email: admin@exemplo.com
- Senha: admin123

## Estrutura do Projeto

- `/prisma`: Configuração do Prisma ORM e migrações
- `/src/app`: Páginas e rotas da aplicação
- `/src/app/api`: APIs do backend
- `/src/components`: Componentes reutilizáveis
- `/src/lib`: Bibliotecas e utilitários

## Módulos e Permissões

O sistema possui um controle de permissões baseado em perfis de usuário. Cada perfil pode ter diferentes permissões para cada menu do sistema:

- **Visualizar**: Permite acessar a página
- **Criar**: Permite criar novos registros
- **Editar**: Permite editar registros existentes
- **Excluir**: Permite excluir registros

Os menus são organizados em módulos, como:

- **Recursos Humanos**: Funcionários, Departamentos
- **Cadastros**: Clientes, Fornecedores, Produtos
- **Fiscal**: Notas Fiscais, Impostos
- **PDV**: Vendas, Caixa

## Licença

Este projeto está licenciado sob a licença MIT.