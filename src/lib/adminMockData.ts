// --- MOCK DATA cho Admin Dashboard (Step 5 enhancement) ---
// Sẽ được thay bằng Supabase queries ở Step 2 (data layer).

export type RolePermission = 'full' | 'read' | 'own_only' | 'masked' | 'none';
export type RoleKey = 'owner' | 'manager' | 'staff' | 'accountant';

// Doanh thu 30 ngày (T8/2026) — dùng cho chart Tổng quan + Kế toán
export const DAILY_REVENUE: { date: string; day: number; revenue: number; orders: number; profit: number }[] = [
  { date: '01/08', day: 1, revenue: 2450000, orders: 3, profit: 1176000 },
  { date: '02/08', day: 2, revenue: 3100000, orders: 4, profit: 1488000 },
  { date: '03/08', day: 3, revenue: 1850000, orders: 2, profit: 888000 },
  { date: '04/08', day: 4, revenue: 2200000, orders: 3, profit: 1056000 },
  { date: '05/08', day: 5, revenue: 3450000, orders: 5, profit: 1656000 },
  { date: '06/08', day: 6, revenue: 4100000, orders: 6, profit: 1968000 },
  { date: '07/08', day: 7, revenue: 3800000, orders: 5, profit: 1824000 },
  { date: '08/08', day: 8, revenue: 5240000, orders: 12, profit: 2515000 }, // đỉnh
  { date: '09/08', day: 9, revenue: 2900000, orders: 4, profit: 1392000 },
  { date: '10/08', day: 10, revenue: 3300000, orders: 5, profit: 1584000 },
  { date: '11/08', day: 11, revenue: 2750000, orders: 3, profit: 1320000 },
  { date: '12/08', day: 12, revenue: 3600000, orders: 5, profit: 1728000 },
  { date: '13/08', day: 13, revenue: 4200000, orders: 6, profit: 2016000 },
  { date: '14/08', day: 14, revenue: 3950000, orders: 5, profit: 1896000 },
  { date: '15/08', day: 15, revenue: 890000, orders: 2, profit: 427000 }, // đáy CN
  { date: '16/08', day: 16, revenue: 2100000, orders: 3, profit: 1008000 },
  { date: '17/08', day: 17, revenue: 3400000, orders: 4, profit: 1632000 },
  { date: '18/08', day: 18, revenue: 3850000, orders: 5, profit: 1848000 },
  { date: '19/08', day: 19, revenue: 4600000, orders: 7, profit: 2208000 },
  { date: '20/08', day: 20, revenue: 3200000, orders: 4, profit: 1536000 },
  { date: '21/08', day: 21, revenue: 2800000, orders: 3, profit: 1344000 },
  { date: '22/08', day: 22, revenue: 4100000, orders: 6, profit: 1968000 },
  { date: '23/08', day: 23, revenue: 3700000, orders: 5, profit: 1776000 },
  { date: '24/08', day: 24, revenue: 4400000, orders: 6, profit: 2112000 },
  { date: '25/08', day: 25, revenue: 3100000, orders: 4, profit: 1488000 },
  { date: '26/08', day: 26, revenue: 3900000, orders: 5, profit: 1872000 },
  { date: '27/08', day: 27, revenue: 3260000, orders: 4, profit: 1565000 },
  { date: '28/08', day: 28, revenue: 3850000, orders: 5, profit: 1848000 }, // hôm nay
];

// P&L 6 tháng gần nhất (T3–T8/2026)
export const MONTHLY_PL = [
  { month: 'T3', revenue: 62800000, cost: 34100000, profit: 28700000, margin: 45.7 },
  { month: 'T4', revenue: 71200000, cost: 38400000, profit: 32800000, margin: 46.1 },
  { month: 'T5', revenue: 75600000, cost: 40800000, profit: 34800000, margin: 46.0 },
  { month: 'T6', revenue: 78500000, cost: 42200000, profit: 36300000, margin: 46.2 },
  { month: 'T7', revenue: 82610000, cost: 45450000, profit: 37160000, margin: 45.0 },
  { month: 'T8', revenue: 89200000, cost: 46400000, profit: 42800000, margin: 48.0 },
];

