"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GitProgressTracker, { type ProgressStep } from '@/components/GitProgressTracker';
import { useProducts, createProduct, updateProduct, deleteProduct, type ProductInput } from '@/lib/products';
import { deleteOrder } from '@/lib/orders';
import {
  DAILY_REVENUE,
  MONTHLY_PL,
  EXPENSE_BREAKDOWN,
  EXPENSE_ENTRIES,
  INCOME_ENTRIES,
  BESTSELLERS,
  PRODUCT_STATS,
  STOCK_ALERTS,
  CUSTOMER_SEGMENTS,
  TOP_VIP_CUSTOMERS,
  ACQUISITION_CHANNELS,
  OVERVIEW_ALERTS,
  ROLE_META,
  TEAM_MEMBERS,
  PERMISSIONS_MATRIX,
  formatVnd,
  formatCompact,
  type RolePermission,
  type RoleKey,
} from '@/lib/adminMockData';

// --- HELPER: Tạo steps cho GitProgressTracker dựa trên trạng thái đơn hàng ---
function buildOrderSteps(order: typeof INITIAL_ORDERS[number]): ProgressStep[] {
  const steps: ProgressStep[] = [
    { id: 'created', status: 'delivered', title: 'Tạo đơn hàng', description: `Khách ${order.name} đặt đơn — ${order.items}`, timestamp: '27/08/2026 14:30', branchType: 'none' },
    { id: 'confirmed', status: 'delivered', title: 'Xác nhận đơn', description: 'Đã kiểm duyệt nội dung thêu, xác nhận thanh toán.', timestamp: '27/08/2026 15:00', branchType: 'none' },
  ];

  if (order.status === 'pending') {
    steps[1] = { ...steps[1], status: 'working', title: 'Chờ xử lý', description: 'Đơn hàng đang chờ admin xác nhận và phân công sản xuất.', timestamp: order.time };
    steps.push(
      { id: 'produce', status: 'empty', title: 'Sản xuất', description: 'Chờ phân công máy thêu & thợ.', branchType: 'none' },
      { id: 'qc', status: 'empty', title: 'Kiểm tra chất lượng', description: 'Chờ bước trước hoàn thành.', branchType: 'none' },
      { id: 'ship', status: 'empty', title: 'Giao hàng', description: 'Chờ đóng gói & bàn giao vận chuyển.', branchType: 'none' },
    );
  } else if (order.status === 'producing') {
    steps.push(
      { id: 'produce', status: 'working', title: 'Đang sản xuất', description: `Phân công ${order.machine || 'Máy thêu'}. Tiến độ ${order.progress || 0}%.`, timestamp: order.time, branchType: 'none' },
      { id: 'qc', status: 'empty', title: 'Kiểm tra chất lượng', description: 'Chờ sản xuất xong để kiểm tra.', branchType: 'none' },
      { id: 'ship', status: 'empty', title: 'Giao hàng', description: 'Chờ đóng gói & bàn giao vận chuyển.', branchType: 'none' },
    );
  } else if (order.status === 'issue') {
    steps.push(
      { id: 'produce', status: 'working', title: 'Đang sản xuất', description: `Phân công sản xuất.`, timestamp: '27/08/2026 16:00', branchType: 'none' },
      { id: 'issue', status: 'paused', title: 'Tạm dừng — Vấn đề', description: order.note || 'Phát hiện lỗi trong quá trình sản xuất.', timestamp: order.time, branchType: 'issue' },
      { id: 'qc', status: 'empty', title: 'Kiểm tra chất lượng', description: 'Chờ giải quyết vấn đề.', branchType: 'none' },
      { id: 'ship', status: 'empty', title: 'Giao hàng', description: 'Chờ đóng gói & bàn giao vận chuyển.', branchType: 'none' },
    );
  }

  return steps;
}

