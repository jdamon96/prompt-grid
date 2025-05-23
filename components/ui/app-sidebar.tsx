"use client";
import { Home, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Playground",
    url: "/playground",
    icon: Settings,
  },
  {
    title: "Prompts",
    url: "/prompt-library",
    icon: Home,
    comingSoon: true,
  },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Navigation</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))} disabled={item.comingSoon}>
                    <Link href={item.url} tabIndex={item.comingSoon ? -1 : 0} aria-disabled={item.comingSoon}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                      {item.comingSoon && (
                        <span className="ml-2 rounded bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">Coming Soon</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
} 