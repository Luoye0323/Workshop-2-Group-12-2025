import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";

export function TopNavigationBar() {
  return (
    <NavigationMenu className="gap-4">
      <NavigationMenuList className="">
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm w-20 h-10">File</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink>
                <Link href={"/"} className="w-20">New file</Link>
            </NavigationMenuLink>
            <NavigationMenuLink>
                <Link href={"/"} className="w-20">Open file</Link>
            </NavigationMenuLink>
            <NavigationMenuLink>
                <Link href={"/"} className="w-20">Choose file</Link>
            </NavigationMenuLink>
            <NavigationMenuLink>
                <Link href={"/"} className="w-40">Open workspace in new tab</Link>
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
      <NavigationMenuList className="">
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm w-20 h-10">Review</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink>
                <Link href={"/"} className="w-20">Review file</Link>
            </NavigationMenuLink>
            <NavigationMenuLink>
                <Link href={"/"} className="w-20">Review history</Link>
            </NavigationMenuLink>
            <NavigationMenuLink>
                <Link href={"/"} className="w-20">Analytics</Link>
            </NavigationMenuLink>
            <NavigationMenuLink>
                <Link href={"/"} className="w-40">Open workspace in new tab</Link>
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
