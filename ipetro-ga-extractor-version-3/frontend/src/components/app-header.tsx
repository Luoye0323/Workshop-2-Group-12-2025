"use client";

import React from "react";
import Image from "next/image";
import { Search, PlusCircle, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";

export function AppHeader() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 p-4 m-2 rounded-xl bg-card border shadow-xs">
        {/* Logo on the left */}
        <div className="flex items-center ml-2">
          <h1 className="text-2xl font-bold"></h1>
        </div>

        {/* Right side: Button and Search Bar */}
        <div className="flex items-center gap-3 ml-auto">
          {/* <Button asChild>
            <a href="/extraction">
              <PlusCircle className="mr-2 h-4 w-4" /> 
              New Extraction
            </a>
          </Button> */}

          {/* Search Bar */}
          <div className="w-80">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by the file name"
                className="pl-8 w-full bg-background"
              />
            </div>
          </div>
        </div>
        {/* <div className="flex items-center gap-2 px-2">
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
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div> */}
      </div>
    </div>
  );
}