// --- MOCK DATA ---
const STAFF = [
  { name: 'Chị Lan', role: 'Thợ thêu chính', phone: '0901 234 567', avatar: 'CL', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Anh Đức', role: 'Thợ thêu', phone: '0912 345 678', avatar: 'AĐ', color: 'bg-sky-100 text-sky-700' },
  { name: 'Chị Mai', role: 'QC / Đóng gói', phone: '0923 456 789', avatar: 'CM', color: 'bg-amber-100 text-amber-700' },
];

const INITIAL_ORDERS = [
  // === CHỜ XỬ LÝ === (chờ admin duyệt/phân công)
  { id: 'SC-0042', status: 'pending', color: 'gray', name: 'Khánh Huyền', price: '700.000đ', paymentMethod: 'COD', time: '2 phút trước', items: 'Túi Tote Hoa Cúc (x2)', avatar: 'KH', assignee: null as typeof STAFF[number] | null, createdAt: '2026-08-30' },
  { id: 'SC-0043', status: 'pending', color: 'gray', name: 'An Nguyễn', price: '250.000đ', paymentMethod: 'MOMO', time: '1 giờ trước', items: 'Mũ Bucket Custom', avatar: 'AN', urgent: true, assignee: null as typeof STAFF[number] | null, createdAt: '2026-08-30' },
  { id: 'SC-0044', status: 'pending', color: 'gray', name: 'Trần Thảo Vy', price: '890.000đ', paymentMethod: 'VNPAY', time: '20 phút trước', items: 'Tranh thêu hoa sen', avatar: 'TV', assignee: null as typeof STAFF[number] | null, hasCustomDesign: true, createdAt: '2026-08-30' },

  // === ĐANG SẢN XUẤT === (thợ đang thêu)
  { id: 'SC-0038', status: 'producing', color: 'blue', name: 'Thảo Lê', price: '1.200.000đ', paymentMethod: 'VNPAY', time: 'Hôm qua', items: 'Vỏ gối Linen (x5)', avatar: 'TL', progress: 60, machine: 'Máy #02', assignee: STAFF[0], createdAt: '2026-08-29' },
  { id: 'SC-0039', status: 'producing', color: 'blue', name: 'Ngọc Hà', price: '520.000đ', paymentMethod: 'MOMO', time: '2 ngày trước', items: 'Khăn Thêu Chữ Nghệ Thuật', avatar: 'NH', progress: 30, machine: 'Bàn thêu tay', assignee: STAFF[1], createdAt: '2026-08-28' },

  // === TẠM DỪNG === (có vấn đề)
  { id: 'SC-0040', status: 'issue', color: 'purple', name: 'Bảo Trần', price: '350.000đ', paymentMethod: 'COD', time: '2 ngày trước', items: 'Túi Canvas Custom', avatar: 'BT', note: 'Hết chỉ đỏ mã #42R', assignee: STAFF[1], createdAt: '2026-08-28' },

  // === KIỂM TRA QC === (đã thêu xong, chờ QC)
  { id: 'SC-0037', status: 'qc', color: 'green', name: 'Minh Đức', price: '450.000đ', paymentMethod: 'VNPAY', time: '3 giờ trước', items: 'Áo Phông Thêu Logo (x2)', avatar: 'MĐ', assignee: STAFF[2], qcStep: 'Kiểm đường chỉ', createdAt: '2026-08-30' },
  { id: 'SC-0036', status: 'qc', color: 'green', name: 'Hồng Yến', price: '760.000đ', paymentMethod: 'MOMO', time: '5 giờ trước', items: 'Bộ tự thêu hoa cúc (x3)', avatar: 'HY', assignee: STAFF[2], qcStep: 'Đóng gói', createdAt: '2026-08-30' },

  // === ĐANG GIAO === (đã bàn giao đơn vị vận chuyển)
  { id: 'SC-0034', status: 'shipping', color: 'amber', name: 'Phương Anh', price: '580.000đ', paymentMethod: 'COD', time: '1 ngày trước', items: 'Thêu tên áo phông (x3)', avatar: 'PA', assignee: STAFF[2], shipper: 'GHN', trackingNo: 'GHN2612345', createdAt: '2026-08-29' },
  { id: 'SC-0032', status: 'shipping', color: 'amber', name: 'Diệu Anh', price: '1.020.000đ', paymentMethod: 'VNPAY', time: '2 ngày trước', items: 'Thêu logo đồng phục (x5)', avatar: 'DA', assignee: STAFF[0], shipper: 'GHTK', trackingNo: 'GHTK8899123', createdAt: '2026-08-28' },

  // === HOÀN THÀNH === (khách đã nhận)
  { id: 'SC-0035', status: 'delivered', color: 'emerald', name: 'Minh Tú', price: '350.000đ', paymentMethod: 'MOMO', time: '3 ngày trước', items: 'Tote Cúc Họa Mi', avatar: 'MT', assignee: STAFF[0], rating: 5, completedAt: '25/08/2026', createdAt: '2026-08-27' },
  { id: 'SC-0030', status: 'delivered', color: 'emerald', name: 'Hà Anh', price: '890.000đ', paymentMethod: 'VNPAY', time: '5 ngày trước', items: 'Tranh phong cảnh làng quê', avatar: 'HA', assignee: STAFF[1], rating: 4, completedAt: '23/08/2026', createdAt: '2026-08-25' },

  // === ĐÃ HỦY === (đơn bị hủy)
  { id: 'SC-0041', status: 'cancelled', color: 'red', name: 'Thu Trang', price: '280.000đ', paymentMethod: 'COD', time: '1 ngày trước', items: 'Khăn thêu chữ', avatar: 'TT', cancelReason: 'Khách đổi ý trước SX', assignee: null as typeof STAFF[number] | null, cancelledAt: '27/08/2026', createdAt: '2026-08-29' },
];

// --- LỊCH SỬ ĐƠN HÀNG (đã hoàn thành / hủy / hoàn) ---
const ORDER_HISTORY = [
  { id: 'SC-0035', status: 'delivered', name: 'Minh Tú', items: 'Túi Tote Canvas (x1)', price: '350.000đ', paymentMethod: 'MOMO', avatar: 'MT', assignee: STAFF[0], completedAt: '25/08/2026', orderedAt: '20/08/2026', deliveryDays: 5, rating: 5 },
  { id: 'SC-0033', status: 'delivered', name: 'Hà Phương', items: 'Áo Phông Thêu Logo (x3)', price: '1.350.000đ', paymentMethod: 'VNPAY', avatar: 'HP', assignee: STAFF[1], completedAt: '24/08/2026', orderedAt: '18/08/2026', deliveryDays: 6, rating: 4 },
  { id: 'SC-0031', status: 'delivered', name: 'Đức Anh', items: 'Mũ Bucket Custom', price: '250.000đ', paymentMethod: 'COD', avatar: 'ĐA', assignee: STAFF[0], completedAt: '22/08/2026', orderedAt: '17/08/2026', deliveryDays: 5, rating: 5 },
  { id: 'SC-0029', status: 'cancelled', name: 'Thu Hằng', items: 'Vỏ gối Linen (x2)', price: '480.000đ', paymentMethod: 'MOMO', avatar: 'TH', assignee: null, cancelledAt: '21/08/2026', orderedAt: '21/08/2026', reason: 'Khách đổi ý, hủy trước khi sản xuất' },
  { id: 'SC-0027', status: 'refunded', name: 'Quốc Bảo', items: 'Túi Canvas Custom', price: '320.000đ', paymentMethod: 'VNPAY', avatar: 'QB', assignee: STAFF[1], refundedAt: '19/08/2026', orderedAt: '12/08/2026', reason: 'Lỗi thêu sai font chữ, hoàn tiền 100%' },
  { id: 'SC-0025', status: 'delivered', name: 'Ngọc Trinh', items: 'Túi Tote Hoa Hồng (x1)', price: '380.000đ', paymentMethod: 'COD', avatar: 'NT', assignee: STAFF[2], completedAt: '18/08/2026', orderedAt: '13/08/2026', deliveryDays: 5, rating: 5 },
  { id: 'SC-0022', status: 'delivered', name: 'Văn Hùng', items: 'Áo Polo Thêu Tên (x5)', price: '2.250.000đ', paymentMethod: 'VNPAY', avatar: 'VH', assignee: STAFF[0], completedAt: '15/08/2026', orderedAt: '08/08/2026', deliveryDays: 7, rating: 4 },
  { id: 'SC-0019', status: 'cancelled', name: 'Yến Nhi', items: 'Khăn Thêu Custom', price: '150.000đ', paymentMethod: 'COD', avatar: 'YN', assignee: null, cancelledAt: '10/08/2026', orderedAt: '10/08/2026', reason: 'Không liên lạc được khách sau 48h' },
];

// Retention: giữ 60 ngày trong DB, sau đó archive → Excel
const PROFIT_MARGIN = 0.48; // Biên lợi nhuận ~ 48%
const RETENTION_DAYS = 60;
const ARCHIVE_POLICY = {
  keepInDb: RETENTION_DAYS,
  autoExportFormat: 'xlsx',
  exportFolder: 'Google Drive > Sợi chỉ > Archive > Orders',
  schedule: 'Tự động chạy đầu mỗi tháng (1st)',
  includes: ['Đơn hàng', 'Lịch sử trạng thái', 'Thanh toán', 'Thông tin khách'],
};

const MOCK_PRODUCTS = [
  { name: 'Túi Tote Hoa Cúc', cost: '150.000đ', originalPrice: '350.000đ', discount: '10%', finalPrice: '315.000đ', stock: 0, alert: true, avatar: 'T' },
  { name: 'Mũ Bucket Custom', cost: '120.000đ', originalPrice: '250.000đ', discount: null, finalPrice: '250.000đ', stock: 45, alert: false, avatar: 'M' },
];

const MOCK_CUSTOMERS = [
  { name: 'Khánh Huyền', email: 'khanhhuyen.design@gmail.com', phone: '0987 654 321', orders: 4, spent: '2.150.000đ', vip: true, avatar: 'KH' },
  { name: 'An Nguyễn', email: 'an.nguyen99@gmail.com', phone: '0345 123 999', orders: 1, spent: '250.000đ', vip: false, avatar: 'AN' },
];

const COLUMNS = [
  { id: 'pending',   title: 'Chờ xử lý',    icon: '⏳', colorClass: 'bg-gray-400',                  badgeClass: 'bg-gray-300/50 text-gray-600',   containerClass: 'bg-gray-100',    borderTop: '' },
  { id: 'producing', title: 'Đang sản xuất', icon: '🧵', colorClass: 'bg-blue-500 animate-pulse',   badgeClass: 'bg-blue-100 text-blue-700',     containerClass: 'bg-blue-50/40',   borderTop: 'border-t-4 border-t-blue-500' },
  { id: 'issue',     title: 'Tạm dừng',     icon: '⏸', colorClass: 'bg-purple-500',                badgeClass: 'bg-purple-200 text-purple-800', containerClass: 'bg-purple-50',   borderTop: 'border-t-4 border-t-purple-500', titleColor: 'text-purple-900' },
  { id: 'qc',        title: 'Kiểm tra QC',  icon: '🔍', colorClass: 'bg-green-500',                 badgeClass: 'bg-green-100 text-green-700',   containerClass: 'bg-green-50/40', borderTop: 'border-t-4 border-t-green-500' },
  { id: 'shipping',  title: 'Đang giao',    icon: '🚚', colorClass: 'bg-amber-500',                 badgeClass: 'bg-amber-100 text-amber-700',   containerClass: 'bg-amber-50/40', borderTop: 'border-t-4 border-t-amber-500' },
  { id: 'delivered', title: 'Hoàn thành',   icon: '✅', colorClass: 'bg-emerald-500',               badgeClass: 'bg-emerald-100 text-emerald-700', containerClass: 'bg-emerald-50/40', borderTop: 'border-t-4 border-t-emerald-500' },
  { id: 'cancelled', title: 'Đã hủy',       icon: '❌', colorClass: 'bg-red-500',                   badgeClass: 'bg-red-100 text-red-700',       containerClass: 'bg-red-50/40',   borderTop: 'border-t-4 border-t-red-400', titleColor: 'text-red-800' },
];

// --- SORTABLE ITEM COMPONENT ---
function SortableOrderCard({ order, onClick, isOverlay }: { order: any, onClick?: () => void, isOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id, data: { type: 'Order', order } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const badgeColor = order.paymentMethod === 'MOMO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';

  const isTerminal = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-lg p-4 shadow-sm cursor-grab border hover:shadow-md hover:border-gray-300 transition-all
        ${order.status === 'issue' ? 'border-l-4 border-l-purple-500 border-transparent' : ''}
        ${order.status === 'qc' ? 'border-l-4 border-l-green-500 border-transparent' : ''}
        ${order.status === 'shipping' ? 'border-l-4 border-l-amber-500 border-transparent' : ''}
        ${order.status === 'delivered' ? 'border-l-4 border-l-emerald-500 border-transparent bg-emerald-50/30' : ''}
        ${order.status === 'cancelled' ? 'border-l-4 border-l-red-400 border-transparent bg-red-50/30 opacity-70' : ''}
        ${!['issue','qc','shipping','delivered','cancelled'].includes(order.status) ? 'border-transparent' : ''}
        ${isOverlay ? 'shadow-xl rotate-2 cursor-grabbing' : ''}
      `}
    >
      {/* Header: ID + Timestamp/Badge */}
      <div className="flex justify-between items-start mb-2">
        <span className={`text-sm font-bold ${order.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{order.order_number || order.id}</span>
        {order.status === 'issue' && <span className="text-[10px] text-white bg-purple-500 px-1.5 py-0.5 rounded uppercase font-bold">Hold</span>}
        {order.status === 'qc' && <span className="text-[10px] text-white bg-green-500 px-1.5 py-0.5 rounded uppercase font-bold">QC</span>}
        {order.status === 'delivered' && <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">✓ Đã nhận</span>}
        {order.status === 'cancelled' && <span className="text-[10px] font-bold text-red-600 uppercase">Đã hủy</span>}
        {order.status === 'shipping' && !order.trackingNo && <span className="text-xs text-amber-600 font-medium">🚚 Đang giao</span>}
        {!['issue','qc','delivered','cancelled','shipping'].includes(order.status) && (
          order.urgent ? <span className="text-xs text-red-500 font-medium">⚠ Trễ</span> : <span className="text-xs text-gray-500">{order.time}</span>
        )}
      </div>

      {/* Item name */}
      <h3 className={`font-medium text-sm mb-2 ${order.status === 'cancelled' ? 'text-gray-500 line-through' : order.status === 'delivered' ? 'text-emerald-800' : 'text-gray-800'}`}>{order.items}</h3>

      {/* Custom design badge */}
      {order.hasCustomDesign && (
        <span className="inline-block text-[10px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded mb-2">🎨 Custom design</span>
      )}

      {/* ISSUE — note */}
      {order.status === 'issue' && order.note && (
        <p className="text-xs text-gray-500 mb-2 border-l-2 border-purple-300 pl-2 italic">{order.note}</p>
      )}

      {/* CANCELLED — reason */}
      {order.status === 'cancelled' && order.cancelReason && (
        <div className="bg-red-50 border border-red-100 rounded p-2 mb-2">
          <p className="text-[10px] text-red-700 font-bold uppercase mb-0.5">Lý do hủy</p>
          <p className="text-xs text-red-600">{order.cancelReason}</p>
        </div>
      )}

      {/* PRODUCING — progress bar */}
      {order.status === 'producing' && order.progress && (
        <>
          <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-0.5">
            <span>Tiến độ thêu</span><span className="font-bold text-blue-600">{order.progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${order.progress}%` }}></div>
          </div>
        </>
      )}

      {/* QC — step badge */}
      {order.status === 'qc' && order.qcStep && (
        <div className="bg-green-50 border border-green-100 rounded p-2 mb-2 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
          <span className="text-[11px] text-green-700 font-medium">Bước: {order.qcStep}</span>
        </div>
      )}

      {/* SHIPPING — tracking info */}
      {order.status === 'shipping' && order.trackingNo && (
        <div className="bg-amber-50 border border-amber-100 rounded p-2 mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold text-amber-700 uppercase">🚚 {order.shipper}</span>
            <span className="text-[10px] text-amber-600 font-bold">Đang giao</span>
          </div>
          <p className="text-xs font-mono text-amber-800 font-bold">{order.trackingNo}</p>
        </div>
      )}

      {/* DELIVERED — rating */}
      {order.status === 'delivered' && order.rating && (
        <div className="bg-emerald-50 border border-emerald-100 rounded p-2 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-700">Khách đánh giá</span>
          <span className="text-xs">{'⭐'.repeat(order.rating)}<span className="text-gray-300">{'⭐'.repeat(5 - order.rating)}</span></span>
        </div>
      )}

      {/* Urgent flag */}
      {order.urgent && !['issue','delivered','cancelled'].includes(order.status) && (
        <div className="bg-red-50 text-red-700 text-xs p-1.5 rounded mb-3 mt-1 border border-red-100">Cần gấp thứ 7</div>
      )}

      {/* Assignee (không hiện cho delivered/cancelled) */}
      {!isTerminal && order.assignee && (
        <div className="flex items-center gap-2 mt-2 p-1.5 bg-gray-50 rounded border border-gray-100">
          <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${order.assignee.color}`}>{order.assignee.avatar}</div>
          <span className="text-[11px] font-medium text-gray-600">{order.assignee.name}</span>
          <span className="text-[9px] text-gray-400 ml-auto">{order.assignee.role}</span>
        </div>
      )}
      {!isTerminal && !order.assignee && (
        <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-yellow-50 rounded border border-yellow-100 border-dashed">
          <span className="text-[11px] text-yellow-600 font-medium">⚡ Chưa phân công</span>
        </div>
      )}

      {/* Footer: Avatar + Price */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {order.status !== 'issue' && <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${badgeColor}`}>{order.avatar}</div>}
          {order.status === 'producing' && order.machine && <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{order.machine}</span>}
          {order.status === 'delivered' && order.completedAt && <span className="text-[10px] text-emerald-600 font-mono">✓ {order.completedAt}</span>}
          {order.status === 'cancelled' && order.cancelledAt && <span className="text-[10px] text-red-500 font-mono">{order.cancelledAt}</span>}
        </div>
        {order.status !== 'issue' && (
          <span className={`text-xs font-bold ${order.status === 'cancelled' ? 'text-gray-400 line-through' : order.status === 'delivered' ? 'text-emerald-700' : 'text-gray-900'}`}>{order.price}</span>
        )}
      </div>
    </div>
  );
}


// --- DROPPABLE COLUMN WRAPPER (để cột trống nhận drop) ---
function DroppableColumn({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'Column' } });
  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? 'ring-2 ring-emerald-400 ring-inset bg-emerald-50/60' : ''} transition-colors`}>
      {children}
    </div>
  );
}

// --- PERMISSION CELL COMPONENT (dùng cho ma trận phân quyền) ---
function PermissionCell({ value, small = false }: { value: RolePermission; small?: boolean }) {
  const size = small ? 'w-4 h-4' : 'w-5 h-5';
  const map: Record<RolePermission, { icon: React.ReactNode; className: string; label: string }> = {
    full: {
      icon: <svg className={`${size} text-emerald-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>,
      className: 'bg-emerald-50 border-emerald-200',
      label: 'Toàn quyền',
    },
    read: {
      icon: <svg className={`${size} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>,
      className: 'bg-blue-50 border-blue-200',
      label: 'Chỉ xem',
    },
    own_only: {
      icon: <svg className={`${size} text-amber-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>,
      className: 'bg-amber-50 border-amber-200',
      label: 'Chỉ của mình',
    },
    masked: {
      icon: <svg className={`${size} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>,
      className: 'bg-purple-50 border-purple-200',
      label: 'Ẩn danh',
    },
    none: {
      icon: <svg className={`${size} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>,
      className: 'bg-gray-50 border-gray-200',
      label: 'Không có',
    },
  };
  const m = map[value];
  return (
    <div className={`inline-flex items-center justify-center ${small ? 'w-6 h-6' : 'w-8 h-8'} rounded-md border ${m.className}`} title={m.label}>
      {m.icon}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}

type AdminTab = 'overview' | 'orders' | 'products' | 'customers' | 'history' | 'accounting' | 'roles';
const CURRENT_ROLE: RoleKey = 'owner'; // TODO: lấy từ Supabase session ở Step 2

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'delivered' | 'cancelled' | 'refunded'>('all');
  const [showArchiveInfo, setShowArchiveInfo] = useState(false);
  const [revenueRange, setRevenueRange] = useState<'7' | '30'>('7');

  // Modal states
  const [orderModal, setOrderModal] = useState<any>(null);
  const [productModal, setProductModal] = useState<any>(null);
  const [customerModal, setCustomerModal] = useState<any>(null);

  // Revenue drill-down: click vào card doanh thu → xem chi tiết đơn
  const [revenueDrill, setRevenueDrill] = useState<'delivered' | 'active' | 'all' | 'profit' | null>(null);
  const [revenueDrillSearch, setRevenueDrillSearch] = useState('');
  const [revenuePeriod, setRevenuePeriod] = useState<'today' | '7days' | 'month' | 'all'>('all');

  // Xóa đơn hàng — flow gõ lại mã đơn để xác nhận
  const [deleteOrderConfirmOpen, setDeleteOrderConfirmOpen] = useState(false);
  const [deleteOrderConfirmText, setDeleteOrderConfirmText] = useState('');
  const [deleteOrderInFlight, setDeleteOrderInFlight] = useState(false);
  const [deleteOrderError, setDeleteOrderError] = useState<string | null>(null);

  const closeAllModals = () => {
    setOrderModal(null);
    setProductModal(null);
    setCustomerModal(null);
    setRevenueDrill(null);
    setRevenueDrillSearch('');
    setDeleteOrderConfirmOpen(false);
    setDeleteOrderConfirmText('');
    setDeleteOrderError(null);
  };

  async function handleDeleteOrder() {
    if (!orderModal) return;
    const expected = orderModal.order_number || orderModal.id;
    if (deleteOrderConfirmText.trim() !== expected) {
      setDeleteOrderError(`Mã đơn nhập không khớp. Cần gõ chính xác: ${expected}`);
      return;
    }
    setDeleteOrderInFlight(true);
    setDeleteOrderError(null);
    try {
      await deleteOrder(orderModal.id);
      setOrders(prev => prev.filter((o: any) => o.id !== orderModal.id));
      closeAllModals();
    } catch (e: any) {
      setDeleteOrderError(e?.message || 'Lỗi không xác định khi xóa đơn.');
    } finally {
      setDeleteOrderInFlight(false);
    }
  }

  // Step 2: Products từ Supabase (fallback static)
  const { products: liveProducts, categories: liveCategories, source: productsSource, loading: productsLoading, error: productsError, refresh: refreshProducts } = useProducts();
  const [productSaving, setProductSaving] = useState(false);
  const [productDeleteConfirm, setProductDeleteConfirm] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<ProductInput>>({});
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');

  // Đồng bộ productForm khi productModal thay đổi
  React.useEffect(() => {
    if (productModal && productModal.id) {
      setProductForm({
        name: productModal.name,
        slug: productModal.slug,
        description: productModal.description,
        price: productModal.price,
        salePrice: productModal.salePrice,
        images: productModal.images ?? [],
        categoryId: productModal.categoryId,
      });
    } else {
      setProductForm({ name: '', slug: '', description: '', price: 0, salePrice: null, images: [], categoryId: liveCategories[0]?.id ?? '' });
    }
  }, [productModal, liveCategories]);

  async function handleSaveProduct() {
    if (!productForm.name || !productForm.slug || !productForm.price) {
      alert('Vui lòng nhập đầy đủ Tên, Slug và Giá bán');
      return;
    }
    setProductSaving(true);
    try {
      const input: ProductInput = {
        name: productForm.name!,
        slug: productForm.slug!,
        description: productForm.description ?? '',
        price: Number(productForm.price),
        salePrice: productForm.salePrice ? Number(productForm.salePrice) : null,
        stock: 0,
        images: productForm.images ?? [],
        categoryId: productForm.categoryId ?? '',
      };
      if (productModal?.id) {
        await updateProduct(productModal.id, input);
      } else {
        await createProduct(input);
      }
      await refreshProducts();
      closeAllModals();
    } catch (e) {
      alert('Lỗi khi lưu: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setProductSaving(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    try {
      await deleteProduct(id);
      await refreshProducts();
      setProductDeleteConfirm(null);
    } catch (e) {
      alert('Lỗi khi xoá: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  // Upload ảnh sản phẩm lên Supabase Storage (bucket "product-images")
  async function handleProductImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const client = getSupabase() as any;
    setProductImageUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'jpg';
        const safeSlug = (productForm.slug || 'san-pham').replace(/[^a-z0-9-]/g, '');
        const path = `${safeSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await client.storage.from('product-images').upload(path, file, { cacheControl: '3600' });
        if (error) throw error;
        const { data } = client.storage.from('product-images').getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }
      setProductForm(prev => ({ ...prev, images: [...(prev.images ?? []), ...uploadedUrls] }));
    } catch (err) {
      alert('Lỗi upload ảnh: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setProductImageUploading(false);
      e.target.value = '';
    }
  }

  function removeProductImage(index: number) {
    setProductForm(prev => ({ ...prev, images: (prev.images ?? []).filter((_, i) => i !== index) }));
  }

  const hasAnyModalOpen = !!orderModal || !!productModal || !!customerModal || !!revenueDrill;

  // ─── Map local status ↔ DB status ──────────────────────
  const LOCAL_TO_DB: Record<string, string> = {
    pending:   'pending',
    producing: 'in_progress',
    issue:     'error',
    qc:        'quality_check',
    shipping:  'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
  };
  const DB_TO_LOCAL: Record<string, string> = {
    pending:       'pending',
    confirmed:     'pending',    // confirmed → hiện trong cột pending
    in_progress:   'producing',
    error:         'issue',
    quality_check: 'qc',
    ready_to_ship: 'shipping',   // ready_to_ship → shipping
    shipped:       'shipping',
    delivered:     'delivered',
    cancelled:     'cancelled',
  };

  // ─── Supabase Realtime subscription + diagnostics ───────
  const channelRef = useRef<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rtStatus,   setRtStatus]   = useState<'idle'|'connecting'|'live'|'error'>('idle');
  const [dbOrderCount, setDbOrderCount] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function getClient() {
    try { return getSupabase() as any; } catch { return null; }
  }

  // Format địa chỉ guest (JSONB {street, ward, district, province}) thành 1 dòng
  function formatAddress(addr: any): string {
    if (!addr || typeof addr !== 'object') return '';
    const parts = [addr.street, addr.ward, addr.district, addr.province].filter(Boolean);
    return parts.join(', ');
  }

  // Chuyển 1 row Supabase → shape mà Kanban/modal đang dùng.
  // DÙNG CHUNG cho cả fetch ban đầu và realtime INSERT — tránh mismatch shape.
  // Return `any` vì INITIAL_ORDERS có nhiều biến thể (progress/machine/rating/...) TS
  // không suy ra được union chuẩn — dùng any khớp với style hiện có của file này.
  function mapDbOrder(o: any): any {
    const colorFor = (s: string) =>
      s === 'pending' ? 'gray' : s === 'producing' ? 'blue' : s === 'issue' ? 'purple' :
      s === 'qc' ? 'green' : s === 'shipping' ? 'amber' : s === 'delivered' ? 'emerald' :
      s === 'cancelled' ? 'red' : 'gray';
    const localStatus = DB_TO_LOCAL[o.status] ?? o.status;
    return {
      id:            o.id,
      order_number:  o.order_number,
      status:        localStatus,
      color:         colorFor(localStatus),
      name:          o.guest_name ?? 'Khách hàng',
      phone:         o.guest_phone ?? '',
      email:         o.guest_email ?? '',
      address:       formatAddress(o.guest_address),
      addressRaw:    o.guest_address ?? null,
      price:         (o.total_amount ?? 0).toLocaleString('vi-VN') + 'đ',
      paymentMethod: (o.payment_method ?? 'cod').toUpperCase(),
      time:          o.created_at ? new Date(o.created_at).toLocaleString('vi-VN') : 'Vừa xong',
      items:         o.note || 'Đơn hàng',
      avatar:        (o.guest_name ?? 'KH').substring(0, 2).toUpperCase(),
      assignee:      null,
      createdAt:     o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    };
  }

  // Extract fetch logic vào 1 hàm để cả useEffect và nút "Làm mới" dùng được
  async function fetchOrders() {
    const supabase = getClient();
    if (!supabase) {
      setFetchError('Supabase chưa được cấu hình (thiếu NEXT_PUBLIC_SUPABASE_URL)');
      return;
    }
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, guest_name, guest_phone, guest_email, guest_address, payment_method, note')
        .not('status', 'in', '(delivered,cancelled)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[admin fetchOrders] Supabase error:', error);
        setFetchError(`${error.code ?? 'ERR'}: ${error.message}`);
        setDbOrderCount(0);
        return;
      }
      setFetchError(null);
      setDbOrderCount(data?.length ?? 0);
      const mapped = (data ?? []).map((o: any) => mapDbOrder(o));
      setOrders(mapped);
    } catch (e) {
      console.error('[admin fetchOrders] exception:', e);
      setFetchError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) return;

    fetchOrders();

    // 2. Subscribe realtime (log status để biết realtime có kết nối được không)
    setRtStatus('connecting');
    const channel = supabase.channel('admin-kanban')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: any) => {
        const mapped = mapDbOrder(payload.new);
        setOrders(prev => [{ ...mapped, time: 'Vừa xong' }, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload: any) => {
        // Realtime UPDATE payload không chắc có đầy đủ field (một số config chỉ trả PK + changed cols).
        // Re-fetch full row cho chắc — hoặc nếu không, merge status thôi.
        const mapped = mapDbOrder(payload.new);
        setOrders(prev => prev.map(existing =>
          existing.id === mapped.id ? { ...existing, ...mapped } : existing
        ));
      })
      .subscribe((status: string, err?: Error) => {
        // Cập nhật rtStatus để hiện visible trên UI
        console.log('[admin realtime] status:', status, err ?? '');
        if (status === 'SUBSCRIBED')          setRtStatus('live');
        else if (status === 'CHANNEL_ERROR')  setRtStatus('error');
        else if (status === 'TIMED_OUT')      setRtStatus('error');
        else if (status === 'CLOSED')         setRtStatus('idle');
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Computed stats từ orders thật ──────────────────────
  const pendingOrders   = orders.filter(o => o.status === 'pending');
  const producingOrders = orders.filter(o => o.status === 'producing');
  const issueOrders     = orders.filter(o => o.status === 'issue');
  const qcOrders        = orders.filter(o => o.status === 'qc');
  const shippingOrders  = orders.filter(o => o.status === 'shipping');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  // Parse giá từ string '700.000đ' → number 700000
  function parsePrice(p: string): number {
    return parseInt(p.replace(/[^\d]/g, ''), 10) || 0;
  }

  // Doanh thu computed — tính realtime từ orders state (ALL-TIME, dùng cho Section B, summary)
  const revenueDelivered = deliveredOrders.reduce((s, o) => s + parsePrice(o.price), 0);
  const revenueAll = orders.reduce((s, o) => s + parsePrice(o.price), 0);
  const revenueActive = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).reduce((s, o) => s + parsePrice(o.price), 0);
  const revenuePending = pendingOrders.reduce((s, o) => s + parsePrice(o.price), 0);

  // ─── Period filter cho Section A Revenue Cards ──────────
  const filterByPeriod = (list: typeof orders) => {
    if (revenuePeriod === 'all') return list;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    if (revenuePeriod === 'today') return list.filter(o => (o.createdAt || '') === todayStr);
    if (revenuePeriod === '7days') {
      const d7 = new Date(now); d7.setDate(d7.getDate() - 6); // 7 ngày rolling (hôm nay + 6 ngày trước)
      const d7Str = d7.toISOString().slice(0, 10);
      return list.filter(o => (o.createdAt || '') >= d7Str);
    }
    // 'month' — tháng này
    const monthPrefix = todayStr.slice(0, 7); // 'YYYY-MM'
    return list.filter(o => (o.createdAt || '').startsWith(monthPrefix));
  };
  const PERIOD_LABELS: Record<string, string> = { today: 'Hôm nay', '7days': '7 ngày', month: 'Tháng này', all: 'Tất cả' };

  // Period-filtered orders (cho Section A revenue cards + drill-down)
  const pOrders = filterByPeriod(orders);
  const pDelivered = pOrders.filter(o => o.status === 'delivered');
  const pCancelled = pOrders.filter(o => o.status === 'cancelled');
  const pActive = pOrders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const pRevenueDelivered = pDelivered.reduce((s, o) => s + parsePrice(o.price), 0);
  const pRevenueAll = pOrders.reduce((s, o) => s + parsePrice(o.price), 0);
  const pRevenueActive = pActive.reduce((s, o) => s + parsePrice(o.price), 0);

  // --- DND KIT LOGIC ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Tránh nhầm lẫn giữa click và drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Order';
    const isOverTask = over.data.current?.type === 'Order';
    const isOverColumn = over.data.current?.type === 'Column' || COLUMNS.some(col => col.id === overId);

    if (!isActiveTask) return;

    // Map status → màu badge card
    const colorFor = (s: string) =>
      s === 'pending' ? 'gray' :
      s === 'producing' ? 'blue' :
      s === 'issue' ? 'purple' :
      s === 'qc' ? 'green' :
      s === 'shipping' ? 'amber' :
      s === 'delivered' ? 'emerald' :
      s === 'cancelled' ? 'red' : 'gray';

    // Kéo thả giữa các Order (cùng cột hoặc khác cột)
    if (isActiveTask && isOverTask) {
      setOrders(orders => {
        const activeIndex = orders.findIndex(t => t.id === activeId);
        const overIndex = orders.findIndex(t => t.id === overId);

        if (orders[activeIndex].status !== orders[overIndex].status) {
          // Khác cột -> Chuyển cột và cập nhật status (cập nhật màu sắc Kanban)
          const updatedOrders = [...orders];
          const newStatus = orders[overIndex].status;
          updatedOrders[activeIndex] = {
            ...updatedOrders[activeIndex],
            status: newStatus,
            color: colorFor(newStatus),
          };
          return arrayMove(updatedOrders, activeIndex, overIndex);
        }
        // Cùng cột -> Chỉ sắp xếp lại
        return arrayMove(orders, activeIndex, overIndex);
      });
    }

    // Kéo thả vào Cột trống (isOverColumn: khi hover DroppableColumn hoặc empty SortableContext)
    if (isActiveTask && isOverColumn) {
      setOrders(orders => {
        const activeIndex = orders.findIndex(t => t.id === activeId);
        if (activeIndex === -1) return orders;
        const newStatus = overId as string;
        if (orders[activeIndex].status === newStatus) return orders;
        const updatedOrders = [...orders];
        updatedOrders[activeIndex] = {
          ...updatedOrders[activeIndex],
          status: newStatus,
          color: colorFor(newStatus),
        };
        return arrayMove(updatedOrders, activeIndex, updatedOrders.length - 1);
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active } = event;
    if (!active) return;

    // Lấy status hiện tại của order sau khi handleDragOver đã cập nhật
    const order = orders.find(o => o.id === active.id);
    if (!order) return;

    const dbStatus = LOCAL_TO_DB[order.status];
    if (!dbStatus) return;

    // Kiểm tra ID có phải UUID không (mock data dùng MM-XXXX)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);
    if (!isUuid) return; // Skip mock data

    const supabase = getClient();
    if (!supabase) return;

    try {
      // Cập nhật DB
      await supabase.from('orders').update({ status: dbStatus }).eq('id', order.id);
      // Ghi log order_history
      await supabase.from('order_history').insert({
        order_id: order.id,
        to_status: dbStatus,
        note: `Chuyển cột Kanban → ${dbStatus}`,
      });
    } catch {
      // Nếu lỗi → thông báo nhẹ (không revert UI để không giật)
      console.error('Realtime update failed for order', order.id);
    }
  };

  const getActiveOrder = () => {
    return orders.find(o => o.id === activeId);
  };


  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col z-20 shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center rounded-lg font-bold">S</div>
          <img src="/logo.svg" alt="Sợi chỉ" className="h-6 w-auto" />
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'overview' ? 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-500 -ml-0.5 pl-[10px]' : 'font-medium text-gray-600 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'orders' ? 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-500 -ml-0.5 pl-[10px]' : 'font-medium text-gray-600 hover:bg-gray-100'}`}
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              Đơn hàng
            </span>
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{pendingOrders.length + producingOrders.length + issueOrders.length + qcOrders.length + shippingOrders.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'products' ? 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-500 -ml-0.5 pl-[10px]' : 'font-medium text-gray-600 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            Kho & Sản phẩm
          </button>

          <div className="pt-4 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Khách hàng &amp; Doanh thu</div>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'customers' ? 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-500 -ml-0.5 pl-[10px]' : 'font-medium text-gray-600 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Khách hàng
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'history' ? 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-500 -ml-0.5 pl-[10px]' : 'font-medium text-gray-600 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Lịch sử đơn
          </button>
          {(CURRENT_ROLE === 'owner' || CURRENT_ROLE === 'accountant') && (
            <button
              onClick={() => setActiveTab('accounting')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'accounting' ? 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-500 -ml-0.5 pl-[10px]' : 'font-medium text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              Kế toán
            </button>
          )}

          {CURRENT_ROLE === 'owner' && (
            <>
              <div className="pt-4 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Hệ thống</div>
              <button
                onClick={() => setActiveTab('roles')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'roles' ? 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-500 -ml-0.5 pl-[10px]' : 'font-medium text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Phân quyền
              </button>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Về trang Shop
          </Link>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0">V</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">Trần Bảo Vinh</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ROLE_META[CURRENT_ROLE].badgeClass}`}>{ROLE_META[CURRENT_ROLE].icon} {ROLE_META[CURRENT_ROLE].label}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {activeTab === 'overview' && 'Chào buổi sáng, xưởng Sợi chỉ 🌿'}
              {activeTab === 'orders' && 'Quản lý Đơn hàng'}
              {activeTab === 'products' && 'Kho & Sản phẩm'}
              {activeTab === 'customers' && 'Khách hàng & Hành vi'}
              {activeTab === 'history' && 'Lịch sử Đơn hàng'}
              {activeTab === 'accounting' && 'Kế toán & Tài chính'}
              {activeTab === 'roles' && 'Phân quyền & Thành viên'}
            </h2>
            {activeTab === 'overview' && <p className="text-xs text-gray-500 mt-0.5">Hôm nay Thứ Sáu, 28/08/2026 · Dữ liệu cập nhật lúc 09:42</p>}
            {activeTab === 'accounting' && <p className="text-xs text-gray-500 mt-0.5">Kỳ báo cáo: Tháng 8/2026 · Chốt sổ ngày 31/08</p>}
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'overview' && (
              <>
                <button className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Xuất báo cáo
                </button>
                <button onClick={() => setActiveTab('accounting')} className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-emerald-600 flex items-center gap-1.5">
                  Xem Kế toán
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </>
            )}
            {activeTab === 'accounting' && (
              <>
                <button className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-4 0h4m-4 0H8m8 0h1a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2h1"/></svg>
                  Xuất PDF
                </button>
                <button className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  Xuất Excel
                </button>
                <button className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-emerald-600">Đối soát cuối tháng</button>
              </>
            )}
            {activeTab === 'roles' && (
              <button className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-emerald-600 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                Mời thành viên
              </button>
            )}
            {activeTab === 'orders' && (
              <div className="flex items-center gap-2">
                {/* Realtime status pill */}
                <span
                  className={
                    'text-[11px] font-medium px-2 py-1 rounded ' +
                    (rtStatus === 'live'       ? 'bg-emerald-100 text-emerald-700' :
                     rtStatus === 'error'      ? 'bg-red-100 text-red-700' :
                     rtStatus === 'connecting' ? 'bg-amber-100 text-amber-700' :
                                                 'bg-gray-100 text-gray-600')
                  }
                  title={`Realtime: ${rtStatus}${dbOrderCount !== null ? ` · DB có ${dbOrderCount} đơn active` : ''}`}
                >
                  ● {rtStatus === 'live' ? 'Realtime OK' : rtStatus === 'error' ? 'Realtime lỗi' : rtStatus === 'connecting' ? 'Đang kết nối…' : 'Chưa kết nối'}
                </span>
                <button
                  onClick={fetchOrders}
                  disabled={refreshing}
                  className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  title="Fetch lại danh sách đơn từ Supabase"
                >
                  {refreshing ? 'Đang tải…' : '↻ Làm mới'}
                </button>
                <button className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-800">Tạo đơn thủ công</button>
              </div>
            )}
            {activeTab === 'products' && <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700" onClick={() => setProductModal({})}>+ Thêm sản phẩm</button>}
            {activeTab === 'customers' && <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-50 flex items-center gap-2">Xuất CSV</button>}
            {activeTab === 'history' && (
              <>
                <button onClick={() => setShowArchiveInfo(!showArchiveInfo)} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Chính sách lưu trữ
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Xuất Excel
                </button>
              </>
            )}
          </div>
        </header>

        {/* CONTENT PANELS */}
        <div className="flex-1 overflow-hidden relative">

          {/* ============================ OVERVIEW ============================ */}
          {activeTab === 'overview' && (() => {
            // Doanh thu computed realtime từ orders state
            const totalOrders = orders.length;
            const activeOrderCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
            const pEstimatedProfit = Math.round(pRevenueDelivered * PROFIT_MARGIN);
            const chartData = revenueRange === '7' ? DAILY_REVENUE.slice(-7) : DAILY_REVENUE;
            const chartMax = Math.max(...chartData.map(d => d.revenue));

            return (
              <div className="h-full overflow-y-auto p-6 bg-gray-50 space-y-6">

                {/* Section A: Doanh thu & Lợi nhuận — COMPUTED FROM ORDERS */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">💰 Doanh thu &amp; Lợi nhuận <span className="text-[10px] font-normal text-emerald-600">(realtime từ đơn hàng)</span></h3>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                      {(['today', '7days', 'month', 'all'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setRevenuePeriod(p)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${revenuePeriod === p ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                          {PERIOD_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div onClick={() => setRevenueDrill('delivered')} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Đã thu (hoàn thành)</h4>
                        <svg className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">{formatVnd(pRevenueDelivered)}</p>
                      <p className="text-xs text-gray-400 mt-1">{pDelivered.length} đơn đã giao · <span className="text-emerald-600 font-medium group-hover:underline">Xem chi tiết →</span></p>
                    </div>

                    <div onClick={() => setRevenueDrill('active')} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Đang xử lý</h4>
                        <svg className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{formatVnd(pRevenueActive)}</p>
                      <p className="text-xs text-gray-400 mt-1">{pActive.length} đơn đang xử lý · <span className="text-blue-600 font-medium group-hover:underline">Xem chi tiết →</span></p>
                    </div>

                    <div onClick={() => setRevenueDrill('all')} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-gray-400 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tổng doanh thu</h4>
                        <svg className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{formatVnd(pRevenueAll)}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                          <span>{pOrders.length} đơn{revenuePeriod !== 'all' ? ` (${PERIOD_LABELS[revenuePeriod]})` : ' tổng cộng'} · <span className="text-gray-600 font-medium group-hover:underline">Xem chi tiết →</span></span>
                          <span className="font-bold text-gray-700">{pCancelled.length > 0 ? `${pCancelled.length} hủy` : 'Chưa có hủy'}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pOrders.length > 0 ? Math.round(pDelivered.length / pOrders.length * 100) : 0}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div onClick={() => setRevenueDrill('profit')} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lợi nhuận ước tính</h4>
                        <svg className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{formatVnd(pEstimatedProfit)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">Biên ~48%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Từ {pDelivered.length} đơn hoàn thành · <span className="text-emerald-600 font-medium group-hover:underline">Xem chi tiết →</span></p>
                    </div>
                  </div>
                </section>

                {/* Section B: Vận hành hôm nay */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">⚙️ Vận hành hôm nay</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Đơn đang xử lý</h4>
                      <p className="text-2xl font-bold text-gray-900">{pendingOrders.length + producingOrders.length + issueOrders.length + qcOrders.length + shippingOrders.length} đơn</p>
                      <div className="mt-3 space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between"><span>Chờ xử lý</span><span className="font-bold">{pendingOrders.length}</span></div>
                        <div className="flex justify-between"><span>Đang sản xuất</span><span className="font-bold text-blue-600">{producingOrders.length}</span></div>
                        <div className="flex justify-between"><span>Tạm dừng</span><span className="font-bold text-purple-600">{issueOrders.length}</span></div>
                        <div className="flex justify-between"><span>Kiểm tra QC</span><span className="font-bold text-green-600">{qcOrders.length}</span></div>
                        <div className="flex justify-between"><span>Đang giao</span><span className="font-bold text-amber-600">{shippingOrders.length}</span></div>
                      </div>
                      <button onClick={() => setActiveTab('orders')} className="mt-3 text-xs text-emerald-600 font-bold hover:underline">Xem Kanban →</button>
                    </div>

                    <div className={`p-5 rounded-xl border shadow-sm ${issueOrders.length > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <h4 className={`text-xs font-medium mb-1 ${issueOrders.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{issueOrders.length > 0 ? '⚠ Cần chú ý' : '✅ Vận hành ổn'}</h4>
                      <p className={`text-2xl font-bold ${issueOrders.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{issueOrders.length} đơn tạm dừng</p>
                      {issueOrders.length > 0 ? (
                        <>
                          {issueOrders.slice(0, 2).map(o => (
                            <div key={o.id} className="mt-1">
                              <p className="text-xs text-red-600">{o.id} · {o.name}</p>
                            </div>
                          ))}
                          <button onClick={() => setActiveTab('orders')} className="mt-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-md w-full">Xử lý ngay →</button>
                        </>
                      ) : (
                        <p className="text-xs text-emerald-600 mt-2">Không có đơn nào bị tạm dừng 🎉</p>
                      )}
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Hoàn thành</h4>
                      <p className="text-2xl font-bold text-emerald-600">{deliveredOrders.length} đơn</p>
                      <div className="mt-3 space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between"><span>Đã giao</span><span className="font-bold">{deliveredOrders.length}</span></div>
                        <div className="flex justify-between"><span>Đã hủy</span><span className="font-bold text-red-500">{cancelledOrders.length}</span></div>
                      </div>
                      <p className="text-xs text-emerald-600 font-bold mt-2">+ {formatVnd(revenueDelivered)} ghi nhận</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Đúng hạn 30 ngày</h4>
                      <p className="text-2xl font-bold text-gray-900">92%</p>
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">46/50 đơn · Mục tiêu 95%</p>
                      <p className="text-xs font-bold text-emerald-600 mt-1">▲ +4pp vs tháng trước</p>
                    </div>
                  </div>
                </section>

                {/* Section C: Biểu đồ doanh thu */}
                <section>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">📈 Biểu đồ doanh thu</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Trung bình {formatVnd(Math.round(chartData.reduce((s, d) => s + d.revenue, 0) / chartData.length))}/ngày</p>
                        </div>
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                          <button onClick={() => setRevenueRange('7')} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${revenueRange === '7' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>7 ngày</button>
                          <button onClick={() => setRevenueRange('30')} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${revenueRange === '30' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>30 ngày</button>
                        </div>
                      </div>
                      {/* Pure CSS/SVG bar chart */}
                      <div className="flex items-end gap-1 h-40 mt-4">
                        {chartData.map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center group relative">
                            <div className="w-full flex flex-col items-center justify-end h-full">
                              <div
                                className="w-full bg-emerald-500 rounded-t-sm hover:bg-emerald-600 transition-colors cursor-pointer relative"
                                style={{ height: `${(d.revenue / chartMax) * 100}%` }}
                                title={`${d.date}: ${formatVnd(d.revenue)} (${d.orders} đơn)`}
                              >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                                  {formatCompact(d.revenue)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
                        {chartData.filter((_, i) => i % Math.ceil(chartData.length / 7) === 0).map(d => (
                          <span key={d.date}>{d.date}</span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="text-sm font-bold text-gray-800 mb-4">📊 Tóm tắt 30 ngày</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-gray-500">Tổng doanh thu</span>
                            <span className="text-xs font-bold text-emerald-600">+8% ▲</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{formatVnd(revenueAll)}</p>
                        </div>
                        <div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-gray-500">Số đơn hoàn tất</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{deliveredOrders.length} đơn</p>
                        </div>
                        <div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-gray-500">AOV (giá trị TB)</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{formatVnd(totalOrders > 0 ? Math.round(revenueAll / totalOrders) : 0)}</p>
                        </div>
                        <div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-gray-500">Khách mới</span>
                            <span className="text-xs font-bold text-emerald-600">+22% ▲</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">34 người</p>
                        </div>
                        <button onClick={() => setActiveTab('history')} className="w-full text-xs text-emerald-600 font-bold hover:underline pt-2 border-t border-gray-100">Xem Lịch sử chi tiết →</button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section D: Top 3 bestsellers */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">🔥 Top 3 sản phẩm bán chạy tuần này</h3>
                    <button onClick={() => setActiveTab('products')} className="text-xs text-emerald-600 font-bold hover:underline">Xem tất cả →</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {BESTSELLERS.map(b => (
                      <div key={b.rank} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-3">
                        <div className={`w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl font-bold ${b.rank === 1 ? 'bg-yellow-100 text-yellow-700' : b.rank === 2 ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'}`}>
                          #{b.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{b.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{b.orders} đơn · {formatVnd(b.revenue)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                              {b.trend === 'up' ? '▲' : '▼'} {Math.abs(b.deltaPct)}%
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.stock < 10 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                              Còn {b.stock} {b.stockUnit}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section E: Alerts + Quick actions */}
                <section>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                      <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Cảnh báo cần chú ý ({OVERVIEW_ALERTS.length})
                      </h4>
                      <div className="space-y-2">
                        {OVERVIEW_ALERTS.map((a, i) => (
                          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${a.level === 'danger' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                            <span className="text-lg">{a.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-800">{a.msg}</p>
                              <button onClick={() => setActiveTab(a.link as AdminTab)} className={`text-xs font-bold mt-1 hover:underline ${a.level === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>{a.cta} →</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                      <h4 className="text-sm font-bold text-gray-800 mb-4">🚀 Truy cập nhanh</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setActiveTab('orders')} className="p-4 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-lg text-left transition-all group">
                          <svg className="w-6 h-6 text-gray-600 group-hover:text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                          <p className="text-sm font-bold text-gray-900">Kanban đơn hàng</p>
                          <p className="text-xs text-gray-500 mt-0.5">Kéo thả trạng thái đơn</p>
                        </button>
                        <button onClick={() => setActiveTab('customers')} className="p-4 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-lg text-left transition-all group">
                          <svg className="w-6 h-6 text-gray-600 group-hover:text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                          <p className="text-sm font-bold text-gray-900">Khách VIP</p>
                          <p className="text-xs text-gray-500 mt-0.5">108 KH · 187.5tr đóng góp</p>
                        </button>
                        <button onClick={() => setActiveTab('products')} className="p-4 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-lg text-left transition-all group">
                          <svg className="w-6 h-6 text-gray-600 group-hover:text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                          <p className="text-sm font-bold text-gray-900">Kho &amp; Bestsellers</p>
                          <p className="text-xs text-gray-500 mt-0.5">24 SKU · 3 cảnh báo</p>
                        </button>
                        <button onClick={() => setActiveTab('accounting')} className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-left transition-all group">
                          <svg className="w-6 h-6 text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                          <p className="text-sm font-bold text-emerald-700">Sổ sách kế toán</p>
                          <p className="text-xs text-emerald-600 mt-0.5">P&amp;L · Cash flow · Công nợ</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            );
          })()}

          {/* ORDERS KANBAN */}
          {activeTab === 'orders' && (
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCorners} 
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex flex-col h-full bg-gray-50">
                {/* Error banner khi fetch lỗi — làm nổi bật để không âm thầm show Kanban trống */}
                {fetchError && (
                  <div className="bg-red-50 border-b-2 border-red-200 px-6 py-3 text-sm text-red-800 shrink-0 flex items-start gap-3">
                    <span className="text-lg leading-none">⚠️</span>
                    <div className="flex-1">
                      <div className="font-bold">Không đọc được đơn hàng từ Supabase</div>
                      <div className="text-xs mt-0.5 font-mono">{fetchError}</div>
                      <div className="text-xs mt-1 text-red-700">
                        Nếu mã lỗi là <code className="bg-red-100 px-1 rounded">42501</code> hoặc chứa "row-level security":
                        tài khoản đang đăng nhập có thể chưa được set <code className="bg-red-100 px-1 rounded">role=&apos;admin&apos;</code> trong bảng <code className="bg-red-100 px-1 rounded">profiles</code>.
                        Vào Supabase → SQL Editor chạy:
                        <code className="block bg-red-100 mt-1 p-1.5 rounded text-[11px]">update public.profiles set role=&apos;admin&apos; where id = auth.uid();</code>
                        (thay <code>auth.uid()</code> bằng UUID user thật lấy từ tab Authentication).
                      </div>
                    </div>
                    <button onClick={() => setFetchError(null)} className="text-red-500 hover:text-red-700 text-lg leading-none">×</button>
                  </div>
                )}
                {/* Info banner khi DB có 0 đơn (không phải lỗi, chỉ báo cho biết) */}
                {!fetchError && dbOrderCount === 0 && (
                  <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 text-xs text-blue-700 shrink-0">
                    ℹ️ Supabase kết nối OK, nhưng chưa có đơn nào đang active (đã lọc bỏ delivered/cancelled). Đơn mới sẽ tự hiện qua realtime.
                  </div>
                )}

                {/* Summary bar */}
                <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-4 text-xs overflow-x-auto shrink-0">
                  {COLUMNS.map(col => {
                    const cnt = orders.filter(o => o.status === col.id).length;
                    const val = orders.filter(o => o.status === col.id).reduce((s, o) => s + parseInt(o.price.replace(/[^\d]/g, '')), 0);
                    return (
                      <div key={col.id} className="flex items-center gap-1.5 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${col.colorClass}`}></span>
                        <span className="text-gray-500">{col.title}:</span>
                        <span className="font-bold text-gray-900">{cnt}</span>
                        {cnt > 0 && <span className="text-gray-400 font-mono">({(val / 1000).toFixed(0)}k)</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 overflow-x-auto p-4 flex-1 items-start">
                  {COLUMNS.map(col => {
                    const columnOrders = orders.filter(o => o.status === col.id);
                    const colValue = columnOrders.reduce((s, o) => s + parseInt(o.price.replace(/[^\d]/g, '')), 0);
                    return (
                      <div key={col.id} className={`min-w-[260px] w-[260px] rounded-xl flex flex-col max-h-full shrink-0 ${col.containerClass} border border-gray-200/50`}>
                        <div className={`p-3 font-semibold ${col.borderTop ? col.borderTop + ' rounded-t-xl' : 'text-gray-700 border-b border-black/5'} shrink-0`}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{col.icon}</span>
                              <span className={`text-sm ${col.titleColor || ''}`}>{col.title}</span>
                            </div>
                            <span className={`text-[10px] py-0.5 px-1.5 rounded-full font-bold ${col.badgeClass}`}>{columnOrders.length}</span>
                          </div>
                          {colValue > 0 && (
                            <p className="text-[10px] text-gray-500 mt-1 font-mono">Tổng: {colValue.toLocaleString('vi-VN')}đ</p>
                          )}
                        </div>

                        <DroppableColumn id={col.id} className="p-2.5 flex-1 overflow-y-auto flex flex-col gap-2.5 min-h-[200px]">
                          <SortableContext
                            id={col.id}
                            items={columnOrders.map(o => o.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {columnOrders.map(order => (
                              <SortableOrderCard key={order.id} order={order} onClick={() => setOrderModal({ ...order, uiStatus: col.title })} />
                            ))}
                            {columnOrders.length === 0 && (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[160px] pointer-events-none">
                                <span className="text-2xl opacity-40 mb-1">{col.icon}</span>
                                <p className="text-xs text-gray-400">Kéo thả vào đây</p>
                              </div>
                            )}
                          </SortableContext>
                        </DroppableColumn>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hộp hiệu ứng kéo thả mượt mà */}
              <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
              }}>
                {activeId ? <SortableOrderCard order={getActiveOrder()} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          )}

          {/* PRODUCTS VIEW */}
          {activeTab === 'products' && (
            <div className="h-full overflow-y-auto p-6 bg-gray-50 space-y-6">

              {/* Quick metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Doanh thu SP tháng</h3>
                  <p className="text-2xl font-bold text-emerald-600">{formatVnd(PRODUCT_STATS.reduce((s, p) => s + p.revenue, 0))}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">SKU đang bán</h3>
                  <p className="text-2xl font-bold text-gray-900">{PRODUCT_STATS.length}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Margin trung bình</h3>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(PRODUCT_STATS.reduce((s, p) => s + p.marginPct, 0) / PRODUCT_STATS.length)}%</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Cảnh báo kho</h3>
                  <div className="flex items-center gap-2"><p className="text-2xl font-bold text-red-600">{STOCK_ALERTS.length}</p><span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Sắp hết</span></div>
                </div>
              </div>

              {/* Bestsellers Table (enhanced) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">🏆 Top sản phẩm bán chạy 30 ngày</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Sắp xếp theo doanh thu</p>
                  </div>
                  <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-md">+ Chạy khuyến mãi</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="text-left p-3 font-bold">#</th>
                        <th className="text-left p-3 font-bold">Sản phẩm</th>
                        <th className="text-right p-3 font-bold">Đơn</th>
                        <th className="text-right p-3 font-bold">Doanh thu</th>
                        <th className="text-right p-3 font-bold">Margin</th>
                        <th className="text-right p-3 font-bold">Hủy</th>
                        <th className="text-right p-3 font-bold">Xu hướng</th>
                        <th className="text-center p-3 font-bold">Tồn kho</th>
                        <th className="text-center p-3 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {PRODUCT_STATS.map((p, i) => (
                        <tr key={p.sku} className="hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-500">{i + 1}</td>
                          <td className="p-3">
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{p.sku}</p>
                          </td>
                          <td className="p-3 text-right font-bold">{p.orders}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">{formatVnd(p.revenue)}</td>
                          <td className="p-3 text-right"><span className={`text-xs font-bold px-2 py-0.5 rounded ${p.marginPct >= 60 ? 'bg-emerald-50 text-emerald-700' : p.marginPct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{p.marginPct}%</span></td>
                          <td className="p-3 text-right text-xs text-gray-500">{p.cancelRate}%</td>
                          <td className="p-3 text-right"><span className={`text-xs font-bold ${p.trendPct > 0 ? 'text-emerald-600' : p.trendPct < 0 ? 'text-red-600' : 'text-gray-500'}`}>{p.trendPct > 0 ? '▲' : p.trendPct < 0 ? '▼' : '→'} {Math.abs(p.trendPct)}%</span></td>
                          <td className="p-3 text-center">
                            {p.stock <= p.threshold ? <span className="text-xs font-bold text-red-600">⚠ {p.stock}</span> : <span className="text-xs font-bold text-emerald-600">{p.stock}</span>}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex gap-1 justify-center">
                              <button className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded hover:bg-emerald-200">Push</button>
                              <button className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-1 rounded hover:bg-red-200">Sale</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stock alerts */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">⚠ Cảnh báo tồn kho ({STOCK_ALERTS.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {STOCK_ALERTS.map((a, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${a.severity === 'danger' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-sm font-bold ${a.severity === 'danger' ? 'text-red-800' : 'text-amber-800'}`}>{a.name}</h4>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${a.severity === 'danger' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>{a.severity === 'danger' ? 'Nguy cấp' : 'Cảnh báo'}</span>
                      </div>
                      <p className={`text-lg font-bold ${a.severity === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>Còn {a.current} {a.unit}</p>
                      <p className={`text-xs mt-1 ${a.severity === 'danger' ? 'text-red-600' : 'text-amber-600'}`}>Ngưỡng: {a.threshold} {a.unit}</p>
                      <p className={`text-xs mt-2 italic ${a.severity === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>{a.note}</p>
                      <button className={`mt-3 w-full text-xs font-bold py-1.5 rounded-md ${a.severity === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>Đặt bổ sung →</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== SUPABASE LIVE PRODUCTS (Step 2) ===== */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">📦 Sản phẩm ({liveProducts.length})</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {productsSource === 'live' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Supabase LIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                          ⚠ Static fallback
                        </span>
                      )}
                      {productsLoading && <span className="text-[10px] text-gray-500">Đang tải...</span>}
                      {productsError && <span className="text-[10px] text-red-500" title={productsError}>Supabase offline — dùng data.ts</span>}
                      <button onClick={refreshProducts} className="text-[10px] text-blue-600 font-bold hover:underline">↻ Refresh</button>
                    </div>
                  </div>
                </div>

                {/* Thanh tìm kiếm + lọc danh mục */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Tìm sản phẩm theo tên..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">Tất cả danh mục</option>
                    {liveCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {(() => {
                  const filteredProducts = liveProducts.filter(p =>
                    (!productCategoryFilter || p.categoryId === productCategoryFilter) &&
                    (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                  );
                  if (filteredProducts.length === 0) {
                    return (
                      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        <p className="text-sm font-medium">Không tìm thấy sản phẩm nào</p>
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredProducts.map(prod => {
                        const discount = prod.salePrice ? Math.round((1 - prod.salePrice / prod.price) * 100) : 0;
                        return (
                          <div key={prod.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden group hover:shadow-md hover:border-emerald-200 transition-all">
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                              {prod.images[0] ? (
                                <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                              )}
                              {discount > 0 && (
                                <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{discount}%</span>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                <button onClick={() => setProductModal(prod)} className="bg-white text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full shadow hover:bg-blue-50">Sửa</button>
                                <button onClick={() => setProductDeleteConfirm(prod.id)} className="bg-white text-red-700 text-xs font-bold px-3 py-1.5 rounded-full shadow hover:bg-red-50">Xoá</button>
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide truncate">{prod.category.name}</p>
                              <p className="font-bold text-gray-900 text-sm truncate mt-0.5" title={prod.name}>{prod.name}</p>
                              <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
                                <span className="font-bold text-emerald-700 text-sm">{formatVnd(prod.salePrice ?? prod.price)}</span>
                                {prod.salePrice && (
                                  <span className="text-[10px] text-gray-400 line-through">{formatVnd(prod.price)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Delete confirm modal */}
                {productDeleteConfirm && (
                  <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setProductDeleteConfirm(null)}>
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                      <h3 className="text-lg font-bold mb-2">Xoá sản phẩm?</h3>
                      <p className="text-sm text-gray-600 mb-4">Sản phẩm sẽ bị ẩn khỏi shop (soft delete). Có thể khôi phục sau.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setProductDeleteConfirm(null)} className="flex-1 py-2 border border-gray-300 rounded-lg font-bold text-sm">Huỷ</button>
                        <button onClick={() => handleDeleteProduct(productDeleteConfirm)} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm">Xoá</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CUSTOMERS VIEW */}
          {activeTab === 'customers' && (
            <div className="h-full overflow-y-auto p-6 bg-gray-50 space-y-6">

              {/* RFM Segmentation */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">🎯 Phân khúc khách hàng (RFM)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CUSTOMER_SEGMENTS.map(seg => {
                    const bgMap: Record<string, string> = { brand: 'bg-emerald-50 border-emerald-200 text-emerald-700', blue: 'bg-blue-50 border-blue-200 text-blue-700', amber: 'bg-amber-50 border-amber-200 text-amber-700', red: 'bg-red-50 border-red-200 text-red-700' };
                    const cls = bgMap[seg.color];
                    return (
                      <div key={seg.key} className={`p-5 rounded-xl border ${cls}`}>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold">{seg.label}</h4>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white/60">{seg.pct}%</span>
                        </div>
                        <p className="text-3xl font-bold mt-1">{seg.count}</p>
                        <p className="text-xs opacity-80 mt-1">{seg.desc}</p>
                        <div className="mt-3 pt-3 border-t border-current/20">
                          <p className="text-[10px] uppercase font-bold opacity-70">Đóng góp DT</p>
                          <p className="text-sm font-bold">{formatCompact(seg.revenueContribution)} · LTV {formatCompact(seg.avgLtv)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 3 KPI cards */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-medium text-gray-500 uppercase">LTV trung bình</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatVnd(1850000)}</p>
                  <p className="text-xs text-emerald-600 font-bold mt-1">▲ +12% so với Q2</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-medium text-gray-500 uppercase">Tỷ lệ mua lại</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-1">38%</p>
                  <p className="text-xs text-emerald-600 font-bold mt-1">▲ +4pp vs tháng trước</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-medium text-gray-500 uppercase">AOV (giá trị/đơn)</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatVnd(820000)}</p>
                  <p className="text-xs text-red-600 font-bold mt-1">▼ -3% cần chú ý</p>
                </div>
              </section>

              {/* Top VIP + Acquisition */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-800">👑 Top 5 khách hàng VIP</h4>
                    <button className="text-xs text-emerald-600 font-bold hover:underline">Gửi voucher VIP →</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="text-left p-3 font-bold">#</th>
                          <th className="text-left p-3 font-bold">Khách hàng</th>
                          <th className="text-right p-3 font-bold">Số đơn</th>
                          <th className="text-right p-3 font-bold">Chi tiêu</th>
                          <th className="text-right p-3 font-bold">Đơn gần nhất</th>
                          <th className="text-left p-3 font-bold">Thích</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {TOP_VIP_CUSTOMERS.map(c => (
                          <tr key={c.rank} className="hover:bg-gray-50">
                            <td className="p-3 font-bold text-gray-500">#{c.rank}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${c.color}`}>{c.avatar}</div>
                                <div>
                                  <p className="font-bold text-gray-900">{c.name}</p>
                                  <p className="text-xs text-gray-500 font-mono">{c.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-right font-bold">{c.orders}</td>
                            <td className="p-3 text-right font-bold text-emerald-600">{formatVnd(c.spent)}</td>
                            <td className="p-3 text-right text-xs text-gray-500">{c.lastDays} ngày trước</td>
                            <td className="p-3 text-xs text-gray-700">{c.favorite}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-800 mb-4">📱 Kênh acquisition</h4>
                  <div className="space-y-3">
                    {ACQUISITION_CHANNELS.map(ch => (
                      <div key={ch.channel}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="font-medium text-gray-700">{ch.channel}</span>
                          <span className="font-bold text-gray-900">{ch.count} · {ch.pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${ch.color}`} style={{ width: `${ch.pct}%` }}></div>
                        </div>
                        {ch.costPer > 0 && <p className="text-[10px] text-gray-400 mt-1">CAC: {formatVnd(ch.costPer)}/khách</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* CTA Marketing */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">📣 Campaign gợi ý</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5">
                    <div className="text-2xl mb-2">🎁</div>
                    <h4 className="text-sm font-bold text-emerald-900">Gửi voucher VIP</h4>
                    <p className="text-xs text-emerald-700 mt-1">108 khách VIP đóng góp 68% doanh thu. Tặng voucher 15% giữ chân.</p>
                    <button className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg">Chạy campaign →</button>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5">
                    <div className="text-2xl mb-2">💔</div>
                    <h4 className="text-sm font-bold text-red-900">Win-back sắp mất</h4>
                    <p className="text-xs text-red-700 mt-1">378 khách không mua &gt;90 ngày. Tiềm năng mất 45.6tr doanh thu.</p>
                    <button className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg">Retention email →</button>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
                    <div className="text-2xl mb-2">🌱</div>
                    <h4 className="text-sm font-bold text-amber-900">Nurture khách mới</h4>
                    <p className="text-xs text-amber-700 mt-1">512 khách mới trong 30 ngày. Onboarding + gợi ý sản phẩm liên quan.</p>
                    <button className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg">Setup autoflow →</button>
                  </div>
                </div>
              </section>

              {/* Bảng KH hiện tại */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"><h3 className="text-sm font-medium text-gray-500 mb-1">Tổng Khách Hàng</h3><p className="text-2xl font-bold text-gray-900">1,248</p></div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"><h3 className="text-sm font-medium text-gray-500 mb-1">Khách Mới (Tuần)</h3><p className="text-2xl font-bold text-green-600">+42</p></div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"><h3 className="text-sm font-medium text-gray-500 mb-1">Thành viên VIP</h3><p className="text-2xl font-bold text-yellow-600">15</p></div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-200 text-xs uppercase text-gray-500">
                      <th className="p-4 font-bold">Khách hàng (Tên/Email)</th>
                      <th className="p-4 font-bold">Liên hệ</th>
                      <th className="p-4 font-bold text-center">Số đơn hàng</th>
                      <th className="p-4 font-bold">Tổng chi tiêu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {MOCK_CUSTOMERS.map((cus, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setCustomerModal(cus)}>
                        <td className="p-4 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border ${cus.vip ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
                            {cus.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{cus.name} {cus.vip && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded ml-1 uppercase">VIP</span>}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{cus.email}</p>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">📞 {cus.phone}</td>
                        <td className="p-4 font-bold text-gray-900 text-sm text-center">{cus.orders}</td>
                        <td className={`p-4 font-bold text-sm ${cus.vip ? 'text-green-600' : 'text-gray-600'}`}>{cus.spent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* HISTORY VIEW */}
          {activeTab === 'history' && (() => {
            const filtered = historyFilter === 'all' ? ORDER_HISTORY : ORDER_HISTORY.filter(o => o.status === historyFilter);
            const deliveredCount = ORDER_HISTORY.filter(o => o.status === 'delivered').length;
            const cancelledCount = ORDER_HISTORY.filter(o => o.status === 'cancelled').length;
            const refundedCount = ORDER_HISTORY.filter(o => o.status === 'refunded').length;
            const totalRevenue = ORDER_HISTORY.filter(o => o.status === 'delivered').reduce((sum, o) => sum + parseInt(o.price.replace(/[^\d]/g, '')), 0);

            return (
              <div className="h-full overflow-y-auto p-6 bg-gray-50">

                {/* Archive Info Banner */}
                {showArchiveInfo && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5 relative">
                    <button onClick={() => setShowArchiveInfo(false)} className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 text-sm">✕</button>
                    <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                      Chính sách lưu trữ & Archive tự động
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                        <p className="text-blue-600 font-bold text-xs uppercase mb-1">Thời gian lưu trong DB</p>
                        <p className="font-bold text-blue-900">{ARCHIVE_POLICY.keepInDb} ngày (≈ 2 tháng)</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                        <p className="text-blue-600 font-bold text-xs uppercase mb-1">Lịch archive</p>
                        <p className="font-bold text-blue-900">{ARCHIVE_POLICY.schedule}</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                        <p className="text-blue-600 font-bold text-xs uppercase mb-1">Định dạng xuất</p>
                        <p className="font-bold text-blue-900 uppercase">{ARCHIVE_POLICY.autoExportFormat}</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                        <p className="text-blue-600 font-bold text-xs uppercase mb-1">Lưu tại</p>
                        <p className="font-bold text-blue-900 text-xs">{ARCHIVE_POLICY.exportFolder}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-700"><strong>Dữ liệu bao gồm:</strong> {ARCHIVE_POLICY.includes.join(' • ')}</p>
                    </div>
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Tổng đơn lịch sử</h3>
                    <p className="text-2xl font-bold text-gray-900">{ORDER_HISTORY.length}</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Giao thành công</h3>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-green-600">{deliveredCount}</p>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{Math.round(deliveredCount / ORDER_HISTORY.length * 100)}%</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Hủy / Hoàn</h3>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-red-500">{cancelledCount + refundedCount}</p>
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{cancelledCount} hủy, {refundedCount} hoàn</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Doanh thu (đã giao)</h3>
                    <p className="text-2xl font-bold text-emerald-600">{totalRevenue.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-4">
                  {([
                    { key: 'all', label: 'Tất cả', count: ORDER_HISTORY.length },
                    { key: 'delivered', label: 'Giao thành công', count: deliveredCount },
                    { key: 'cancelled', label: 'Đã hủy', count: cancelledCount },
                    { key: 'refunded', label: 'Đã hoàn', count: refundedCount },
                  ] as const).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setHistoryFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        historyFilter === tab.key
                          ? tab.key === 'delivered' ? 'bg-green-100 text-green-800 font-bold'
                            : tab.key === 'cancelled' ? 'bg-red-100 text-red-800 font-bold'
                            : tab.key === 'refunded' ? 'bg-amber-100 text-amber-800 font-bold'
                            : 'bg-gray-200 text-gray-800 font-bold'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${historyFilter === tab.key ? 'bg-white/50' : 'bg-gray-100'}`}>{tab.count}</span>
                    </button>
                  ))}
                </div>

                {/* History Table */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                        <th className="p-4 font-bold">Mã đơn</th>
                        <th className="p-4 font-bold">Khách hàng</th>
                        <th className="p-4 font-bold">Sản phẩm</th>
                        <th className="p-4 font-bold">Trạng thái</th>
                        <th className="p-4 font-bold">Ngày đặt</th>
                        <th className="p-4 font-bold">Ngày kết thúc</th>
                        <th className="p-4 font-bold text-right">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition group">
                          <td className="p-4">
                            <span className="font-bold text-gray-900 text-sm font-mono">{(order as any).order_number || order.id}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>{order.avatar}</div>
                              <span className="text-sm font-medium text-gray-800">{order.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate">{order.items}</td>
                          <td className="p-4">
                            {order.status === 'delivered' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                Giao thành công
                              </span>
                            )}
                            {order.status === 'cancelled' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Đã hủy
                              </span>
                            )}
                            {order.status === 'refunded' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                                Hoàn tiền
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-sm text-gray-500 font-mono">{order.orderedAt}</td>
                          <td className="p-4 text-sm font-mono">
                            {order.status === 'delivered' && <span className="text-green-700">{(order as any).completedAt}</span>}
                            {order.status === 'cancelled' && <span className="text-red-600">{(order as any).cancelledAt}</span>}
                            {order.status === 'refunded' && <span className="text-amber-700">{(order as any).refundedAt}</span>}
                          </td>
                          <td className="p-4 text-right">
                            <span className={`font-bold text-sm ${order.status === 'delivered' ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                              {order.price}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cancelled / Refunded Reasons */}
                {(historyFilter === 'cancelled' || historyFilter === 'refunded' || historyFilter === 'all') && filtered.some(o => o.status !== 'delivered') && (
                  <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Lý do hủy / hoàn
                    </h3>
                    <div className="space-y-2">
                      {filtered.filter(o => o.status !== 'delivered').map(order => (
                        <div key={order.id} className={`flex items-start gap-3 p-3 rounded-lg border ${order.status === 'cancelled' ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                          <span className="font-mono text-xs font-bold text-gray-500 mt-0.5 shrink-0">{(order as any).order_number || order.id}</span>
                          <p className="text-sm text-gray-700">{order.reason}</p>
                          <span className={`ml-auto text-xs font-bold shrink-0 px-2 py-0.5 rounded ${order.status === 'cancelled' ? 'text-red-700 bg-red-100' : 'text-amber-700 bg-amber-100'}`}>
                            {order.status === 'cancelled' ? 'Hủy' : 'Hoàn'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Retention Timeline */}
                <div className="mt-6 bg-gray-100/80 border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Dữ liệu đang hiển thị trong vòng <strong className="text-gray-900">{RETENTION_DAYS} ngày gần nhất</strong>. Đơn cũ hơn sẽ được xuất file Excel tự động mỗi đầu tháng rồi xóa khỏi DB.</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ============================ ACCOUNTING ============================ */}
          {activeTab === 'accounting' && (() => {
            const totalRevenue = INCOME_ENTRIES.reduce((s, e) => s + e.amount, 0);
            const collected = INCOME_ENTRIES.filter(e => e.collected).reduce((s, e) => s + e.amount, 0);
            const pending = totalRevenue - collected;
            const totalExpense = EXPENSE_ENTRIES.reduce((s, e) => s + e.amount, 0);
            const netProfit = totalRevenue - totalExpense;
            const monthlyMax = Math.max(...MONTHLY_PL.map(m => m.revenue));

            return (
              <div className="h-full overflow-y-auto p-6 bg-gray-50 space-y-6">

                {/* KPI cards */}
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-emerald-500">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Doanh thu</h4>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">{formatVnd(totalRevenue)}</p>
                      <div className="mt-2 space-y-0.5 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">Đã thu</span><span className="font-bold text-emerald-700">{formatVnd(collected)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Chờ thu</span><span className="font-bold text-amber-600">{formatVnd(pending)}</span></div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-red-500">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chi phí</h4>
                      <p className="text-2xl font-bold text-red-600 mt-1">{formatVnd(totalExpense)}</p>
                      <div className="mt-2 space-y-0.5 text-xs">
                        {EXPENSE_BREAKDOWN.map(e => (
                          <div key={e.category} className="flex justify-between"><span className="text-gray-500 truncate">{e.label.split(' ')[0]}</span><span className="font-bold text-gray-700">{formatCompact(e.amount)}</span></div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-emerald-600">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lợi nhuận ròng</h4>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{formatVnd(netProfit)}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Biên lợi nhuận</span>
                          <span className="font-bold text-emerald-600">{Math.round(netProfit / totalRevenue * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${netProfit / totalRevenue * 100}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tiền mặt</h4>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{formatVnd(8920000)}</p>
                      <div className="mt-2 space-y-0.5 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">Đầu kỳ</span><span className="font-mono">{formatVnd(7450000)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Biến động</span><span className="font-bold text-emerald-600">+{formatCompact(1470000)}</span></div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Sổ thu + Sổ chi */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Sổ thu */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">📥 Sổ thu — Doanh thu</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{INCOME_ENTRIES.length} giao dịch tháng 8</p>
                      </div>
                      <button className="text-xs text-emerald-600 font-bold hover:underline">Xem tất cả →</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                          <tr>
                            <th className="text-left p-3 font-bold">Ngày</th>
                            <th className="text-left p-3 font-bold">Mã đơn</th>
                            <th className="text-left p-3 font-bold">Khách</th>
                            <th className="text-right p-3 font-bold">Số tiền</th>
                            <th className="text-center p-3 font-bold">TT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {INCOME_ENTRIES.map(e => (
                            <tr key={e.orderId} className="hover:bg-gray-50">
                              <td className="p-3 font-mono text-gray-500">{e.date}</td>
                              <td className="p-3 font-mono font-bold">{e.orderId}</td>
                              <td className="p-3 text-gray-700">{e.customer}</td>
                              <td className="p-3 text-right font-bold text-emerald-600">{formatVnd(e.amount)}</td>
                              <td className="p-3 text-center">
                                {e.collected ? <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">Đã thu</span> : <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">Chờ</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sổ chi */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">📤 Sổ chi — Phân loại</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{EXPENSE_ENTRIES.length} phiếu chi tháng 8</p>
                      </div>
                      <button className="text-xs text-emerald-600 font-bold hover:underline">+ Thêm phiếu chi</button>
                    </div>
                    {/* Breakdown bar */}
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex h-6 rounded-lg overflow-hidden mb-3">
                        {EXPENSE_BREAKDOWN.map(e => (
                          <div key={e.category} className={`${e.color} flex items-center justify-center text-white text-[10px] font-bold`} style={{ width: `${e.pct}%` }} title={`${e.label}: ${formatVnd(e.amount)}`}>
                            {e.pct}%
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs">
                        {EXPENSE_BREAKDOWN.map(e => (
                          <div key={e.category} className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${e.color}`}></span>
                            <span className="text-gray-600">{e.label}</span>
                            <span className="font-bold text-gray-900">{formatCompact(e.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-bold">Ngày</th>
                            <th className="text-left p-3 font-bold">Loại</th>
                            <th className="text-left p-3 font-bold">Mô tả</th>
                            <th className="text-right p-3 font-bold">Số tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {EXPENSE_ENTRIES.map((e, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="p-3 font-mono text-gray-500">{e.date}</td>
                              <td className="p-3"><span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded">{e.category}</span></td>
                              <td className="p-3 text-gray-700">{e.desc}</td>
                              <td className="p-3 text-right font-bold text-red-600">-{formatVnd(e.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* P&L 6 tháng chart */}
                <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">📈 Báo cáo Lãi/Lỗ 6 tháng gần nhất</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Biên lợi nhuận trung bình: {(MONTHLY_PL.reduce((s, m) => s + m.margin, 0) / MONTHLY_PL.length).toFixed(1)}%</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500"></span>Doanh thu</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400"></span>Chi phí</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-800"></span>Lợi nhuận</div>
                    </div>
                  </div>
                  <div className="flex items-end gap-4 h-56">
                    {MONTHLY_PL.map(m => (
                      <div key={m.month} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex items-end justify-center gap-1 h-48">
                          <div className="w-1/3 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-colors relative group" style={{ height: `${(m.revenue / monthlyMax) * 100}%` }}>
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-700 whitespace-nowrap">{formatCompact(m.revenue)}</span>
                          </div>
                          <div className="w-1/3 bg-red-400 hover:bg-red-500 rounded-t transition-colors" style={{ height: `${(m.cost / monthlyMax) * 100}%` }}></div>
                          <div className="w-1/3 bg-gray-800 rounded-t" style={{ height: `${(m.profit / monthlyMax) * 100}%` }}></div>
                        </div>
                        <p className="text-xs font-bold text-gray-600 mt-2">{m.month}</p>
                        <p className="text-[10px] text-gray-400">Biên {m.margin.toFixed(0)}%</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Công nợ */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
                        Phải thu (COD chờ)
                      </h4>
                      <span className="text-lg font-bold text-amber-700">{formatVnd(pending)}</span>
                    </div>
                    <div className="space-y-2">
                      {INCOME_ENTRIES.filter(e => !e.collected).map(e => (
                        <div key={e.orderId} className="bg-white/70 p-2 rounded-lg flex items-center justify-between text-xs">
                          <span><strong className="font-mono">{e.orderId}</strong> · {e.customer}</span>
                          <span className="font-bold text-amber-700">{formatVnd(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                        Phải trả (đến hạn)
                      </h4>
                      <span className="text-lg font-bold text-blue-700">{formatVnd(11300000)}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="bg-white/70 p-2 rounded-lg flex items-center justify-between">
                        <span>Cô Lan · Lương kỳ 2 (T8)</span>
                        <span className="font-bold text-blue-700">{formatVnd(4500000)}</span>
                      </div>
                      <div className="bg-white/70 p-2 rounded-lg flex items-center justify-between">
                        <span>Anh Đức + Chị Mai · Lương kỳ 2</span>
                        <span className="font-bold text-blue-700">{formatVnd(6800000)}</span>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            );
          })()}

          {/* ============================ ROLES / PERMISSIONS ============================ */}
          {activeTab === 'roles' && (
            <div className="h-full overflow-y-auto p-6 bg-gray-50 space-y-6">

              {/* 4 Role Cards */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">👥 4 Vai trò trong hệ thống</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(Object.entries(ROLE_META) as [RoleKey, typeof ROLE_META[RoleKey]][]).map(([key, meta]) => {
                    const members = TEAM_MEMBERS.filter(m => m.role === key);
                    return (
                      <div key={key} className={`p-5 rounded-xl border-2 ${meta.badgeClass.replace('/10', '/5').replace('text-', 'border-')}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{meta.icon}</span>
                          <h4 className="text-base font-bold text-gray-900">{meta.label}</h4>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">{meta.description}</p>
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wide">Thành viên</p>
                          <p className="text-lg font-bold text-gray-900 mt-1">{members.length} người</p>
                          <div className="mt-1 space-y-0.5">
                            {members.map(m => (
                              <p key={m.id} className="text-xs text-gray-600 truncate">
                                {m.status === 'invited' && '⏳ '}{m.name}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Ma trận permissions */}
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">🔐 Ma trận quyền chi tiết</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Tất cả tính năng theo từng role</p>
                  </div>
                  <button className="text-xs bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-md hover:bg-emerald-600">Sửa quyền hàng loạt</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left p-3 font-bold text-gray-500 uppercase text-[10px] w-64">Chức năng</th>
                        {(Object.keys(ROLE_META) as RoleKey[]).map(r => (
                          <th key={r} className="text-center p-3 font-bold text-gray-500 uppercase text-[10px]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-base">{ROLE_META[r].icon}</span>
                              <span>{ROLE_META[r].label}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISSIONS_MATRIX.map((cat) => (
                        <React.Fragment key={cat.category}>
                          <tr className="bg-gray-50/50">
                            <td colSpan={5} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">{cat.category}</td>
                          </tr>
                          {cat.permissions.map(perm => (
                            <tr key={perm.key} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="p-3 text-gray-700 font-medium">{perm.label}</td>
                              {(['owner', 'manager', 'staff', 'accountant'] as RoleKey[]).map(role => {
                                const val: RolePermission = perm[role];
                                return (
                                  <td key={role} className="p-3 text-center">
                                    <PermissionCell value={val} />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Legend */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1.5"><PermissionCell value="full" small /> <span className="text-gray-600">Toàn quyền</span></div>
                  <div className="flex items-center gap-1.5"><PermissionCell value="read" small /> <span className="text-gray-600">Chỉ xem</span></div>
                  <div className="flex items-center gap-1.5"><PermissionCell value="own_only" small /> <span className="text-gray-600">Chỉ của mình</span></div>
                  <div className="flex items-center gap-1.5"><PermissionCell value="masked" small /> <span className="text-gray-600">Ẩn danh</span></div>
                  <div className="flex items-center gap-1.5"><PermissionCell value="none" small /> <span className="text-gray-600">Không có</span></div>
                </div>
              </section>

              {/* Danh sách thành viên */}
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800">👤 Danh sách thành viên ({TEAM_MEMBERS.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="text-left p-3 font-bold">Thành viên</th>
                        <th className="text-left p-3 font-bold">Role</th>
                        <th className="text-left p-3 font-bold">Trạng thái</th>
                        <th className="text-left p-3 font-bold">Hoạt động</th>
                        <th className="text-left p-3 font-bold">Đóng góp</th>
                        <th className="text-center p-3 font-bold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {TEAM_MEMBERS.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${m.avatarColor}`}>{m.avatar}</div>
                              <div>
                                <p className="font-bold text-gray-900">{m.name}</p>
                                <p className="text-xs text-gray-500">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3"><span className={`text-xs font-bold px-2 py-1 rounded border ${ROLE_META[m.role].badgeClass}`}>{ROLE_META[m.role].icon} {ROLE_META[m.role].label}</span></td>
                          <td className="p-3">
                            {m.status === 'active' ? <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Active</span> : <span className="text-xs text-amber-600 font-bold">⏳ Chờ kích hoạt</span>}
                          </td>
                          <td className="p-3 text-xs text-gray-600">{m.lastSeen}</td>
                          <td className="p-3 text-xs font-medium text-gray-700">{m.contribution}</td>
                          <td className="p-3 text-center"><button className="text-gray-400 hover:text-gray-700 p-1">⋯</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Info card RLS */}
              <section className="bg-gray-100/60 border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <div>
                    <p className="text-sm font-bold text-gray-800 mb-1">Ghi chú kỹ thuật — Supabase RLS</p>
                    <p className="text-xs text-gray-600 leading-relaxed">Phân quyền hiện đang mock ở client-side. Ở <strong>Step 2</strong>, sẽ triển khai <code className="bg-white/60 px-1 rounded text-emerald-700 font-mono">profiles.role</code> + Row-Level Security policies trên PostgreSQL: mỗi bảng có policy check role của <code className="bg-white/60 px-1 rounded text-emerald-700 font-mono">auth.uid()</code>. Bảng <code className="bg-white/60 px-1 rounded text-emerald-700 font-mono">customers</code> có VIEW mask (SĐT/Email ẩn) cho role Accountant.</p>
                  </div>
                </div>
              </section>

            </div>
          )}
        </div>
      </main>

      {/* OVERLAY */}
      <div 
        className={`fixed inset-0 bg-gray-900/40 z-40 backdrop-blur-sm transition-opacity duration-300 ${hasAnyModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={closeAllModals}
      />

      {/* SLIDE-OVER: ORDER */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${orderModal ? 'translate-x-0' : 'translate-x-full'}`}>
        {orderModal && (
          <>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between bg-white z-10 shrink-0">
              <div>
                <h2 className="text-xl font-bold">Đơn {orderModal.order_number || orderModal.id}</h2>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${orderModal.color === 'gray' ? 'bg-gray-200 text-gray-800' : orderModal.color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                  {orderModal.uiStatus}
                </span>
              </div>
              <button onClick={closeAllModals} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full h-fit">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xl shrink-0">{orderModal.avatar}</div>
                <div className="space-y-1 text-sm flex-1">
                  <p className="font-bold text-gray-900">{orderModal.name || 'Khách hàng'}</p>
                  {orderModal.phone && (
                    <p className="text-gray-600">
                      📞 <a href={`tel:${orderModal.phone}`} className="hover:underline">{orderModal.phone}</a>
                    </p>
                  )}
                  {orderModal.email && (
                    <p className="text-gray-600">
                      ✉️ <a href={`mailto:${orderModal.email}`} className="hover:underline text-blue-600">{orderModal.email}</a>
                    </p>
                  )}
                  {orderModal.address ? (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100">
                      <p className="text-gray-700 text-xs">{orderModal.address}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400 italic">(Chưa có địa chỉ)</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Sản phẩm</h3>
                <div className="flex gap-4 items-center p-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <img src="https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=100&q=80" alt="Item" className="w-12 h-12 object-cover rounded-md border border-gray-200 shrink-0"/>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">{orderModal.items}</h4>
                    <a href="#" className="text-xs text-blue-600 font-medium hover:underline mt-1 inline-block">🔗 Xem file thiết kế đính kèm</a>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-500 text-xs uppercase">Thanh toán</span>
                    <div className="flex items-center gap-1 text-sm font-bold">
                      {orderModal.paymentMethod === 'MOMO' && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">MoMo</span>}
                      {orderModal.paymentMethod === 'VNPAY' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">VNPay</span>}
                      {orderModal.paymentMethod === 'COD' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">Nhận hàng thanh toán</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className={`font-bold text-sm ${orderModal.paymentMethod !== 'COD' ? 'text-green-600' : 'text-gray-700'}`}>
                      {orderModal.paymentMethod !== 'COD' ? 'Khách đã thanh toán' : 'Cần thu hộ (COD)'}
                    </span>
                    <span className="font-bold text-lg text-red-600">{orderModal.price}</span>
                  </div>
                </div>
              </div>

              {/* Người đảm nhận (Admin only) */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Người đảm nhận</h3>
                {orderModal.assignee ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${orderModal.assignee.color}`}>
                      {orderModal.assignee.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{orderModal.assignee.name}</p>
                      <p className="text-xs text-gray-500">{orderModal.assignee.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">📞 {orderModal.assignee.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200 border-dashed">
                    <p className="text-sm font-bold text-yellow-700">Chưa phân công</p>
                    <select className="text-xs border border-gray-300 rounded-md py-1.5 px-2 bg-white text-gray-700 cursor-pointer">
                      <option value="">— Chọn người đảm nhận —</option>
                      {STAFF.map(s => <option key={s.avatar} value={s.name}>{s.name} — {s.role}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Git Timeline — Collapsible */}
              <details className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors select-none">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tiến trình sản xuất (Git Timeline)</h3>
                  <svg className="w-4 h-4 text-gray-400 transition-transform [details[open]>&]:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </summary>
                <div className="px-2 pb-4 -mt-2">
                  <GitProgressTracker
                    orderId={orderModal.id}
                    steps={buildOrderSteps(orderModal)}
                    compact
                  />
                </div>
              </details>

              {/* Danger zone — xóa đơn (chỉ hiển thị cho đơn thật trong DB, không hiện cho mock data) */}
              {typeof orderModal.id === 'string' && orderModal.id.length >= 32 && (
                <div className="bg-white rounded-xl border-2 border-red-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                    <h3 className="text-xs font-bold text-red-700 uppercase tracking-wide">⚠ Vùng nguy hiểm</h3>
                  </div>
                  <div className="p-4">
                    {!deleteOrderConfirmOpen ? (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Xóa đơn hàng vĩnh viễn</p>
                          <p className="text-xs text-gray-500 mt-1">Chỉ dùng cho đơn test. Không thể hoàn tác. Sản phẩm, lịch sử, thanh toán liên quan cũng sẽ bị xóa.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setDeleteOrderConfirmOpen(true); setDeleteOrderConfirmText(''); setDeleteOrderError(null); }}
                          className="shrink-0 px-3 py-2 text-sm font-bold text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                        >
                          Xóa đơn
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-800">
                          Để xác nhận, gõ chính xác mã đơn <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-red-700 font-bold">{orderModal.order_number || orderModal.id}</code> vào ô dưới:
                        </p>
                        <input
                          type="text"
                          value={deleteOrderConfirmText}
                          onChange={(e) => { setDeleteOrderConfirmText(e.target.value); setDeleteOrderError(null); }}
                          placeholder={orderModal.order_number || orderModal.id}
                          className="w-full border border-red-300 rounded-md py-2 px-3 text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                          autoFocus
                          disabled={deleteOrderInFlight}
                        />
                        {deleteOrderError && (
                          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{deleteOrderError}</p>
                        )}
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => { setDeleteOrderConfirmOpen(false); setDeleteOrderConfirmText(''); setDeleteOrderError(null); }}
                            disabled={deleteOrderInFlight}
                            className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteOrder}
                            disabled={deleteOrderInFlight || deleteOrderConfirmText.trim() !== (orderModal.order_number || orderModal.id)}
                            className="px-3 py-2 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                          >
                            {deleteOrderInFlight ? 'Đang xóa...' : 'Tôi hiểu, xóa vĩnh viễn'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* SLIDE-OVER: PRODUCT — Supabase connected */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${productModal ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold">{productModal?.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{productsSource === 'live' ? '📡 Lưu trực tiếp lên Supabase' : '⚠ Supabase offline — thao tác sẽ báo lỗi'}</p>
          </div>
          <button onClick={closeAllModals} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-600">Tên sản phẩm *</label>
            <input
              type="text"
              value={productForm.name ?? ''}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="VD: Tranh thêu hoa sen"
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-600">Slug URL *</label>
            <input
              type="text"
              value={productForm.slug ?? ''}
              onChange={(e) => setProductForm({ ...productForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              placeholder="tranh-theu-hoa-sen"
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">Đường dẫn shop: /product/{productForm.slug || 'slug'}</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-600">Danh mục</label>
            <select
              value={productForm.categoryId ?? ''}
              onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {liveCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1 text-gray-600">Mô tả</label>
            <textarea
              rows={3}
              value={productForm.description ?? ''}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Chi tiết sản phẩm..."
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-600">Giá bán gốc * (VND)</label>
              <input
                type="number"
                value={productForm.price ?? ''}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                placeholder="850000"
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1 text-red-600">Giá sale (VND)</label>
              <input
                type="number"
                value={productForm.salePrice ?? ''}
                onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value ? Number(e.target.value) : null })}
                placeholder="720000 (để trống nếu không sale)"
                className="w-full border border-red-300 text-red-700 rounded-md py-2 px-3 text-sm bg-red-50 focus:ring-red-500 outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-2 text-gray-600">Ảnh sản phẩm</label>
            <div className="flex flex-wrap gap-2">
              {(productForm.images ?? []).map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group shrink-0">
                  <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] font-bold text-center py-0.5">ẢNH CHÍNH</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeProductImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                  >✕</button>
                </div>
              ))}
              <label className={`w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center shrink-0 cursor-pointer transition ${productImageUploading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'}`}>
                {productImageUploading ? (
                  <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    <span className="text-[9px] text-gray-400 font-bold mt-0.5">Thêm ảnh</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={productImageUploading}
                  onChange={handleProductImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">Ảnh đầu tiên hiện làm ảnh chính trên Shop. Kéo để sắp xếp lại (sắp có).</p>

            <details className="mt-2">
              <summary className="text-[10px] text-gray-500 font-bold cursor-pointer hover:text-gray-700">Hoặc dán URL ảnh trực tiếp</summary>
              <textarea
                rows={2}
                value={(productForm.images ?? []).join('\n')}
                onChange={(e) => setProductForm({ ...productForm, images: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                placeholder="https://..."
                className="w-full mt-1.5 border border-gray-300 rounded-md py-2 px-3 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </details>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 shrink-0">
          <button onClick={closeAllModals} disabled={productSaving} className="flex-1 bg-white border border-gray-300 py-2.5 rounded-lg font-bold text-sm text-gray-700 disabled:opacity-50">Hủy</button>
          <button onClick={handleSaveProduct} disabled={productSaving} className="flex-[2] bg-emerald-600 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {productSaving ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Đang lưu...</>) : (productModal?.id ? 'Cập nhật' : 'Tạo sản phẩm')}
          </button>
        </div>
      </div>

      {/* SLIDE-OVER: CUSTOMER */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${customerModal ? 'translate-x-0' : 'translate-x-full'}`}>
        {customerModal && (
          <>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between bg-white z-10 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Hồ sơ khách hàng</h2>
              <button onClick={closeAllModals} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full h-fit">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl mb-3 border-4 border-white shadow-sm ${customerModal.vip ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {customerModal.avatar}
                </div>
                <h3 className="font-bold text-xl text-gray-900">{customerModal.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{customerModal.email}</p>
                
                <div className="flex items-center gap-4 mt-4 w-full border-t border-gray-100 pt-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-bold">Tổng đơn</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{customerModal.orders}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-bold">Tổng chi</p>
                    <p className="text-lg font-bold text-green-600 mt-1">{customerModal.spent}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Sổ địa chỉ (Addresses)</h3>
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg relative">
                  <span className="absolute top-3 right-3 text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">Mặc định</span>
                  <p className="text-sm font-bold text-gray-800">📞 {customerModal.phone}</p>
                  <p className="text-xs text-gray-600 mt-1">Tòa nhà Landmark 81, Vinhomes Central Park, Phường 22, Bình Thạnh, TP.HCM</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* SLIDE-OVER: REVENUE DRILL-DOWN */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[520px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${revenueDrill ? 'translate-x-0' : 'translate-x-full'}`}>
        {revenueDrill && (() => {
          const STATUS_VI: Record<string, string> = { pending: 'Chờ xử lý', producing: 'Đang sản xuất', issue: 'Tạm dừng', qc: 'Kiểm tra QC', shipping: 'Đang giao', delivered: 'Hoàn thành', cancelled: 'Đã hủy' };
          const STATUS_COLOR: Record<string, string> = { pending: 'bg-gray-200 text-gray-700', producing: 'bg-blue-100 text-blue-700', issue: 'bg-purple-100 text-purple-700', qc: 'bg-green-100 text-green-700', shipping: 'bg-amber-100 text-amber-700', delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };
          const PAYMENT_BADGE: Record<string, { bg: string; label: string }> = { MOMO: { bg: 'bg-pink-100 text-pink-700', label: 'MoMo' }, VNPAY: { bg: 'bg-blue-100 text-blue-700', label: 'VNPay' }, COD: { bg: 'bg-orange-100 text-orange-700', label: 'COD' } };

          const drillConfig = {
            delivered: { title: 'Đã thu (hoàn thành)', icon: '✅', color: 'text-emerald-700', bgHeader: 'bg-emerald-50', getOrders: () => pDelivered },
            active: { title: 'Đang xử lý', icon: '🔄', color: 'text-blue-700', bgHeader: 'bg-blue-50', getOrders: () => pActive },
            all: { title: 'Tổng doanh thu', icon: '📊', color: 'text-gray-900', bgHeader: 'bg-gray-50', getOrders: () => pOrders },
            profit: { title: 'Lợi nhuận ước tính', icon: '💰', color: 'text-emerald-700', bgHeader: 'bg-emerald-50', getOrders: () => pDelivered },
          };
          const cfg = drillConfig[revenueDrill];
          const drillOrders = cfg.getOrders();
          const search = revenueDrillSearch.toLowerCase().trim();
          const filtered = search ? drillOrders.filter(o =>
            o.id.toLowerCase().includes(search) ||
            o.name.toLowerCase().includes(search) ||
            o.items.toLowerCase().includes(search) ||
            o.price.toLowerCase().includes(search)
          ) : drillOrders;

          const totalFiltered = filtered.reduce((s, o) => s + parsePrice(o.price), 0);
          const isProfit = revenueDrill === 'profit';

          return (
            <>
              <div className={`px-6 py-4 border-b border-gray-200 ${cfg.bgHeader} shrink-0`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Chi tiết doanh thu {revenuePeriod !== 'all' && <span className="inline-block ml-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">{PERIOD_LABELS[revenuePeriod]}</span>}</p>
                    <h2 className={`text-xl font-bold ${cfg.color} flex items-center gap-2`}>
                      <span>{cfg.icon}</span> {cfg.title}
                    </h2>
                    <p className={`text-2xl font-bold mt-1 ${cfg.color}`}>
                      {isProfit ? formatVnd(Math.round(totalFiltered * PROFIT_MARGIN)) : formatVnd(totalFiltered)}
                      {isProfit && <span className="text-sm font-normal text-gray-500 ml-2">(từ {formatVnd(totalFiltered)} doanh thu)</span>}
                    </p>
                  </div>
                  <button onClick={closeAllModals} className="p-2 text-gray-400 hover:bg-white hover:text-gray-600 rounded-full h-fit transition-colors">✕</button>
                </div>
                {/* Search bar */}
                <div className="mt-3 relative">
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input
                    type="text"
                    placeholder="Tìm theo mã đơn, tên khách, sản phẩm..."
                    value={revenueDrillSearch}
                    onChange={(e) => setRevenueDrillSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                  {revenueDrillSearch && (
                    <button onClick={() => setRevenueDrillSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">{filtered.length} đơn hàng {search ? `(lọc từ ${drillOrders.length})` : ''}</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className="font-medium">Không tìm thấy đơn hàng</p>
                    <p className="text-xs mt-1">Thử từ khóa khác</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filtered.map((order, idx) => {
                      const price = parsePrice(order.price);
                      const profit = Math.round(price * PROFIT_MARGIN);
                      const pm = PAYMENT_BADGE[order.paymentMethod] || { bg: 'bg-gray-100 text-gray-600', label: order.paymentMethod };
                      return (
                        <div
                          key={order.id}
                          className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            const col = COLUMNS.find(c => c.id === order.status);
                            setRevenueDrill(null);
                            setRevenueDrillSearch('');
                            setOrderModal({ ...order, uiStatus: col?.title || order.status });
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                              {order.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-gray-900 text-sm truncate">{order.name}</p>
                                <span className="font-bold text-sm text-red-600 whitespace-nowrap">{order.price}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{order.items}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{(order as any).order_number || order.id}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                                  {STATUS_VI[order.status] || order.status}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pm.bg}`}>{pm.label}</span>
                                {isProfit && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                    LN: {formatVnd(profit)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer tổng kết */}
              <div className={`px-6 py-3 border-t border-gray-200 ${cfg.bgHeader} shrink-0`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{isProfit ? 'Tổng lợi nhuận' : 'Tổng doanh thu'} ({filtered.length} đơn)</p>
                    <p className={`text-lg font-bold ${cfg.color}`}>
                      {isProfit ? formatVnd(Math.round(totalFiltered * PROFIT_MARGIN)) : formatVnd(totalFiltered)}
                    </p>
                  </div>
                  {isProfit && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Doanh thu gốc</p>
                      <p className="text-sm font-bold text-gray-700">{formatVnd(totalFiltered)}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </div>

    </div>
  );
}
