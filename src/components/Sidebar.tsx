import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ActiveTab, UserRole } from '../types';
import { LayoutDashboard, AlertTriangle, CalendarClock, Package, ReceiptText, Users, Database } from 'lucide-react';

interface SidebarProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  openIncidentsCount: number;
}

const roleAllowedTabs: Record<UserRole, ActiveTab[]> = {
  manager: ['dashboard', 'incidents', 'maintenance', 'inventory', 'history', 'users'],
  reception: ['dashboard', 'incidents'],
  technician: ['dashboard', 'incidents', 'maintenance', 'inventory']
};

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, openIncidentsCount }) => {
  const { role } = useAuth();
  const allowed = roleAllowedTabs[role] || roleAllowedTabs.reception;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'ภาพรวมอาคาร', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'incidents',
      label: 'แจ้งซ่อม / Incident',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: openIncidentsCount > 0 ? openIncidentsCount : undefined
    },
    { id: 'maintenance', label: 'Preventive Maintenance', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'inventory', label: 'อะไหล่คงคลัง', icon: <Package className="w-4 h-4" /> },
    { id: 'history', label: 'ประวัติและค่าใช้จ่าย', icon: <ReceiptText className="w-4 h-4" /> },
    { id: 'users', label: 'จัดการสิทธิ์ผู้ใช้', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-[#12243a] text-white p-5 flex flex-col shrink-0 min-h-screen border-r border-[#1c3554] shadow-xl">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 pb-8 pt-2">
        <div className="brand-mark">27</div>
        <div>
          <div className="font-bold text-base tracking-tight leading-snug">Twenty-Seven</div>
          <div className="text-xs text-[#8ca0b9] font-medium">Building OS</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems
          .filter((item) => allowed.includes(item.id))
          .map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="opacity-90">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge !== undefined && (
                  <em className="ml-auto bg-[#e74c4c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full not-italic">
                    {item.badge}
                  </em>
                )}
              </button>
            );
          })}
      </nav>

      {/* Sidebar Footer with Firestore connection status */}
      <div className="mt-auto border-t border-[#2a405b] pt-4 px-2">
        <div className="flex items-start gap-3">
          <div className="status-dot mt-1.5" />
          <div className="text-xs">
            <b className="block font-semibold text-gray-200">ระบบทำงานปกติ</b>
            <div className="text-[#7f93ac] flex items-center gap-1 mt-0.5 text-[11px]">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>เชื่อมต่อ Firestore แล้ว</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
