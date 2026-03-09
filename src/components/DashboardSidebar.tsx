"use client";
import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { 
  Gauge, 
  Users, 
  LogOut, 
  Lock, 
  SheetIcon, 
  LayoutDashboard 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardSidebar({ onLogout, open, setOpen }: any) {
  const pathname = usePathname();

  const navGroups = [
    {
      title: "Overview",
      items: [{ label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard /> }]
    },
    {
      title: "Leads Management",
      items: [{ label: 'All Leads', href: '/leads', icon: <Gauge /> }]
    },
    {
      title: "Administration",
      items: [
        { label: 'User Management', href: '/admin', icon: <Users /> },
        { label: 'Lead Management', href: '/admin/leads', icon: <SheetIcon /> },
        { label: 'Security', href: '/security', icon: <Lock /> }
      ]
    }
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10 border-r bg-sidebar border-sidebar-border text-sidebar-foreground">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          
          {/* Logo Section - Ensuring visibility in both states */}
          <Link href="/dashboard" className="flex items-center justify-center py-4">
            {open ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex items-center justify-start w-full px-2"
              >
                <img src="/logo.png" alt="Logo" className="h-25 w-auto object-contain" />
              </motion.div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain shrink-0" />
              </div>
            )}
          </Link>

          <div className="mt-8 flex flex-col gap-8">
            {navGroups.map((group, idx) => (
              <div key={idx} className="flex flex-col gap-3">
                {/* Section Headers - Only show if sidebar is open */}
                {open && (
                  <motion.h2 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/60"
                  >
                    {group.title}
                  </motion.h2>
                )}

                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <SidebarLink
                        key={item.href}
                        link={{
                          ...item,
                          // Force icons to stay visible, centered, and prominent
                          icon: React.cloneElement(item.icon as React.ReactElement, {
                            className: cn(
                              "h-6 w-6 shrink-0 transition-colors duration-200",
                              isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover/sidebar:text-sidebar-foreground"
                            )
                          })
                        }}
                        className={cn(
                          "rounded-xl transition-all duration-200 flex items-center h-12",
                          // Correcting alignment: centered when closed, left-aligned when open
                          open ? "px-3 justify-start gap-3" : "px-0 justify-center w-full",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logout Section */}
        <div className="pt-4 border-t border-sidebar-border">
          <SidebarLink 
            link={{ 
              label: "Logout", 
              href: "#", 
              icon: <LogOut className="h-6 w-6 text-rose-500 shrink-0" /> 
            }} 
            onClick={onLogout}
            className={cn(
              "rounded-xl flex items-center h-12 transition-all",
              open ? "px-3 justify-start gap-3" : "px-0 justify-center w-full",
              "text-sidebar-foreground/70 hover:bg-rose-500/5 hover:text-rose-500"
            )}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
