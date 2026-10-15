import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Incident, MaintenancePlan, ExpenseRecord, ActiveTab } from '../types';
import { AlertCircle, Clock, CheckCircle2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface DashboardViewProps {
  incidents: Incident[];
  maintenance: MaintenancePlan[];
  expenses: ExpenseRecord[];
  onOpenNewIncident: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  incidents,
  maintenance,
  expenses,
  onOpenNewIncident,
  onNavigateTab,
}) => {
  const { currentUser } = useAuth();

  const openIncidents = incidents.filter((i) => i.status !== 'completed' && i.status !== 'cancelled');
  const upcomingPM = maintenance.filter((m) => (m.daysRemaining ?? 10) <= 7 && m.status !== 'completed');
  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const getPriorityPill = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <span className="pill red">วิกฤต</span>;
      case 'urgent':
        return <span className="pill amber">เร่งด่วน</span>;
      default:
        return <span className="pill green">รอตรวจสอบ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            สวัสดีครับ คุณ{currentUser?.displayName || 'ผู้จัดการ'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            ติดตามสถานะและงานบำรุงรักษาอาคาร Twenty-Seven ได้แบบ Real-Time จาก Firestore
          </p>
        </div>
        <button onClick={onOpenNewIncident} className="primary-btn shrink-0 cursor-pointer">
          + แจ้งเหตุชำรุด
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <span className="label">งานค้างทั้งหมด</span>
          <div className="metric text-gray-900">{openIncidents.length}</div>
          <span className="trend danger flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-red-500" />
            <span>มีงานค้าง {openIncidents.filter((i) => i.priority === 'critical').length} งานวิกฤต</span>
          </span>
        </div>

        <div className="card">
          <span className="label">PM ที่ครบกำหนดใน 7 วัน</span>
          <div className="metric warn">{upcomingPM.length}</div>
          <span className="trend warn flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>ควรจัดตารางเข้าดำเนินการ</span>
          </span>
        </div>

        <div className="card">
          <span className="label">อัตราการแก้ไขตรงเวลา</span>
          <div className="metric text-gray-900">88%</div>
          <span className="trend up flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>↑ 4.2% จากเดือนก่อน</span>
          </span>
        </div>

        <div className="card">
          <span className="label">ค่าใช้จ่ายเดือนนี้</span>
          <div className="metric text-gray-900">฿{totalExpenses.toLocaleString()}</div>
          <span className="trend up flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            <span>คุมงบตามแผนงาน</span>
          </span>
        </div>
      </div>

      {/* 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Incidents */}
        <div className="lg:col-span-7 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">งานแจ้งซ่อมล่าสุด</h3>
            <button
              onClick={() => onNavigateTab('incidents')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {incidents.slice(0, 4).map((inc) => (
              <div key={inc.id} className="timeline items-start">
                <div
                  className={`timeline-dot ${
                    inc.priority === 'critical' ? 'critical' : inc.priority === 'urgent' ? 'urgent' : ''
                  }`}
                />
                <div className="flex-1 min-w-0 pr-3">
                  <div className="text-xs font-bold text-gray-900 truncate">{inc.location}</div>
                  <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{inc.description}</div>
                  <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
                    <span>{inc.incidentNumber}</span>
                    <span>•</span>
                    <span>กำหนด: {inc.targetCompletionDate || 'ตามนัด'}</span>
                  </div>
                </div>
                <div>{getPriorityPill(inc.priority)}</div>
              </div>
            ))}

            {incidents.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">ยังไม่มีงานแจ้งซ่อม</div>
            )}
          </div>
        </div>

        {/* Upcoming PM Schedule */}
        <div className="lg:col-span-5 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">ปฏิทิน PM ใกล้ถึงกำหนด</h3>
            <button
              onClick={() => onNavigateTab('maintenance')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              ดูแผนทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {maintenance.slice(0, 3).map((pm) => {
              const days = pm.daysRemaining ?? 10;
              const percent = Math.max(15, Math.min(100, 100 - days * 3));
              return (
                <div key={pm.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">{pm.equipmentName}</span>
                    <span className="text-[11px] font-semibold text-amber-600">อีก {days} วัน</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{pm.taskDescription}</div>
                  <div className="bar mt-2">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
                    <span>กำหนด: {pm.nextDueDate}</span>
                    <span className="font-medium text-gray-600">{pm.assignedTo || 'รอจ่ายงาน'}</span>
                  </div>
                </div>
              );
            })}

            {maintenance.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">ยังไม่มีแผน PM</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
