import type { Metadata } from "next";
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarContent } from "@/components/ui/sidebar";
import "../globals.css";
import { AppSidebar } from "@/components/app-sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar>
            <SidebarContent>
              <AppSidebar/>   
              <main>
                <SidebarTrigger/>
              </main>
            </SidebarContent>
          </Sidebar>
          <main className="flex-1">
            {children}
          </main>
        </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
