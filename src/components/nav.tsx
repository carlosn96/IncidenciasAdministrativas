
"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppLogo } from "@/components/icons";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  BarChart,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const links = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/projections", label: "Proyecciones", icon: BarChart },
  { href: "/dashboard/profile", label: "Perfil", icon: User },
  { href: "/dashboard/settings", label: "Ajustes", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Link href="/dashboard" className="flex items-center justify-center gap-3">
          <div className="bg-white p-1 rounded-md">
            <AppLogo className="h-6 w-6 shrink-0" />
          </div>
          <span className="text-lg font-semibold text-sidebar-primary duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            Incidencias
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={link.label}
              >
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full outline-none ring-sidebar-ring focus-visible:ring-2 rounded-md">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="User" data-ai-hint="user avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-left text-sm font-medium text-sidebar-primary">
                    Usuario Coordinador
                  </p>
                  <p className="truncate text-left text-xs text-sidebar-foreground/70">
                    coordinador@institucion.edu
                  </p>
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </>
  );
}
