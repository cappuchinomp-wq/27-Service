import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExpenseRecord } from '../types';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Receipt, Plus, Download, Trash2, X, Filter } from 'lucide-react';

interface HistoryExpensesViewProps {
  expenses: ExpenseRecord[];
}

export const HistoryExpensesView: React.FC<HistoryExpensesViewProps> = ({ expenses }) => {
  const { role, currentUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [equipmentOrLocation, setEquipmentOrLocation] = useState('');
  const [description, setDescription] = useState('');
  const [responsibleParty, setResponsibleParty] = useState('ทีมช่าง A');
  const [amount, setAmount] = useState<number>(5000);
  const [recurrenceText, setRecurrenceText] = useState('');
  const [date, setDate] = useState('15 ต.ค. 2026');
  const [monthFilter, setMonthFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  const canManage = role === 'manager' || role === 'technician';
  const isManager = role === 'manager';

  const totalAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentOrLocation.trim() || !description.trim() || amount < 0) return;

    try {
      setSaving(true);
      const newId = `exp-${Date.now()}`;
      const newRecord: ExpenseRecord = {
        id: newId,
        date: date || new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        equipmentOrLocation: equipmentOrLocation.trim(),
        description: description.trim(),
        responsibleParty: responsibleParty.trim(),
        amount: Number(amount),
        recurrenceText: recurrenceText.trim() || undefined,
        createdByUid: currentUser?.uid || 'user',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'expenses', newId), newRecord);
      setShowAddModal(false);
      setEquipmentOrLocation('');
      setDescription('');
      setAmount(5000);
      setRecurrenceText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'expenses');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('ยืนยันลบรายการค่าใช้จ่ายนี้?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['วันที่', 'จุด/อุปกรณ์', 'สิ่งที่ดำเนินการ', 'ผู้รับผิดชอบ', 'ค่าใช้จ่าย(บาท)', 'หมายเหตุ'];
    const rows = expenses.map((e) => [
      e.date,
      e.equipmentOrLocation,
      `"${e.description.replace(/"/g, '""')}"`,
      e.responsibleParty,
      e.amount,
      e.recurrenceText || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((row) => row.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maintenance-expenses-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">ประวัติและค่าใช้จ่าย</h2>
          <p className="text-xs text-gray-500 mt-1">
            ตรวจสอบสิ่งที่ได้ดำเนินการ ค่าใช้จ่ายซ่อมแซม และปัญหาซ้ำในแต่ละจุดของอาคาร
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="secondary-btn text-xs py-2 px-3 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> ส่งออกรายงาน
          </button>
          {canManage && (
            <button onClick={() => setShowAddModal(true)} className="primary-btn shrink-0 cursor-pointer">
              <Plus className="w-4 h-4" /> บันทึกค่าใช้จ่าย
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <span className="label">ค่าใช้จ่ายรวมทั้งหมด</span>
          <div className="metric text-gray-900">฿{totalAmount.toLocaleString()}</div>
          <span className="trend up">บันทึกแล้ว {expenses.length} รายการ</span>
        </div>

        <div className="card">
          <span className="label">ค่าใช้จ่ายเฉลี่ยต่องาน</span>
          <div className="metric text-gray-900">
            ฿{expenses.length > 0 ? Math.round(totalAmount / expenses.length).toLocaleString() : '0'}
          </div>
          <span className="trend text-gray-400">ควบคุมตามกรอบบำรุงรักษา</span>
        </div>

        <div className="card">
          <span className="label">จุดที่มีปัญหาซ้ำ</span>
          <div className="metric warn">
            {expenses.filter((e) => e.recurrenceText).length} จุด
          </div>
          <span className="trend warn">ควรพิจารณาเปลี่ยนชิ้นส่วนหลัก</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">ประวัติการซ่อมบำรุง</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white font-medium"
            >
              <option value="all">ทุกช่วงเวลา</option>
              <option value="ตุลาคม">ตุลาคม 2026</option>
              <option value="กันยายน">กันยายน 2026</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>จุด / อุปกรณ์</th>
                <th>สิ่งที่ดำเนินการ</th>
                <th>ผู้รับผิดชอบ</th>
                <th>ค่าใช้จ่าย</th>
                {isManager && <th className="text-right">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((item) => (
                <tr key={item.id}>
                  <td className="text-xs text-gray-500 whitespace-nowrap">{item.date}</td>
                  <td>
                    <div className="font-bold text-gray-900">{item.equipmentOrLocation}</div>
                    {item.recurrenceText && (
                      <span className="pill red mt-1">{item.recurrenceText}</span>
                    )}
                  </td>
                  <td className="text-xs text-gray-800 font-medium">{item.description}</td>
                  <td className="text-xs text-gray-600 whitespace-nowrap">{item.responsibleParty}</td>
                  <td className="font-bold text-gray-900 whitespace-nowrap">
                    ฿{item.amount.toLocaleString()}
                  </td>
                  {isManager && (
                    <td className="text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded cursor-pointer"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 text-xs">
                    ยังไม่มีข้อมูลประวัติและค่าใช้จ่าย
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">บันทึกค่าใช้จ่ายซ่อมแซมใหม่</h3>
            <p className="text-xs text-gray-500 mb-4">บันทึกค่าบริการ อะไหล่ หรือการซ่อมบำรุงอาคาร</p>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">วันที่ทำรายการ</label>
                  <input
                    type="text"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">จุด / เครื่องจักร / อุปกรณ์</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ปั๊มน้ำ B1, หม้อแปลงไฟฟ้า"
                  value={equipmentOrLocation}
                  onChange={(e) => setEquipmentOrLocation(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">สิ่งที่ดำเนินการ</label>
                <textarea
                  required
                  rows={2}
                  placeholder="เช่น เปลี่ยนซีลปั๊ม ตั้งค่าแรงดันใหม่ ล้างคอยล์..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ผู้รับผิดชอบ / ช่าง</label>
                  <input
                    type="text"
                    required
                    value={responsibleParty}
                    onChange={(e) => setResponsibleParty(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">หมายเหตุการเกิดซ้ำ (ถ้ามี)</label>
                  <input
                    type="text"
                    placeholder="เช่น เกิดซ้ำครั้งที่ 2"
                    value={recurrenceText}
                    onChange={(e) => setRecurrenceText(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="primary-btn w-full justify-center py-2.5 text-xs font-bold cursor-pointer"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกค่าใช้จ่าย'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
