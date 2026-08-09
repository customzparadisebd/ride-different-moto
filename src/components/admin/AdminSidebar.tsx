// ============================================================
// ADMIN SIDEBAR NAVIGATION
// Purpose: Section navigation for the admin panel, completely
//          separate from the customer-facing site chrome.
// Status: COMPLETED
// Security: Hidden entries are convenience only — every route and
//          every server function re-checks the permission.
// ============================================================
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  RotateCcw,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";

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
import { PERMISSIONS, type Permission } from "@/lib/admin.shared";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  permission?: Permission;
};

const OPERATIONS: NavItem[] = [
  { to: "/czp-ops-9f2c", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/czp-ops-9f2c/orders", label: "Orders", icon: ClipboardList, permission: PERMISSIONS.ordersView },
  { to: "/czp-ops-9f2c/products", label: "Products", icon: Package, permission: PERMISSIONS.ordersView },
  { to: "/czp-ops-9f2c/customers", label: "Customers", icon: UsersRound, permission: PERMISSIONS.ordersView },
  { to: "/czp-ops-9f2c/recycle-bin", label: "Recycle Bin", icon: RotateCcw, permission: PERMISSIONS.ordersView },
];

const ADMINISTRATION: NavItem[] = [
  { to: "/czp-ops-9f2c/staff", label: "Staff & roles", icon: Users, permission: PERMISSIONS.staffManage },
  { to: "/czp-ops-9f2c/audit-log", label: "Audit log", icon: ScrollText, permission: PERMISSIONS.auditView },
  { to: "/czp-ops-9f2c/settings", label: "Store settings", icon: Settings, permission: PERMISSIONS.productsManage },
  { to: "/czp-ops-9f2c/security", label: "Security", icon: ShieldCheck },
];

export function AdminSidebar({ permissions }: { permissions: Permission[] }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const allowed = (item: NavItem) => !item.permission || permissions.includes(item.permission);
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
              <SidebarMenuItem key={item.to}>
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <p className="px-2 font-display text-lg font-bold uppercase tracking-wide group-data-[collapsible=icon]:hidden">
          CZP Ops
        </p>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Operations", OPERATIONS)}
        {renderGroup("Administration", ADMINISTRATION)}
      </SidebarContent>
    </Sidebar>
  );
}
