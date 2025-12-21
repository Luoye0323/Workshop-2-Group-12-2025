"use client";

import { useState, useEffect } from "react";

import Image from "next/image";
import { logout } from "@/lib/api";
import { usePathname } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Home,
  FileScan,
  History,
  ChartNoAxesCombined,
  Settings,
  ChevronUp,
  User2,
  ChevronDown,
  ChevronsUpDown,
  ChevronRight,
  Table,
  Projector,
  StickyNote,
  InspectionPanel,
} from "lucide-react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";

const items = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Upload Documents",
    url: "/extraction",
    icon: FileScan,
  },
  {
    title: "Projects", // create new project and view recent projects
    url: "#",
    icon: Projector,
  },
  {
    title: "Equipment Registration",
    url: "#",
    icon: Table,
    strokeWidth: 0.5,
  },
  {
    title: "Inspection Plan",
    url: "#",
    icon: InspectionPanel,
  },
  {
    title: "Templates",
    url: "#",
    icon: StickyNote,
  },
  {
    title: "Reports",
    url: "#",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <Sidebar>
      <div className="py-5 px-5 flex flex-col items-center">
        <a className="flex flex-col items-center" href="/dashboard">
          <Image
            src="/ipetro-logo.svg"
            width={150}
            height={150}
            alt="ipetro logo"
          />
          <h1 className="text-[12px] font-bold">
            AI-Powered Digital Automation
          </h1>
        </a>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={usePathname() === item.url}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* <code className="text-xs p-2 border m-2 rounded-xl bg-blue-400 text-white">use ⌘ + shift + b to open the sidebar</code> */}
      <div className="flex items-center justify-end gap-2 px-2">
        <div className="relative flex items-center justify-center w-[15px] h-[15px]">
          <Sun
            size={15}
            className="absolute transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0"
          />
          <Moon
            size={15}
            className="absolute transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100"
          />
        </div>
        {mounted && (
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        )}
      </div>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> John Doe
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w=[--radix-anchor-width] border rounded-xl p-2 backdrop-blur-sm transition-all ml-25"
              >
                <DropdownMenuItem className="px-2 py-1">
                  <a className="text-sm" href="/user-profile">
                    Profile
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem className="px-2 py-1">
                  <a className="text-sm" href="/personal-settings">
                    Personal Settings
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="px-2 py-1 cursor-pointer"
                  onSelect={() => {
                    setTheme("light");
                    logout();
                  }}
                >
                  <span className="text-sm">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
