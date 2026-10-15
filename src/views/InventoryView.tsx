import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { InventoryItem } from '../types';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Package, Plus, Minus, AlertTriangle, CheckCircle, X, Trash2 } from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory }) => {
  const { role, currentUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('คลัง A · ชั้น 1');
  const [quantity, setQuantity] = useState(10);
  const [minThreshold, setMinThreshold] = useState(5);
  const [unit, setUnit] = useState('ชิ้น');
  const [saving, setSaving] = useState(false);

  const canManage = role === 'manager' || role === 'technician';
  const isManager = role === 'manager';

  const handleAdjustQuantity = async (item: InventoryItem, delta: number) => {
    try {
      const newQty = Math.max(0, item.quantity + delta);
      const newStatus = newQty <= item.minThreshold ? 'low' : 'ok';
      const ref = doc(db, 'inventory', item.id);
      await updateDoc(ref, {
        quantity: newQty,
        status: newStatus,
        lastUpdatedBy: currentUser?.displayName || 'ช่างอาคาร',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `inventory/${item.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('ยืนยันลบรายการอะไหล่นี้?')) return;
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `inventory/${id}`);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      const newId = `inv-${Date.now()}`;
      const status = quantity <= minThreshold ? 'low' : 'ok';
      const newItem: InventoryItem = {
        id: newId,
        name: name.trim(),
        location: location.trim(),
        quantity: Number(quantity),
        minThreshold: Number(minThreshold),
        unit: unit.trim() || 'ชิ้น',
        status,
        lastUpdatedBy: currentUser?.displayName || 'ช่างอาคาร',
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'inventory', newId), newItem);
      setShowAddModal(false);
      setName('');
      setQuantity(10);
      setMinThreshold(5);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'inventory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">อะไหล่คงคลัง</h2>
          <p className="text-xs text-gray-500 mt-1">รู้ทันทีว่าอะไหล่เหลือเท่าไร และจุดไหนถึงเวลาสั่งซื้อเพื่อป้องกันงานสะดุด</p>
        </div>
        {canManage && (
          <button onClick={() => setShowAddModal(true)} className="primary-btn shrink-0 cursor-pointer">
            <Plus className="w-4 h-4" /> รับเข้าอะไหล่
          </button>
        )}
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((item) => {
          const isLow = item.quantity <= item.minThreshold;
          const ratio = Math.min(100, (item.quantity / (item.minThreshold || 1)) * 100);

          return (
            <div key={item.id} className="card relative flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                  <span className={`pill ${isLow ? 'red' : 'green'}`}>
                    {isLow ? 'ต้องสั่งซื้อ' : 'เพียงพอ'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{item.location}</p>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-gray-600">
                    คงเหลือ <strong className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity}</strong> {item.unit}
                  </span>
                  <span className="text-xs text-gray-400">จุดสั่งซื้อ {item.minThreshold} {item.unit}</span>
                </div>

                <div className="bar">
                  <span
                    style={{
                      width: `${ratio}%`,
                      backgroundColor: isLow ? '#d94b4b' : '#16865b'
                    }}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              {canManage && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAdjustQuantity(item, -1)}
                      title="เบิกใช้ -1"
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAdjustQuantity(item, 1)}
                      title="รับเข้า +1"
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAdjustQuantity(item, 5)}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold cursor-pointer"
                    >
                      +5
                    </button>
                  </div>

                  {isManager && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded cursor-pointer"
                      title="ลบรายการ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {inventory.length === 0 && (
          <div className="col-span-full card text-center py-12 text-gray-400 text-xs">
            ยังไม่มีรายการอะไหล่ในคลัง
          </div>
        )}
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
            <h3 className="text-lg font-bold text-gray-900 mb-1">รับเข้าอะไหล่ / เพิ่มรายการใหม่</h3>
            <p className="text-xs text-gray-500 mb-4">บันทึกสต็อกอะไหล่สำรองสำหรับอาคาร</p>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">ชื่ออะไหล่ / วัสดุ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ซีลยางปั๊มน้ำ 3 inch, สวิตช์อัตโนมัติ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ตำแหน่งจัดเก็บ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คลัง A · ชั้น 1, ตู้ B2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">จำนวนรับเข้า</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">จุดสั่งซื้อ (Min)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    placeholder="ชิ้น / ชุด / หลอด"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="primary-btn w-full justify-center py-2.5 text-xs font-bold cursor-pointer"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกอะไหล่คงคลัง'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
