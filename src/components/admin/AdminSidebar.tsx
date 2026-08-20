// ============================================================
// ADMIN SIDEBAR NAVIGATION
// Purpose: Section navigation for the admin panel, completely
//          separate from the customer-facing site chrome.
// Status: COMPLETED
// Security: Hidden entries are convenience only — every route and
//          every server function re-checks the permission.
// ============================================================
import { Link, useRouterState } from "@tanstack/react-router";
import { useSiteLogos } from "@/hooks/use-site-logos";

import {
  ClipboardList,
  LayoutDashboard,
  Package,
  RotateCcw,
  ScrollText,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  UsersRound,
  MessageSquare,
  Star,
  Activity,
  KeyRound,
  Flame,
} from "lucide-react";


import czpLogoAsset from "@/assets/czp-logo.png.asset.json";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserProfileWidget } from "@/components/admin/UserProfileWidget";
import { PERMISSIONS, type Permission } from "@/lib/admin.shared";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  permission?: Permission;
};

const OPERATIONS: NavItem[] = [
  { to: "/ad", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/ad/orders", label: "Orders", icon: ClipboardList, permission: PERMISSIONS.ordersView },
  { to: "/ad/products", label: "Products", icon: Package, permission: PERMISSIONS.ordersView },
  {
    to: "/ad/featured",
    label: "Featured & Deals",
    icon: LayoutDashboard,
    permission: PERMISSIONS.productsManage,
  },
  {
    to: "/ad/flash",
    label: "Flash Sales",
    icon: Flame,
    permission: PERMISSIONS.productsManage,
  },
  {
    to: "/ad/hero",

    label: "Hero Slider",
    icon: LayoutDashboard,
    permission: PERMISSIONS.productsManage,
  },

  { to: "/ad/customers", label: "Customers", icon: UsersRound, permission: PERMISSIONS.ordersView },
  { to: "/ad/couriers", label: "Couriers", icon: Truck, permission: PERMISSIONS.couriersView },
  { to: "/ad/leads", label: "Leads", icon: MessageSquare, permission: PERMISSIONS.customersManage },
  { to: "/ad/reviews", label: "Reviews", icon: Star, permission: PERMISSIONS.reviewsManage },
  {
    to: "/ad/recycle-bin",
    label: "Recycle Bin",
    icon: RotateCcw,
    permission: PERMISSIONS.ordersView,
  },
];

const ADMINISTRATION: NavItem[] = [
  { to: "/ad/staff", label: "Staff & roles", icon: Users, permission: PERMISSIONS.staffManage },
  { to: "/ad/audit-log", label: "Audit log", icon: ScrollText, permission: PERMISSIONS.auditView },
  {
    to: "/ad/settings",
    label: "Store settings",
    icon: Settings,
    permission: PERMISSIONS.productsManage,
  },
  {
    to: "/ad/settings/invoice",
    label: "Invoice settings",
    icon: ScrollText,
    permission: PERMISSIONS.ordersView,
  },
  { to: "/ad/security", label: "Security", icon: ShieldCheck },
  {
    to: "/ad/security-events",
    label: "Security Events",
    icon: ShieldCheck,
    permission: PERMISSIONS.securityManage,
  },
  {
    to: "/ad/security-dashboard",
    label: "Security Stats",
    icon: Activity,
    permission: PERMISSIONS.securityManage,
  },
    {
      to: "/ad/login-requests",
      label: "Login Requests",
      icon: KeyRound,
      permission: PERMISSIONS.loginApprovalsManage,
    },
    {
      to: "/ad/diagnostics",
      label: "System Diagnostics",
      icon: Activity,
      permission: PERMISSIONS.staffManage,
    },
  ];

export function AdminSidebar({ access, permissions }: { access: any; permissions: Permission[] }) {
  const { getLogo } = useSiteLogos();
  const logoUrl = getLogo("admin_sidebar");

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPrivileged = access.primaryRole === "super_admin" || access.primaryRole === "admin";

  const allowed = (item: NavItem) => {
    if (!item.permission || permissions.includes(item.permission)) {
      // Hard restrict Staff from specific paths in UI even if they have the permission bit
      if (!isPrivileged) {
        if (item.to === "/ad/staff" || item.to === "/ad/settings" || item.to === "/ad/couriers") {
          return false;
        }
      }
      return true;
    }
    return false;
  };
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);

  const renderGroup = (label: string, items: NavItem[]) => {
    const visible = items.filter(allowed);
    if (!visible.length) return null;

  return (

      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {visible.map((item) => (
                <SidebarMenuItem key={item.to} className="focus-within:ring-2 focus-within:ring-primary rounded-md focus-within:ring-offset-2">
                  <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.label}>
                  <Link to={item.to}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="sticky top-0 h-svh">
      <SidebarHeader className="border-b border-sidebar-border/50 pb-2">
        <div className="flex items-center gap-3 px-2 pt-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <img
            src={logoUrl}
            alt="CZP Logo"

            className="h-10 w-auto shrink-0 object-contain md:h-16 lg:h-20"
          />
          <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <p className="font-display text-sm font-bold uppercase tracking-tight text-primary">
              CZP Admin
            </p>
            <p className="truncate text-[10px] font-medium text-muted-foreground">
              Customer Paradise Admin Panel
            </p>
          </div>
        </div>

        <div className="mt-4 px-1 group-data-[collapsible=icon]:hidden">
          <UserProfileWidget access={access} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Operations", OPERATIONS)}
        {renderGroup("Administration", ADMINISTRATION)}
      </SidebarContent>
    </Sidebar>
  );
}
