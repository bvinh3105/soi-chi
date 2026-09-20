// --- Admin Dashboard config + placeholders ---
// 2026-09-20: Chuyển sang production — mọi dataset demo đã được clear (rỗng
// hoặc 0). ROLE_META và PERMISSIONS_MATRIX là config (không phải demo)
// nên vẫn giữ. TEAM_MEMBERS giờ đọc từ Supabase qua bảng `profiles` — chỉ
// giữ shape lại để UI cũ không break trong lúc migration.

export type RolePermission = 'full' | 'read' | 'own_only' | 'masked' | 'none';
export type RoleKey = 'owner' | 'manager' | 'staff' | 'accountant';

// Doanh thu theo ngày — rỗng cho tới khi query từ bảng `orders`
export const DAILY_REVENUE: { date: string; day: number; revenue: number; orders: number; profit: number }[] = [];

// P&L theo tháng — rỗng cho tới khi query từ bảng `orders` + `payments`
export const MONTHLY_PL: { month: string; revenue: number; cost: number; profit: number; margin: number }[] = [];

// Phân bổ chi phí — chờ nhập tay hoặc tích hợp bookkeeping
export const EXPENSE_BREAKDOWN: { category: string; label: string; amount: number; pct: number; color: string }[] = [];

// Sổ chi
export const EXPENSE_ENTRIES: { date: string; category: string; desc: string; amount: number; ref: string }[] = [];

// Sổ thu
export const INCOME_ENTRIES: { date: string; orderId: string; customer: string; item: string; amount: number; method: string; collected: boolean }[] = [];

// Bestsellers — sẽ tính từ bảng `order_items`
export const BESTSELLERS: { rank: number; name: string; orders: number; revenue: number; avgPrice: number; deltaPct: number; stock: number; stockUnit: string; trend: 'up' | 'down'; color: string; img: string }[] = [];

// Full product stats
export const PRODUCT_STATS: { name: string; sku: string; orders: number; sold: number; revenue: number; cancelRate: number; marginPct: number; trendPct: number; stock: number; threshold: number; cogs: number }[] = [];

// Cảnh báo tồn kho
export const STOCK_ALERTS: { name: string; current: number; unit: string; threshold: number; severity: 'danger' | 'warning'; note: string }[] = [];

// Segmentation khách hàng (RFM)
export const CUSTOMER_SEGMENTS: { key: string; label: string; count: number; pct: number; revenueContribution: number; avgLtv: number; color: string; desc: string }[] = [];

// Top VIP customers
export const TOP_VIP_CUSTOMERS: { rank: number; name: string; phone: string; orders: number; spent: number; lastDays: number; favorite: string; avatar: string; color: string }[] = [];

// Kênh acquisition
export const ACQUISITION_CHANNELS: { channel: string; count: number; pct: number; color: string; costPer: number }[] = [];

// Cảnh báo overview
export const OVERVIEW_ALERTS: { level: 'danger' | 'warning'; icon: string; msg: string; cta: string; link: string }[] = [];

// ================= PERMISSIONS SYSTEM (CONFIG — GIỮ LẠI) =================

export const ROLE_META: Record<RoleKey, { label: string; icon: string; badgeClass: string; description: string }> = {
  owner: {
    label: 'Owner',
    icon: '👑',
    badgeClass: 'bg-brand/10 text-brand border-brand/30',
    description: 'Chủ shop — toàn quyền, xem báo cáo P&L',
  },
  manager: {
    label: 'Manager',
    icon: '💼',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Quản lý đơn, kho, khách hàng — không xem P&L',
  },
  staff: {
    label: 'Staff',
    icon: '🧵',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Thợ thêu — chỉ xem đơn được phân công',
  },
  accountant: {
    label: 'Accountant',
    icon: '🧮',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Kế toán — chỉ tài chính, không xem info KH',
  },
};

