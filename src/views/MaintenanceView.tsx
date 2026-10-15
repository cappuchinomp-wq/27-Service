import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MaintenancePlan, PMFrequency } from '../types';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { CalendarClock, Plus, Download, CheckCircle, Trash2, X } from 'lucide-react';

interface MaintenanceViewProps {
  maintenance: MaintenancePlan[];
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ maintenance }) => {
  const { role } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [equipmentName, setEquipmentName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [frequency, setFrequency] = useState<PMFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('ทีมช่าง A');
  const [saving, setSaving] = useState(false);

  const canManage = role === 'manager' || role === 'technician';
  const isManager = role === 'manager';

  const upcoming7Days = maintenance.filter((m) => (m.daysRemaining ?? 10) <= 7 && m.status !== 'completed');
  const overdue = maintenance.filter((m) => m.status === 'overdue' || (m.daysRemaining ?? 10) < 0);
  const completedCount = maintenance.filter((m) => m.status === 'completed').length;

  const handleToggleComplete = async (plan: MaintenancePlan) => {
    try {
      const newStatus = plan.status === 'completed' ? 'scheduled' : 'completed';
      const ref = doc(db, 'maintenance', plan.id);
      await updateDoc(ref, {
        status: newStatus,
        lastHistory: newStatus === 'completed' ? `ตรวจเช็กเสร็จสิ้นเมื่อ ${new Date().toLocaleDateString('th-TH')}` : plan.lastHistory || '',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `maintenance/${plan.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('ยืนยันลบแผน PM นี้?')) return;
    try {
      await deleteDoc(doc(db, 'maintenance', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `maintenance/${id}`);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentName.trim() || !taskDescription.trim()) return;

    try {
      setSaving(true);
      const newId = `pm-${Date.now()}`;
      const newPlan: MaintenancePlan = {
        id: newId,
        equipmentName: equipmentName.trim(),
        taskDescription: taskDescription.trim(),
        frequency,
        nextDueDate: nextDueDate || '15 พ.ย. 2026',
        daysRemaining: 14,
        status: 'scheduled',
        assignedTo,
        lastHistory: 'เพิ่งสร้างแผนใหม่',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'maintenance', newId), newPlan);
      setShowAddModal(false);
      setEquipmentName('');
      setTaskDescription('');
      setNextDueDate('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'maintenance');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['อุปกรณ์', 'รายการตรวจ', 'กำหนดครั้งถัดไป', 'รอบการทำ', 'สถานะ', 'ผู้รับผิดชอบ'];
    const rows = maintenance.map((m) => [
      m.equipmentName,
      m.taskDescription,
      m.nextDueDate,
      m.frequency,
      m.status,
      m.assignedTo || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pm-schedule-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Preventive Maintenance (PM)</h2>
          <p className="text-xs text-gray-500 mt-1">วางแผน ตรวจสอบ และเก็บบันทึกประวัติการบำรุงรักษาเชิงป้องกัน</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button onClick={() => setShowAddModal(true)} className="primary-btn shrink-0 cursor-pointer">
              <Plus className="w-4 h-4" /> สร้างแผน PM
            </button>
          )}
        </div>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <span className="label">PM ทั้งหมดในระบบ</span>
          <div className="metric text-gray-900">{maintenance.length}</div>
          <span className="trend up">เสร็จแล้ว {completedCount} รายการ</span>
        </div>

        <div className="card">
          <span className="label">ใกล้ครบกำหนด</span>
          <div className="metric warn">{upcoming7Days.length}</div>
          <span className="trend warn">ภายใน 7 วัน</span>
        </div>

        <div className="card">
          <span className="label">เกินกำหนด</span>
          <div className="metric danger">{overdue.length}</div>
          <span className="trend danger">ต้องติดตามทันที</span>
        </div>

        <div className="card">
          <span className="label">ความถี่หลัก</span>
          <div className="metric text-gray-900">Monthly</div>
          <span className="trend text-gray-500">รอบบำรุงรักษารายเดือน</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">ตารางรายการ Preventive Maintenance</h3>
          <button
            onClick={handleExportCSV}
            className="secondary-btn text-xs py-1.5 px-3 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> ส่งออก CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>อุปกรณ์ / เครื่องจักร</th>
                <th>รายการตรวจสอบ</th>
                <th>กำหนดครั้งถัดไป</th>
                <th>รอบการทำ</th>
                <th>ผู้รับผิดชอบ</th>
                <th>สถานะ</th>
                {canManage && <th className="text-right">การจัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {maintenance.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <div className="font-bold text-gray-900">{plan.equipmentName}</div>
                  </td>
                  <td>
                    <div className="text-xs text-gray-800">{plan.taskDescription}</div>
                    {plan.lastHistory && (
                      <div className="text-[11px] text-gray-400 mt-0.5">ประวัติ: {plan.lastHistory}</div>
                    )}
                  </td>
                  <td className="text-xs font-medium text-gray-700">{plan.nextDueDate}</td>
                  <td className="text-xs text-gray-500">
                    {plan.frequency === 'monthly'
                      ? 'ทุกเดือน'
                      : plan.frequency === 'quarterly'
                      ? 'ทุก 3 เดือน'
                      : plan.frequency === 'yearly'
                      ? 'รายปี'
                      : 'ตามรอบ'}
                  </td>
                  <td className="text-xs text-gray-600">{plan.assignedTo || 'ทีมช่าง'}</td>
                  <td>
                    <span
                      className={`pill ${
                        plan.status === 'completed'
                          ? 'green'
                          : (plan.daysRemaining ?? 10) <= 7
                          ? 'amber'
                          : 'blue'
                      }`}
                    >
                      {plan.status === 'completed'
                        ? 'ตรวจแล้ว'
                        : (plan.daysRemaining ?? 10) <= 7
                        ? 'ครบกำหนด'
                        : 'ตามแผน'}
                    </span>
                  </td>

                  {canManage && (
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleComplete(plan)}
                          title={plan.status === 'completed' ? 'เปลี่ยนเป็นรอดำเนินการ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
                          className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                            plan.status === 'completed'
                              ? 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>

                        {isManager && (
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                            title="ลบแผน PM"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {maintenance.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-xs">
                    ยังไม่มีแผน PM ในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add PM Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">สร้างแผน Preventive Maintenance ใหม่</h3>
            <p className="text-xs text-gray-500 mb-4">กำหนดตารางตรวจเช็กอุปกรณ์เชิงป้องกันในอาคาร</p>

            <form onSubmit={handleAddPlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">ชื่อเครื่องจักร / อุปกรณ์</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เครื่องกำเนิดไฟฟ้า G-02, ชิลเลอร์ CH-01"
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">รายการที่ต้องตรวจสอบ</label>
                <textarea
                  required
                  rows={2}
                  placeholder="เช่น ตรวจระดับน้ำมันเครื่อง แรงดันน้ำมัน และเปลี่ยนไส้กรอง..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">รอบความถี่</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as PMFrequency)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="weekly">ทุกสัปดาห์</option>
                    <option value="monthly">ทุกเดือน</option>
                    <option value="quarterly">ทุก 3 เดือน</option>
                    <option value="yearly">รายปี</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">กำหนดครั้งถัดไป</label>
                  <input
                    type="text"
                    placeholder="เช่น 25 ต.ค. 2026"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ผู้รับผิดชอบ</label>
                <input
                  type="text"
                  placeholder="เช่น ทีมช่าง A, บริษัทคู่สัญญา"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="primary-btn w-full justify-center py-2.5 text-xs font-bold cursor-pointer"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกแผน PM'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
