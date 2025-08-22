'use client';

import {
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  Home,
  Package,
  Repeat,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './brand-logo';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: Array<{
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

const mainMenuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
  },
  {
    title: 'Orçamentos',
    url: '/orcamentos',
    icon: FileText,
  },
  {
    title: 'Locações',
    url: '/locacoes',
    icon: Wrench,
    submenu: [
      {
        title: 'Recorrências',
        url: '/locacoes-recorrentes',
        icon: Repeat,
      },
    ],
  },
  {
    title: 'Agenda',
    url: '/agenda',
    icon: Calendar,
  },
];

const adminMenuItems: MenuItem[] = [
  {
    title: 'Clientes',
    url: '/clientes',
    icon: Users,
  },
  {
    title: 'Equipamentos',
    url: '/equipamentos',
    icon: Package,
  },
  {
    title: 'Relatórios',
    url: '/relatorios',
    icon: BarChart3,
  },
  {
    title: 'Configurações',
    url: '/configuracoes',
    icon: Settings,
  },
  {
    title: 'Assinatura',
    url: '/assinatura-gestao',
    icon: CreditCard,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  // Função para verificar se um menu está ativo
  const isMenuActive = (menuUrl: string) => {
    return pathname === menuUrl || pathname.startsWith(menuUrl + '/');
  };

  // Função para verificar se deve mostrar submenu
  const shouldShowSubmenu = (item: MenuItem) => {
    if (!item.submenu) return false;

    // Mostra submenu se o menu principal estiver ativo
    // ou se estiver em uma página relacionada
    return (
      isMenuActive(item.url) ||
      item.submenu.some((subItem: MenuItem) => pathname === subItem.url)
    );
  };

  return (
    <Sidebar className="border-r border-light-gray">
      <SidebarHeader className="border-light-gray p-4 border-b-0">
        <div className="flex items-center justify-start">
          <BrandLogo width={104} height={36} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Bloco Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 pt-4 pb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isMenuActive(item.url)}
                    className="hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {/* Submenu só aparece quando o menu principal estiver ativo */}
                  {shouldShowSubmenu(item) &&
                    item.submenu &&
                    item.submenu.map(subItem => (
                      <SidebarMenuButton
                        key={subItem.title}
                        asChild
                        isActive={pathname === subItem.url}
                        className="hover:bg-primary/5 hover:text-primary/80 data-[active=true]:bg-primary/10 data-[active=true]:text-primary/80 relative ml-6"
                      >
                        <Link
                          href={subItem.url}
                          className="flex items-center gap-3 px-3 py-1.5 relative"
                        >
                          {/* Stroke interligando */}
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-border"></div>
                          <div className="absolute left-0 top-1/2 w-3 h-px bg-border transform -translate-y-1/2"></div>

                          <subItem.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-normal text-xs text-muted-foreground">
                            {subItem.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    ))}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bloco Administração */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 pt-4 pb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Administração
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isMenuActive(item.url)}
                    className="hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
