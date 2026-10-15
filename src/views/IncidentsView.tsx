import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Incident, IncidentStatus } from '../types';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Filter, Trash2, CheckCircle2, Clock, AlertTriangle, ChevronDown } from 'lucide-react';

interface IncidentsViewProps {
  incidents: Incident[];
  onOpenNewIncident: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({ incidents, onOpenNewIncident }) => {
  const { role } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canEditStatus = role === 'manager' || role === 'technician';
  const canDelete = role === 'manager';

  const handleStatusChange = async (incidentId: string, newStatus: IncidentStatus) => {
    try {
      setUpdatingId(incidentId);
      const incRef = doc(db, 'incidents', incidentId);
      await updateDoc(incRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `incidents/${incidentId}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (incidentId: string) => {
    if (!window.confirm('ยืนยันที่จะลบรายการแจ้งซ่อมนี้?')) return;
    try {
      await deleteDoc(doc(db, 'incidents', incidentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `incidents/${incidentId}`);
    }
  };

  // Filtered list
  const filtered = incidents.filter((inc) => {
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (locationFilter !== 'all' && !inc.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">แจ้งซ่อมและ Incident</h2>
          <p className="text-xs text-gray-500 mt-1">
            ติดตามตั้งแต่รับแจ้งจนปิดงาน พร้อมประวัติการเกิดซ้ำของแต่ละจุด
          </p>
        </div>
        <button onClick={onOpenNewIncident} className="primary-btn shrink-0 cursor-pointer">
          + แจ้งเหตุชำรุด
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="open">เปิดงาน (Open)</option>
              <option value="in_progress">กำลังดำเนินการ (In Progress)</option>
              <option value="completed">เสร็จสิ้น (Completed)</option>
              <option value="cancelled">ยกเลิก (Cancelled)</option>
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium"
            >
              <option value="all">ทุกพื้นที่</option>
              <option value="ใต้ดิน">ชั้นใต้ดิน / B1</option>
              <option value="ลิฟต์">ลิฟต์โดยสาร</option>
              <option value="แอร์">ระบบปรับอากาศ / แอร์</option>
              <option value="ห้องน้ำ">ห้องน้ำ</option>
              <option value="ไฟฟ้า">ระบบไฟฟ้า</option>
            </select>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            ทั้งหมด {filtered.length} รายการ
          </div>
        </div>

        {/* Incidents Table */}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>จุดเกิดเหตุ / รหัสงาน</th>
                <th>อาการ / ประวัติ</th>
                <th>ความเร่งด่วน</th>
                <th>กำหนดแล้วเสร็จ</th>
                <th>สถานะงาน</th>
                {canDelete && <th className="text-right">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="transition-colors">
                  <td>
                    <div className="font-bold text-gray-900">{item.location}</div>
                    <span className="text-[11px] text-gray-400 font-mono">{item.incidentNumber}</span>
                  </td>

                  <td>
                    <div className="text-xs text-gray-800 font-medium">{item.description}</div>
                    {(item.recurrenceCount ?? 0) > 0 && (
                      <span className="inline-block mt-1 text-[10px] bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded-full border border-red-200">
                        เกิดซ้ำครั้งที่ {(item.recurrenceCount ?? 0) + 1}
                      </span>
                    )}
                  </td>

                  <td>
                    {item.priority === 'critical' ? (
                      <span className="pill red">วิกฤต</span>
                    ) : item.priority === 'urgent' ? (
                      <span className="pill amber">เร่งด่วน</span>
                    ) : (
                      <span className="pill green">ปกติ</span>
                    )}
                  </td>

                  <td className="text-xs text-gray-600 font-medium">
                    {item.targetCompletionDate || 'ตามนัด'}
                  </td>

                  <td>
                    {canEditStatus ? (
                      <div className="relative inline-block">
                        <select
                          disabled={updatingId === item.id}
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as IncidentStatus)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer border ${
                            item.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : item.status === 'in_progress'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : item.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-600 border-gray-300'
                              : 'bg-blue-50 text-blue-700 border-blue-300'
                          }`}
                        >
                          <option value="open">เปิดงาน</option>
                          <option value="in_progress">กำลังดำเนินการ</option>
                          <option value="completed">เสร็จสิ้น</option>
                          <option value="cancelled">ยกเลิก</option>
                        </select>
                      </div>
                    ) : (
                      <span
                        className={`pill ${
                          item.status === 'completed'
                            ? 'green'
                            : item.status === 'in_progress'
                            ? 'amber'
                            : 'blue'
                        }`}
                      >
                        {item.status === 'completed'
                          ? 'เสร็จสิ้น'
                          : item.status === 'in_progress'
                          ? 'กำลังดำเนินการ'
                          : 'เปิดงาน'}
                      </span>
                    )}
                  </td>

                  {canDelete && (
                    <td className="text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        title="ลบรายการแจ้งซ่อม"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 text-xs">
                    ไม่พบรายการแจ้งซ่อมตามตัวกรองที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