// Phân bổ chi phí tháng 8
export const EXPENSE_BREAKDOWN = [
  { category: 'nguyen_lieu', label: 'Nguyên liệu (vải, chỉ, khung)', amount: 28900000, pct: 62.3, color: 'bg-red-500' },
  { category: 'nhan_cong', label: 'Lương thợ thêu (3 người)', amount: 17500000, pct: 37.7, color: 'bg-amber-500' },
];

// Sổ chi chi tiết
export const EXPENSE_ENTRIES = [
  { date: '05/08', category: 'Nguyên liệu', desc: 'Vải lụa tơ tằm 20m', amount: 600000, ref: 'HD-0812' },
  { date: '08/08', category: 'Marketing', desc: 'FB Ads campaign "Sen"', amount: 200000, ref: 'FB-Invoice' },
  { date: '12/08', category: 'Lương thợ', desc: 'Cô Lan — lương kỳ 1', amount: 4500000, ref: 'PC-08/1' },
  { date: '15/08', category: 'Nguyên liệu', desc: 'Chỉ thêu DMC 50 cuộn', amount: 450000, ref: 'HD-0891' },
  { date: '18/08', category: 'Vận chuyển', desc: 'Phí GHN 15 đơn', amount: 180000, ref: 'GHN-8/26' },
  { date: '22/08', category: 'Lương thợ', desc: 'Anh Đức + Chị Mai kỳ 1', amount: 6800000, ref: 'PC-08/2' },
  { date: '25/08', category: 'Nguyên liệu', desc: 'Khung căng + phụ kiện', amount: 850000, ref: 'HD-0912' },
  { date: '27/08', category: 'Marketing', desc: 'TikTok Ads Shop', amount: 350000, ref: 'TT-Invoice' },
  { date: '28/08', category: 'Vận chuyển', desc: 'GHTK bổ sung', amount: 220000, ref: 'GHTK-8/26' },
];

// Sổ thu chi tiết (dùng lại từ ORDER_HISTORY nhưng thêm trạng thái thu tiền)
export const INCOME_ENTRIES = [
  { date: '28/08', orderId: 'SC-0038', customer: 'Thảo Lê', item: 'Vỏ gối Linen (x5)', amount: 1200000, method: 'VNPAY', collected: true },
  { date: '25/08', orderId: 'SC-0035', customer: 'Minh Tú', item: 'Túi Tote Canvas (x1)', amount: 350000, method: 'MOMO', collected: true },
  { date: '24/08', orderId: 'SC-0033', customer: 'Hà Phương', item: 'Áo Phông Thêu Logo (x3)', amount: 1350000, method: 'VNPAY', collected: true },
  { date: '22/08', orderId: 'SC-0031', customer: 'Đức Anh', item: 'Mũ Bucket Custom', amount: 250000, method: 'COD', collected: false },
  { date: '18/08', orderId: 'SC-0025', customer: 'Ngọc Trinh', item: 'Túi Tote Hoa Hồng', amount: 380000, method: 'COD', collected: true },
  { date: '15/08', orderId: 'SC-0022', customer: 'Văn Hùng', item: 'Áo Polo Thêu Tên (x5)', amount: 2250000, method: 'VNPAY', collected: true },
];

