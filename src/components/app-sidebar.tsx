"use client"

import * as React from "react"
import Image from "next/image"
import { LayoutDashboard, Gauge, Users, SheetIcon, Lock } from "lucide-react"
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const pathname = usePathname()

  const data = {
    user: {
      name: user?.name || "Terminal User",
      email: user?.email || "uplink@core.sys",
      avatar: ""
    },
    navGroups: [
      { title: "Overview", items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
      { title: "Leads Management", items: [{ label: 'All Leads', href: '/leads', icon: Gauge }] },
      { 
        title: "Administration", 
        items: [
          { label: 'User Management', href: '/admin', icon: Users, roles: ['admin', 'super_admin'] },
          { label: 'Lead Management', href: '/admin/leads', icon: SheetIcon, roles: ['admin', 'super_admin'] },
          { label: 'Security', href: '/security', icon: Lock, roles: ['admin', 'super_admin', 'agent'] }
        ]
      }
    ].map(group => {
      if (group.title === "Administration") {
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
    <Sidebar collapsible="icon" className="border-r bg-sidebar" {...props}>
      <SidebarHeader className="h-12 flex items-center px-4 border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <Link href="/dashboard" className="flex items-center gap-3">
                <Image src="/logo.png" width={24} height={24} alt="Legal Claim Assistance Logo" className="shrink-0" />
                <span className="text-sm font-semibold truncate group-data-[collapsible=icon]:hidden">Legal Claim Assistance</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="no-scrollbar gap-0">
        {data.navGroups.map((group, idx) => (
          <SidebarGroup key={idx} className="py-2">
            <SidebarGroupLabel className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4">
              {group.title}
            </SidebarGroupLabel>
            <SidebarMenu className="px-2 gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="h-8 rounded-md"
                    >
                      <Link href={item.href}>
                        {React.isValidElement(item.icon) ? item.icon : <item.icon className="size-4" />}
                        <span className="text-[13px] font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}