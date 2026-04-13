import { Fragment, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Inbox,
  LayoutDashboard,
  Menu,
  Palmtree,
  Settings,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DashboardMobileAccountSheet,
  DashboardSidebarAccountBlock,
} from "@/layouts/DashboardUserArea";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: string;
};

/** Breadcrumb + current page label for the sticky header (desktop). */
function DashboardHeaderTrail() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  const items: { label: string; to?: string }[] = [{ label: "Dashboard", to: "/" }];

  if (pathname === "/" || pathname === "") {
    items.push({ label: "Overview" });
  } else if (pathname === "/employees") {
    items.push({ label: "Employees" });
  } else if (pathname === "/employees/new") {
    items.push({ label: "Employees", to: "/employees" });
    items.push({ label: "New employee" });
  } else if (segments[0] === "employees" && segments.length >= 2) {
    items.push({ label: "Employees", to: "/employees" });
    const id = segments[1];
    if (segments[2] === "edit") {
      items.push({ label: id, to: `/employees/${encodeURIComponent(id)}` });
      items.push({ label: "Edit" });
    } else {
      items.push({ label: id });
    }
  } else {
    const leaf =
      {
        "my-leave": "My leave",
        approvals: "Approvals",
        "hr-desk": "HR desk",
        reports: "Reports",
        settings: "Settings",
      }[segments[0] ?? ""];
    if (leaf) items.push({ label: leaf });
  }

  return (
    <Breadcrumb className="hidden min-w-0 flex-1 md:flex">
      <BreadcrumbList className="sm:gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const showLink = Boolean(item.to && !isLast);
          return (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {showLink ? (
                  <BreadcrumbLink
                    render={<Link to={item.to!} />}
                    className="max-w-[min(100%,12rem)] truncate"
                  >
                    {item.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="max-w-[min(100%,14rem)] truncate">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const navItems: NavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/my-leave", label: "My leave", icon: Palmtree },
  { to: "/approvals", label: "Approvals", icon: Inbox, badge: "3" },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/hr-desk", label: "HR desk", icon: Building2 },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (mobileNavOpen) document.documentElement.classList.add("overflow-hidden");
    else document.documentElement.classList.remove("overflow-hidden");
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [mobileNavOpen]);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeMobileNav}
        />
      ) : null}

      <aside
        id="dashboard-mobile-nav"
        className={cn(
          "flex max-w-[min(100vw-2rem,18rem)] flex-col border-sidebar-border bg-sidebar text-sidebar-foreground",
          "fixed inset-y-0 left-0 z-50 w-56 border-r shadow-lg transition-transform duration-200 ease-out",
          "md:static md:z-auto md:max-w-none md:w-56 md:translate-x-0 md:border-b-0 md:shadow-none md:transition-none",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-sidebar-foreground/75">
              Leave management
            </p>
            <p className="font-heading text-lg font-semibold text-sidebar-foreground">LMS</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Close menu"
              onClick={closeMobileNav}
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>
        <Separator className="bg-sidebar-border" />
        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3"
          aria-label="Main navigation"
        >
          {navItems.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeMobileNav}
              className={({ isActive }) =>
                cn(
                  "flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-border"
                )
              }
            >
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {badge ? (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {badge}
                </Badge>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-sidebar-border p-3">
          <DashboardSidebarAccountBlock />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex w-full items-center gap-2 bg-background px-3 py-2 md:px-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            aria-controls="dashboard-mobile-nav"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground md:hidden">
            LMS
          </span>
          <DashboardHeaderTrail />
          <div className="flex shrink-0 items-center gap-2 md:ml-0">
            <ModeToggle />
            <div className="md:hidden">
              <DashboardMobileAccountSheet />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
