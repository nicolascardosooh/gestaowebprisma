// prisma/seed/index.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Criar empresa padrão
  const company = await prisma.company.upsert({
    where: { databaseName: 'gestaoweb_demo' },
    update: {},
    create: {
      name: 'Empresa Demonstração',
      databaseName: 'gestaoweb_demo',
      databaseHost: 'localhost',
      databasePort: 5432,
      databaseUser: 'postgres',
      databasePass: 'postgres',
    },
  });

  console.log('Empresa criada:', company.name);

  // Criar perfil de administrador
  const adminProfile = await prisma.profile.upsert({
    where: { 
      id: 'admin-profile' 
    },
    update: {},
    create: {
      id: 'admin-profile',
      name: 'Administrador',
      description: 'Acesso completo ao sistema',
      companyId: company.id,
    },
  });

  console.log('Perfil criado:', adminProfile.name);

  // Criar perfil de usuário padrão
  const userProfile = await prisma.profile.upsert({
    where: { 
      id: 'user-profile' 
    },
    update: {},
    create: {
      id: 'user-profile',
      name: 'Usuário Padrão',
      description: 'Acesso limitado ao sistema',
      companyId: company.id,
    },
  });

  console.log('Perfil criado:', userProfile.name);

  // Criar usuário administrador
  const hashedPassword = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@exemplo.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@exemplo.com',
      password: hashedPassword,
      role: 'admin',
      companyId: company.id,
      profileId: adminProfile.id,
    },
  });

  console.log('Usuário criado:', admin.name);

  // Criar módulos
  const moduloRH = await prisma.module.upsert({
    where: { id: 'modulo-rh' },
    update: {},
    create: {
      id: 'modulo-rh',
      name: 'Recursos Humanos',
      description: 'Gestão de funcionários e departamentos',
      icon: 'user',
      order: 1,
    },
  });

  const moduloCadastro = await prisma.module.upsert({
    where: { id: 'modulo-cadastro' },
    update: {},
    create: {
      id: 'modulo-cadastro',
      name: 'Cadastros',
      description: 'Cadastros gerais do sistema',
      icon: 'grid',
      order: 2,
    },
  });

  const moduloFiscal = await prisma.module.upsert({
    where: { id: 'modulo-fiscal' },
    update: {},
    create: {
      id: 'modulo-fiscal',
      name: 'Fiscal',
      description: 'Gestão fiscal e tributária',
      icon: 'file',
      order: 3,
    },
  });

  const moduloPDV = await prisma.module.upsert({
    where: { id: 'modulo-pdv' },
    update: {},
    create: {
      id: 'modulo-pdv',
      name: 'PDV',
      description: 'Ponto de Venda',
      icon: 'shopping-cart',
      order: 4,
    },
  });

  console.log('Módulos criados');

  // Criar menus
  // Menus de RH
  const menuFuncionarios = await prisma.menu.upsert({
    where: { path: '/rh/funcionarios' },
    update: {},
    create: {
      name: 'Funcionários',
      path: '/rh/funcionarios',
      icon: 'users',
      moduleId: moduloRH.id,
      order: 1,
    },
  });

  const menuDepartamentos = await prisma.menu.upsert({
    where: { path: '/rh/departamentos' },
    update: {},
    create: {
      name: 'Departamentos',
      path: '/rh/departamentos',
      icon: 'briefcase',
      moduleId: moduloRH.id,
      order: 2,
    },
  });

  // Menus de Cadastro
  const menuClientes = await prisma.menu.upsert({
    where: { path: '/cadastro/clientes' },
    update: {},
    create: {
      name: 'Clientes',
      path: '/cadastro/clientes',
      icon: 'user',
      moduleId: moduloCadastro.id,
      order: 1,
    },
  });

  const menuFornecedores = await prisma.menu.upsert({
    where: { path: '/cadastro/fornecedores' },
    update: {},
    create: {
      name: 'Fornecedores',
      path: '/cadastro/fornecedores',
      icon: 'truck',
      moduleId: moduloCadastro.id,
      order: 2,
    },
  });

  const menuProdutos = await prisma.menu.upsert({
    where: { path: '/cadastro/produtos' },
    update: {},
    create: {
      name: 'Produtos',
      path: '/cadastro/produtos',
      icon: 'box',
      moduleId: moduloCadastro.id,
      order: 3,
    },
  });

  // Menus de Fiscal
  const menuNotas = await prisma.menu.upsert({
    where: { path: '/fiscal/notas' },
    update: {},
    create: {
      name: 'Notas Fiscais',
      path: '/fiscal/notas',
      icon: 'file-text',
      moduleId: moduloFiscal.id,
      order: 1,
    },
  });

  const menuImpostos = await prisma.menu.upsert({
    where: { path: '/fiscal/impostos' },
    update: {},
    create: {
      name: 'Impostos',
      path: '/fiscal/impostos',
      icon: 'percent',
      moduleId: moduloFiscal.id,
      order: 2,
    },
  });

  // Menus de PDV
  const menuVendas = await prisma.menu.upsert({
    where: { path: '/pdv/vendas' },
    update: {},
    create: {
      name: 'Vendas',
      path: '/pdv/vendas',
      icon: 'shopping-bag',
      moduleId: moduloPDV.id,
      order: 1,
    },
  });

  const menuCaixa = await prisma.menu.upsert({
    where: { path: '/pdv/caixa' },
    update: {},
    create: {
      name: 'Caixa',
      path: '/pdv/caixa',
      icon: 'dollar-sign',
      moduleId: moduloPDV.id,
      order: 2,
    },
  });

  console.log('Menus criados');

  // Criar permissões para o perfil de administrador (acesso total)
  const menus = [
    menuFuncionarios, menuDepartamentos, 
    menuClientes, menuFornecedores, menuProdutos, 
    menuNotas, menuImpostos, 
    menuVendas, menuCaixa
  ];

  for (const menu of menus) {
    await prisma.permission.upsert({
      where: {
        profileId_menuId: {
          profileId: adminProfile.id,
          menuId: menu.id,
        },
      },
      update: {},
      create: {
        profileId: adminProfile.id,
        menuId: menu.id,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
    });
  }

  // Criar permissões limitadas para o perfil de usuário padrão
  const userMenus = [menuClientes, menuProdutos, menuVendas];
  
  for (const menu of userMenus) {
    await prisma.permission.upsert({
      where: {
        profileId_menuId: {
          profileId: userProfile.id,
          menuId: menu.id,
        },
      },
      update: {},
      create: {
        profileId: userProfile.id,
        menuId: menu.id,
        canView: true,
        canCreate: menu.id === menuVendas.id, // Só pode criar vendas
        canEdit: false,
        canDelete: false,
      },
    });
  }

  console.log('Permissões criadas');
  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });