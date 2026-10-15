import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ActiveTab, UserRole } from '../types';
import { LogOut, ShieldAlert, Sparkles } from 'lucide-react';

interface TopbarProps {
  currentTab: ActiveTab;
  onSeedData?: () => void;
}

const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'ภาพรวมอาคาร', subtitle: 'ติดตามสถานะอาคาร Twenty-Seven ได้จากหน้านี้' },
  incidents: { title: 'แจ้งซ่อมและ Incident', subtitle: 'ติดตามตั้งแต่รับแจ้งจนปิดงาน พร้อมประวัติการเกิดซ้ำ' },
  maintenance: { title: 'Preventive Maintenance', subtitle: 'วางแผน ตรวจสอบ และเก็บประวัติการบำรุงรักษา' },
  inventory: { title: 'อะไหล่คงคลัง', subtitle: 'รู้ทันทีว่าอะไหล่เหลือเท่าไร และจุดไหนถึงเวลาสั่งซื้อ' },
  history: { title: 'ประวัติและค่าใช้จ่าย', subtitle: 'ตรวจสอบสิ่งที่ทำ ค่าใช้จ่าย และปัญหาซ้ำในแต่ละจุด' },
  users: { title: 'จัดการสิทธิ์ผู้ใช้งาน', subtitle: 'กำหนดบทบาทและสิทธิ์การเข้าถึงสำหรับทีมงาน' }
};

const roleLabels: Record<UserRole, { label: string; badgeClass: string }> = {
  manager: { label: 'ผู้จัดการอาคาร (Manager)', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  reception: { label: 'เจ้าหน้าที่รับแจ้ง (Reception)', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  technician: { label: 'ช่างอาคาร (Technician)', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const Topbar: React.FC<TopbarProps> = ({ currentTab, onSeedData }) => {
  const { userProfile, currentUser, role, logout, setPreviewRoleOverride, previewRoleOverride } = useAuth();
  const info = tabTitles[currentTab] || { title: 'ภาพรวมอาคาร', subtitle: '' };

  const isRealManager = userProfile?.role === 'manager' || currentUser?.email?.toLowerCase() === 'cappuchino.mp@gmail.com';

  return (
    <header className="bg-white border-b border-[#e6ebf2] px-8 py-5 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
      <div>
        <div className="eyebrow">BUILDING OPERATIONS</div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{info.title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Reset / Reseed Demo Data Button */}
        {onSeedData && (
          <button
            onClick={onSeedData}
            title="รีเซ็ต/เติมข้อมูลตัวอย่าง Firestore"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>เติมข้อมูลตัวอย่าง</span>
          </button>
        )}

        {/* Role Selector (Allows switching/previewing roles) */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
          <span className="text-gray-500 font-medium hidden sm:inline">บทบาท:</span>
          <select
            value={previewRoleOverride || role}
            onChange={(e) => {
              const val = e.target.value as UserRole;
              setPreviewRoleOverride(val);
            }}
            className="bg-transparent font-semibold text-gray-800 cursor-pointer focus:outline-none"
            title="เปลี่ยนมุมมองบทบาทเพื่อทดสอบสิทธิ์"
          >
            <option value="manager">ผู้จัดการอาคาร (manager)</option>
            <option value="reception">เจ้าหน้าที่รับแจ้ง (reception)</option>
            <option value="technician">ช่างอาคาร (technician)</option>
          </select>
          {previewRoleOverride && (
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">
              ทดสอบมุมมอง
            </span>
          )}
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User'}
              className="w-9 h-9 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
              {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
            </div>
          )}

          <div className="text-left hidden lg:block">
            <div className="text-xs font-semibold text-gray-900 leading-tight">
              {currentUser?.displayName || 'ผู้ใช้งาน'}
            </div>
            <div className="text-[11px] text-gray-500 leading-tight">
              {currentUser?.email}
            </div>
          </div>

          <button
            onClick={logout}
            title="ออกจากระบบ"
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