// Team members — legacy shape giữ để UI không lỗi; giờ đọc từ Supabase qua
// hook useTeamMembers() (xem src/lib/team.ts) chứ không phải array này.
export const TEAM_MEMBERS: { id: string; name: string; email: string; role: RoleKey; status: 'active' | 'invited'; lastSeen: string; contribution: string; avatar: string; avatarColor: string }[] = [];

// Ma trận permissions (CONFIG — không phải demo)
export const PERMISSIONS_MATRIX: {
  category: string;
  permissions: { key: string; label: string; owner: RolePermission; manager: RolePermission; staff: RolePermission; accountant: RolePermission }[];
}[] = [
  {
    category: 'Đơn hàng',
    permissions: [
      { key: 'view_all',      label: 'Xem tất cả đơn',           owner: 'full', manager: 'full', staff: 'own_only', accountant: 'masked' },
      { key: 'create',        label: 'Tạo đơn thủ công',         owner: 'full', manager: 'full', staff: 'none',     accountant: 'none' },
      { key: 'change_status', label: 'Đổi trạng thái',           owner: 'full', manager: 'full', staff: 'own_only', accountant: 'none' },
      { key: 'refund',        label: 'Hoàn tiền',                owner: 'full', manager: 'read', staff: 'none',     accountant: 'full' },
    ],
  },
  {
    category: 'Kho & Sản phẩm',
    permissions: [
      { key: 'view_stock',    label: 'Xem tồn kho',              owner: 'full', manager: 'full', staff: 'read', accountant: 'read' },
      { key: 'edit_product',  label: 'Sửa sản phẩm/giá',         owner: 'full', manager: 'full', staff: 'none', accountant: 'none' },
      { key: 'view_cogs',     label: 'Xem giá vốn (COGS)',       owner: 'full', manager: 'read', staff: 'none', accountant: 'full' },
    ],
  },
  {
    category: 'Khách hàng',
    permissions: [
      { key: 'view_list',     label: 'Xem danh sách KH',         owner: 'full', manager: 'full', staff: 'none', accountant: 'masked' },
      { key: 'view_contact',  label: 'Xem SĐT/Email',            owner: 'full', manager: 'full', staff: 'none', accountant: 'masked' },
      { key: 'export_csv',    label: 'Xuất CSV KH',              owner: 'full', manager: 'read', staff: 'none', accountant: 'none' },
    ],
  },
  {
    category: 'Tài chính',
    permissions: [
      { key: 'view_revenue',  label: 'Xem doanh thu',            owner: 'full', manager: 'read', staff: 'none', accountant: 'full' },
      { key: 'view_pnl',      label: 'Xem báo cáo P&L',          owner: 'full', manager: 'none', staff: 'none', accountant: 'full' },
      { key: 'export_report', label: 'Xuất báo cáo Excel/PDF',   owner: 'full', manager: 'none', staff: 'none', accountant: 'full' },
    ],
  },
  {
    category: 'Marketing',
    permissions: [
      { key: 'send_voucher',  label: 'Gửi voucher/campaign',     owner: 'full', manager: 'full', staff: 'none', accountant: 'none' },
      { key: 'view_channels', label: 'Xem kênh acquisition',     owner: 'full', manager: 'full', staff: 'none', accountant: 'read' },
    ],
  },
  {
    category: 'Hệ thống',
    permissions: [
      { key: 'manage_members', label: 'Quản lý thành viên',      owner: 'full', manager: 'none', staff: 'none', accountant: 'none' },
      { key: 'edit_permissions', label: 'Sửa phân quyền',        owner: 'full', manager: 'none', staff: 'none', accountant: 'none' },
      { key: 'audit_log',     label: 'Xem log kiểm toán',        owner: 'full', manager: 'read', staff: 'none', accountant: 'read' },
    ],
  },
];

// Helper format số VND
export function formatVnd(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

// Helper rút gọn số lớn (1.2M, 89.2tr)
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace('.0', '') + 'tr';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'k';
  return amount.toString();
}
