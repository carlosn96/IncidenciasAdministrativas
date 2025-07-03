
"use client";

import { useMemo } from "react";
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
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  BarChart,
  ClipboardList,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSettings } from "@/context/settings-context";
import { isWithinInterval, endOfDay } from "date-fns";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, periods } = useSettings();
  const { toast } = useToast();

  const activePeriod = useMemo(() => {
    const today = new Date();
    return periods.find(p => isWithinInterval(today, { start: p.startDate, end: endOfDay(p.endDate) }));
  }, [periods]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión Cerrada",
        description: "Has cerrado sesión correctamente.",
      });
      // The onAuthStateChanged listener in SettingsProvider will handle redirecting.
      // But we can push to be faster.
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión. Por favor, inténtalo de nuevo.",
      });
    }
  };


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
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard"}
              tooltip="Resumen"
            >
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>Resumen</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {activePeriod && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(`/dashboard/period/${activePeriod.id}`)}
                tooltip="Periodo Actual"
              >
                <Link href={`/dashboard/period/${activePeriod.id}`}>
                  <ClipboardList />
                  <span>Periodo Actual</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/dashboard/projections")}
              tooltip="Proyecciones"
            >
              <Link href="/dashboard/projections">
                <BarChart />
                <span>Proyecciones</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/dashboard/profile")}
              tooltip="Perfil"
            >
              <Link href="/dashboard/profile">
                <User />
                <span>Perfil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/dashboard/settings")}
              tooltip="Ajustes"
            >
              <Link href="/dashboard/settings">
                <Settings />
                <span>Ajustes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full outline-none ring-sidebar-ring focus-visible:ring-2 rounded-md">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL ?? ""} alt={user?.displayName ?? "User"} data-ai-hint="user avatar" />
                  <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-left text-sm font-medium text-sidebar-primary">
                    {user?.displayName ?? "Usuario"}
                  </p>
                  <p className="truncate text-left text-xs text-sidebar-foreground/70">
                    {user?.email ?? "..."}
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
            <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </>
  );
}
