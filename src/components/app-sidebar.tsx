"use client"

import * as React from "react"
import Image from "next/image"
import {
  LayoutDashboard,
  UsersRound,
  Users,
  SheetIcon,
  Lock,
  ActivitySquare,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { BRAND } from "@/lib/brand"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const pathname = usePathname()

  const data = {
    user: {
      name: user?.name || "User",
      email: user?.email || "",
      avatar: ""
    },
    navGroups: [
      { title: "Workspace", items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
      { title: "Pipeline", items: [{ label: 'Leads', href: '/leads', icon: UsersRound }] },
      {
        title: "Admin",
        items: [
          { label: 'Users', href: '/admin', icon: Users, roles: ['admin', 'super_admin'] },
          { label: 'All Leads', href: '/admin/leads', icon: SheetIcon, roles: ['admin', 'super_admin'] },
          { label: 'Sessions', href: '/admin/sessions', icon: ActivitySquare, roles: ['super_admin'] },
          { label: 'Security', href: '/security', icon: Lock, roles: ['admin', 'super_admin', 'agent'] }
        ]
      }
    ].map(group => {
      if (group.title === "Admin") {
        const administrationItems = group.items as (typeof group.items[number] & { roles?: string[] })[];
        return {
          ...group,
          items: administrationItems.filter(item => item.roles?.includes(user?.role || ''))
        };
      }
      return group;
    }).filter(group => group.items.length > 0)
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground" {...props}>
      <SidebarHeader className="h-14 flex items-center px-3 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/60 data-[state=open]:bg-transparent">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10 shrink-0 overflow-hidden">
                  <Image src="/lexora-icon.svg" width={20} height={20} alt={BRAND.name} className="shrink-0" />
                </div>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
                  <span className="text-[13px] font-semibold tracking-tight truncate text-sidebar-foreground">
                    {BRAND.name}
                  </span>
                  <span className="text-[10px] text-sidebar-foreground/50 truncate">
                    {BRAND.shortTagline}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="no-scrollbar gap-1 pt-2">
        {data.navGroups.map((group, idx) => (
          <SidebarGroup key={idx} className="py-1.5">
            <SidebarGroupLabel className="text-[10px] font-medium text-sidebar-foreground/40 tracking-[0.08em] uppercase px-3 mb-1">
              {group.title}
            </SidebarGroupLabel>
            <SidebarMenu className="px-2 gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-9 rounded-md transition-colors",
                        "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-none"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4 opacity-80" />
                        <span className="text-[13px] font-medium group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
