"use client"

import { BarChart3, Calendar, FileText, Home, Package, Users, Wrench, Settings, Repeat, CreditCard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"


import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Orçamentos",
    url: "/orcamentos",
    icon: FileText,
  },
  {
    title: "Locações",
    url: "/locacoes",
    icon: Wrench,
    submenu: [
      {
        title: "Recorrências",
        url: "/locacoes-recorrentes",
        icon: Repeat,
      },
    ],
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: Calendar,
  },

]

const adminMenuItems = [
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
  },
  {
    title: "Equipamentos",
    url: "/equipamentos",
    icon: Package,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
  {
    title: "Assinatura",
    url: "/assinatura-gestao",
    icon: CreditCard,
  },

]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-light-gray">
      <SidebarHeader className="border-light-gray p-4 border-b-0">
        <div className="flex items-center justify-start">
          <img
            src="/logo-dazio.svg"
            alt="Logo Dazio"
            className="h-6 w-auto"
            style={{ display: 'block' }}
          />
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
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.submenu && item.submenu.map((subItem) => (
                    <SidebarMenuButton
                      key={subItem.title}
                      asChild
                      isActive={pathname === subItem.url}
                      className="hover:bg-primary/5 hover:text-primary/80 data-[active=true]:bg-primary/10 data-[active=true]:text-primary/80 relative ml-6"
                    >
                      <Link href={subItem.url} className="flex items-center gap-3 px-3 py-1.5 relative">
                        {/* Stroke interligando */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-border"></div>
                        <div className="absolute left-0 top-1/2 w-3 h-px bg-border transform -translate-y-1/2"></div>
                        
                        <subItem.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-normal text-xs text-muted-foreground">{subItem.title}</span>
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
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2">
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
  )
}