// Bestsellers tuần
export const BESTSELLERS = [
  { rank: 1, name: 'Áo dài thêu sen', orders: 12, revenue: 18600000, avgPrice: 1550000, deltaPct: 50, stock: 15, stockUnit: 'm vải', trend: 'up' as const, color: 'brand', img: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=200&q=80' },
  { rank: 2, name: 'Khăn tay thêu hoa cúc', orders: 9, revenue: 2700000, avgPrice: 300000, deltaPct: -18, stock: 32, stockUnit: 'chiếc', trend: 'down' as const, color: 'brand', img: 'https://images.unsplash.com/photo-1615887917253-3f24d5f34ab6?auto=format&fit=crop&w=200&q=80' },
  { rank: 3, name: 'Túi vải thêu chim hạc', orders: 6, revenue: 4140000, avgPrice: 690000, deltaPct: 50, stock: 8, stockUnit: 'chiếc', trend: 'up' as const, color: 'amber', img: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=200&q=80' },
];

// Full product stats (dùng cho tab Kho enhanced)
export const PRODUCT_STATS = [
  { name: 'Áo dài thêu sen',        sku: 'AD-SEN-01', orders: 12, sold: 12, revenue: 18600000, cancelRate: 2.3, marginPct: 62, trendPct: 34, stock: 15, threshold: 10, cogs: 590000 },
  { name: 'Khăn tay hoa cúc',       sku: 'KT-CUC-02', orders: 9,  sold: 15, revenue: 2700000,  cancelRate: 3.1, marginPct: 55, trendPct: 18, stock: 32, threshold: 20, cogs: 135000 },
  { name: 'Túi vải chim hạc',       sku: 'TV-HAC-03', orders: 6,  sold: 6,  revenue: 4140000,  cancelRate: 5.2, marginPct: 60, trendPct: 0,  stock: 8,  threshold: 10, cogs: 276000 },
  { name: 'Áo Phông Thêu Logo',     sku: 'AP-LOGO-04', orders: 5, sold: 15, revenue: 2250000,  cancelRate: 1.8, marginPct: 58, trendPct: 12, stock: 24, threshold: 15, cogs: 63000 },
  { name: 'Mũ Bucket Custom',       sku: 'MB-CUS-05', orders: 4,  sold: 4,  revenue: 1000000,  cancelRate: 8.5, marginPct: 52, trendPct: -8, stock: 45, threshold: 20, cogs: 120000 },
  { name: 'Vỏ gối Linen',           sku: 'VG-LIN-06', orders: 3,  sold: 15, revenue: 3600000,  cancelRate: 4.0, marginPct: 65, trendPct: 22, stock: 18, threshold: 15, cogs: 84000 },
];

// Cảnh báo tồn kho
export const STOCK_ALERTS = [
  { name: 'Vải lụa hồng', current: 4.5, unit: 'm', threshold: 5, severity: 'danger' as const, note: 'Cần đặt lại NCC' },
  { name: 'Túi vải thêu hạc', current: 8, unit: 'chiếc', threshold: 10, severity: 'warning' as const, note: 'Lên kế hoạch sản xuất mới' },
  { name: 'Chỉ thêu DMC #4213 (đỏ)', current: 2, unit: 'cuộn', threshold: 5, severity: 'warning' as const, note: 'Đơn SC-0040 đang chờ' },
];

// Segmentation khách hàng (RFM)
export const CUSTOMER_SEGMENTS = [
  { key: 'vip', label: 'VIP', count: 108, pct: 8.4, revenueContribution: 187500000, avgLtv: 7850000, color: 'brand', desc: '>5 đơn hoặc >5tr' },
  { key: 'regular', label: 'Thường xuyên', count: 286, pct: 22.3, revenueContribution: 142800000, avgLtv: 1420000, color: 'blue', desc: '2-4 đơn, active 60 ngày' },
  { key: 'new', label: 'Mới', count: 512, pct: 39.9, revenueContribution: 68300000, avgLtv: 620000, color: 'amber', desc: 'Đơn đầu tiên <30 ngày' },
  { key: 'churn', label: 'Sắp mất', count: 378, pct: 29.4, revenueContribution: 45600000, avgLtv: 890000, color: 'red', desc: 'Không mua >90 ngày' },
];

// Top VIP customers
export const TOP_VIP_CUSTOMERS = [
  { rank: 1, name: 'Nguyễn Thị Hoa',   phone: '0912***345', orders: 12, spent: 18450000, lastDays: 3,  favorite: 'Áo dài thêu sen',      avatar: 'NH', color: 'bg-brand/10 text-brand' },
  { rank: 2, name: 'Trần Minh Thư',    phone: '0987***123', orders: 8,  spent: 12800000, lastDays: 7,  favorite: 'Khăn thêu hoa cúc',    avatar: 'TT', color: 'bg-blue-100 text-blue-700' },
  { rank: 3, name: 'Lê Bảo Ngọc',      phone: '0345***789', orders: 6,  spent: 9200000,  lastDays: 12, favorite: 'Túi vải chim hạc',     avatar: 'LN', color: 'bg-purple-100 text-purple-700' },
  { rank: 4, name: 'Phạm Hồng Nhung',  phone: '0906***456', orders: 5,  spent: 7650000,  lastDays: 18, favorite: 'Vỏ gối Linen',         avatar: 'PN', color: 'bg-pink-100 text-pink-700' },
  { rank: 5, name: 'Đỗ Diệu Linh',     phone: '0778***234', orders: 5,  spent: 6420000,  lastDays: 25, favorite: 'Áo Phông Thêu Logo',   avatar: 'ĐL', color: 'bg-amber-100 text-amber-700' },
];

// Kênh acquisition
export const ACQUISITION_CHANNELS = [
  { channel: 'Facebook',      count: 462, pct: 36.0, color: 'bg-blue-500', costPer: 45000 },
  { channel: 'TikTok Shop',   count: 358, pct: 27.9, color: 'bg-gray-900', costPer: 32000 },
  { channel: 'Google Search', count: 246, pct: 19.2, color: 'bg-emerald-500', costPer: 28000 },
  { channel: 'Trực tiếp',     count: 138, pct: 10.8, color: 'bg-purple-500', costPer: 0 },
  { channel: 'Giới thiệu',    count: 80,  pct: 6.1,  color: 'bg-amber-500', costPer: 0 },
];

// Cảnh báo cho tab Tổng quan
export const OVERVIEW_ALERTS = [
  { level: 'danger' as const,  icon: '🔴', msg: 'Đơn SC-0040 (Bảo Trần) tạm dừng do hết chỉ đỏ #42R',        cta: 'Xử lý ngay',        link: 'orders' },
  { level: 'warning' as const, icon: '🟡', msg: 'Vải lụa hồng còn <5m — dự báo hết trước 03/09',              cta: 'Đặt bổ sung',       link: 'products' },
  { level: 'warning' as const, icon: '🟡', msg: 'Túi vải thêu hạc còn 8 chiếc — nhu cầu tuần tới ~10',        cta: 'Lên kế hoạch',      link: 'products' },
];

// ================= PERMISSIONS SYSTEM =================

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

// Team members
export const TEAM_MEMBERS = [
  { id: 'u1', name: 'Trần Bảo Vinh',     email: 'vinhtb@growly.life',        role: 'owner' as RoleKey,      status: 'active' as const,  lastSeen: 'Đang online', contribution: '47 đơn tạo',        avatar: 'V',  avatarColor: 'bg-brand text-white' },
  { id: 'u2', name: 'Nguyễn Thị Hương',  email: 'huong.nguyen@soichi.vn',   role: 'manager' as RoleKey,    status: 'active' as const,  lastSeen: '10 phút trước', contribution: '38 đơn duyệt',    avatar: 'H',  avatarColor: 'bg-blue-100 text-blue-700' },
  { id: 'u3', name: 'Lê Thị Mai',        email: 'mai.le@soichi.vn',         role: 'staff' as RoleKey,      status: 'active' as const,  lastSeen: '2 giờ trước',   contribution: '34 đơn thêu',     avatar: 'M',  avatarColor: 'bg-amber-100 text-amber-700' },
  { id: 'u4', name: 'Phạm Văn Đức',      email: 'duc.pham@soichi.vn',       role: 'staff' as RoleKey,      status: 'active' as const,  lastSeen: 'Hôm qua',       contribution: '28 đơn đóng gói', avatar: 'Đ',  avatarColor: 'bg-amber-100 text-amber-700' },
  { id: 'u5', name: 'Vũ Thị Lan',        email: 'lan.vu@soichi.vn',         role: 'accountant' as RoleKey, status: 'invited' as const, lastSeen: 'Chưa kích hoạt', contribution: '—',              avatar: 'L',  avatarColor: 'bg-gray-100 text-gray-500' },
];

// Ma trận permissions
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
