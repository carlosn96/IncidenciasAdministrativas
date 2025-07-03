import { Header } from "@/components/header";
import { Nav } from "@/components/nav";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { SettingsProvider } from "@/context/settings-context";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <AuthGuard>
        <SidebarProvider>
          <Sidebar variant="sidebar" collapsible="icon">
            <Nav />
          </Sidebar>
          <SidebarInset>
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    </SettingsProvider>
  );
}
