// ============================================================
// ADMIN RBAC / SECURITY SHARED CONTRACTS
// Purpose: Single source of truth for roles, permissions, staff
//          access statuses and admin input schemas. Client-safe
//          (no secrets, no server imports) so the UI and the
//          server functions can never drift apart.
// Status: COMPLETED
// Security: These constants are only labels. Every permission is
//          re-resolved and enforced server-side in admin.server.ts;
//          the UI copy here is convenience, never the gate.
// ============================================================
import { z } from "zod";

export const ADMIN_BASE = "/ad" as const;

export const ROLES = ["super_admin", "admin", "manager", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

export const ACCESS_STATUSES = ["pending", "approved", "inactive", "suspended", "revoked"] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

/** Customer-facing wording for account states (Active/Inactive/Pending/Suspended). */
export const ACCESS_STATUS_LABELS: Record<AccessStatus, string> = {
  pending: "Pending",
  approved: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  revoked: "Revoked",
};

/** Only an approved (Active) account may use the panel. */
export const ACTIVE_STATUS: AccessStatus = "approved";

export const PERMISSIONS = {
  ordersView: "orders.view",
  ordersManage: "orders.manage",
  ordersCreate: "orders.create",
  productsManage: "products.manage",
  customersManage: "customers.manage",
  staffManage: "staff.manage",
  rolesManage: "roles.manage",
  auditView: "audit.view",
  securityManage: "security.manage",
  apiManage: "api.manage",
  couriersView: "couriers.view",
  couriersManage: "couriers.manage",
  shipmentsCreate: "shipments.create",
  contentManage: "content.manage",
  zonesManage: "zones.manage",
  reviewsManage: "reviews.manage",
  loginApprovalsManage: "login_approvals.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "orders.view": "View orders",
  "orders.manage": "Edit orders & status",
  "orders.create": "Create manual orders",
  "products.manage": "Manage products",
  "customers.manage": "Manage customer info",
  "staff.manage": "Approve & manage staff",
  "roles.manage": "Change roles & permissions",
  "audit.view": "View audit log",
  "security.manage": "Manage security settings",
  "api.manage": "Manage API integrations",
  "couriers.view": "View couriers & tracking",
  "couriers.manage": "Configure couriers & API keys",
  "shipments.create": "Book courier shipments",
  "content.manage": "Manage website content",
  "zones.manage": "Manage delivery zones",
  "reviews.manage": "Manage customer reviews",
  "login_approvals.manage": "Manage login approvals",
};

/** Permissions only a Super Admin may ever hold. Never grantable to Staff. */
export const SUPER_ADMIN_ONLY: Permission[] = [
  "roles.manage",
  "security.manage",
  "api.manage",
  "couriers.manage",
];

/** Permissions an Admin/Super Admin may assign to Staff or Managers. */
export const ASSIGNABLE_PERMISSIONS: Permission[] = [
  "orders.view",
  "orders.manage",
  "orders.create",
  "products.manage",
  "customers.manage",
  "staff.manage",
  "audit.view",
  "couriers.view",
  "shipments.create",
  "content.manage",
  "zones.manage",
  "reviews.manage",
];

/** Baseline permissions implied by a role, before explicit grants. */
export const ROLE_DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    "orders.view",
    "orders.manage",
    "orders.create",
    "products.manage",
    "customers.manage",
    "staff.manage",
    "audit.view",
    "couriers.view",
    "shipments.create",
    "content.manage",
    "zones.manage",
    "reviews.manage",
  ],
  manager: [
    "orders.view",
    "orders.manage",
    "orders.create",
    "products.manage",
    "couriers.view",
    "shipments.create",
  ],
  staff: ["orders.view"],
};

export const AUDIT_ACTIONS = {
  loginSuccess: "auth.login",
  loginFailed: "auth.login_failed",
  logout: "auth.logout",
  mfaEnrolled: "security.mfa_enrolled",
  mfaRemoved: "security.mfa_removed",
  mfaBackupCodesIssued: "security.mfa_backup_codes_issued",
  mfaBackupCodeUsed: "security.mfa_backup_code_used",
  passwordReset: "security.password_reset",
  sessionRevoked: "security.session_revoked",
  staffStatusChanged: "staff.status_changed",
  staffRoleChanged: "staff.role_changed",
  staffPermissionsChanged: "staff.permissions_changed",
  orderCreated: "order.created",
  orderUpdated: "order.updated",
  orderStatusChanged: "order.status_changed",
  orderNoteAdded: "order.note_added",
  orderBulkStatusChanged: "order.bulk_status_changed",
  settingsUpdated: "settings.updated",
  productCreated: "product.created",
  productUpdated: "product.updated",
  productStockChanged: "product.stock_changed",
  productRecycled: "product.recycled",
  productRestored: "product.restored",
  productPurged: "product.purged",
  orderRecycled: "order.recycled",
  orderRestored: "order.restored",
  orderPurged: "order.purged",
  orderPinned: "order.pinned",
  orderAssigned: "order.assigned",
  courierShipmentCreated: "courier.shipment_created",
  courierStatusRefreshed: "courier.status_refreshed",
  courierConnectionTested: "courier.connection_tested",
  courierCreated: "courier.created",
  courierUpdated: "courier.updated",
  courierActivated: "courier.activated",
  courierDeactivated: "courier.deactivated",
  courierDeleted: "courier.deleted",
  courierCredentialsChanged: "courier.credentials_changed",
  courierShipmentFailed: "courier.shipment_failed",
  courierTrackingUpdated: "courier.tracking_updated",
  contentUpdated: "content.updated",
  zoneUpdated: "zone.updated",
  userCreated: "user.created",
  userDeleted: "user.deleted",
  reviewUpdated: "review.updated",
  reviewCreated: "review.created",
  reviewDeleted: "review.deleted",
  leadCaptured: "lead.captured",
  staffCreated: "staff.created",
  staffDeleted: "staff.deleted",
  staffPasswordChanged: "staff.password_changed",
  staffProfileUpdated: "staff.profile_updated",
  invoiceSettingsUpdated: "settings.invoice_updated",
} as const;

export const staffStatusInput = z.object({
  userId: z.string().uuid(),
  status: z.enum(ACCESS_STATUSES),
  note: z.string().trim().max(300).optional(),
});

export const staffRoleInput = z.object({
  userId: z.string().uuid(),
  role: z.enum(ROLES),
});

export const staffPermissionsInput = z.object({
  userId: z.string().uuid(),
  permissions: z.array(z.string().max(60)).max(40),
});

export const auditQueryInput = z.object({
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const revokeSessionInput = z.object({ sessionRowId: z.string().uuid() });

export const loginAttemptInput = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

export const backupCodeInput = z.object({ code: z.string().trim().min(4).max(40) });
