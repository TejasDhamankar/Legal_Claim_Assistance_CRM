"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"
import { usePathname } from "next/navigation"

const TITLE_MAP: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/leads/create": "New Lead",
  "/security": "Security",
  "/admin": "User Management",
  "/admin/leads": "Lead Management",
  "/admin/sessions": "Sessions",
}

function resolveTitle(pathname: string) {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname]
  if (pathname.startsWith("/leads/")) return "Lead Detail"
  if (pathname.startsWith("/admin/leads/")) return "Lead Detail"
  return "Workspace"
}

export function SiteHeader() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const title = resolveTitle(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <h1 className="text-sm font-semibold tracking-tight text-foreground">{title}</h1>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 text-muted-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  )
}
