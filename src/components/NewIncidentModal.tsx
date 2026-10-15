import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Incident, IncidentPriority } from '../types';
import { X, AlertCircle, Sparkles } from 'lucide-react';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingIncidents: Incident[];
  onIncidentCreated: () => void;
}

const COMMON_LOCATIONS = [
  'ปั๊มน้ำชั้นใต้ดิน B1',
  'ลิฟต์โดยสาร A',
  'ลิฟต์โดยสาร B',
  'ห้องน้ำชั้น 8',
  'ระบบปรับอากาศชั้น 12',
  'เครื่องกำเนิดไฟฟ้า G-01',
  'ห้องเครื่องไฟฟ้า MDB ชั้น 1',
  'บันไดหนีไฟฝั่งทิศเหนือ'
];

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  existingIncidents,
  onIncidentCreated,
}) => {
  const { currentUser } = useAuth();
  const [location, setLocation] = useState(COMMON_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [isCustomLoc, setIsCustomLoc] = useState(false);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IncidentPriority>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeLocation = isCustomLoc ? customLocation : location;

  // Auto detect recurrence
  const recurringPast = existingIncidents.filter(
    (inc) => inc.location.trim().toLowerCase() === activeLocation.trim().toLowerCase()
  );
  const recurrenceCount = recurringPast.length;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLocation.trim()) {
      setError('กรุณาระบุจุดที่เกิดเหตุ');
      return;
    }
    if (!description.trim()) {
      setError('กรุณากรอกรายละเอียดอาการที่พบ');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newId = `inc-${Date.now()}`;
      const incidentNumber = `INC-2026-${String(existingIncidents.length + 31).padStart(4, '0')}`;
      const now = new Date();
      const targetTime = priority === 'critical' ? 'วันนี้ 18:00' : priority === 'urgent' ? 'พรุ่งนี้ 12:00' : '3 วันข้างหน้า';

      const newIncident: Incident = {
        id: newId,
        incidentNumber,
        location: activeLocation.trim(),
        title: description.slice(0, 40),
        description: description.trim(),
        priority,
        status: 'open',
        reportedByUid: currentUser?.uid || 'guest',
        reportedByName: currentUser?.displayName || 'เจ้าหน้าที่รับแจ้ง',
        targetCompletionDate: targetTime,
        recurrenceCount,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await setDoc(doc(db, 'incidents', newId), newIncident);
      onIncidentCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกแจ้งซ่อม');
      try {
        handleFirestoreError(err, OperationType.CREATE, 'incidents');
      } catch (e) {
        // Logged
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-1">แจ้งเหตุชำรุดใหม่</h2>
        <p className="text-xs text-gray-500 mb-4">ระบบจะตรวจสอบประวัติการเกิดซ้ำของจุดนี้ให้อัตโนมัติ</p>

        {recurrenceCount > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>ตรวจพบประวัติในจุดนี้:</strong> เคยเกิดเหตุแล้ว {recurrenceCount} ครั้ง (ล่าสุด: {recurringPast[0]?.title || recurringPast[0]?.description.slice(0, 30)})
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">จุดที่เกิดเหตุ</label>
            {!isCustomLoc ? (
              <select
                value={location}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomLoc(true);
                  } else {
                    setLocation(e.target.value);
                  }
                }}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {COMMON_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                <option value="__custom__">+ ระบุจุดอื่น...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์ระบุพื้นที่ เช่น ห้องประชุม 4 ชั้น 9"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="flex-1 p-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomLoc(false)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  เลือกรายการเดิม
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1.5">รายละเอียดอาการที่พบ</label>
            <textarea
              placeholder="อธิบายอาการ เสียง กลิ่น หรือความผิดปกติที่พบ..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1.5">ระดับความเร่งด่วน</label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`p-2.5 rounded-lg border text-center font-bold cursor-pointer transition-colors ${
                  priority === 'normal'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  className="sr-only"
                  checked={priority === 'normal'}
                  onChange={() => setPriority('normal')}
                />
                ปกติ
              </label>

              <label
                className={`p-2.5 rounded-lg border text-center font-bold cursor-pointer transition-colors ${
                  priority === 'urgent'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  className="sr-only"
                  checked={priority === 'urgent'}
                  onChange={() => setPriority('urgent')}
                />
                เร่งด่วน
              </label>

              <label
                className={`p-2.5 rounded-lg border text-center font-bold cursor-pointer transition-colors ${
                  priority === 'critical'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  className="sr-only"
                  checked={priority === 'critical'}
                  onChange={() => setPriority('critical')}
                />
                วิกฤต
              </label>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="primary-btn w-full justify-center py-3 text-sm font-bold shadow-md cursor-pointer"
            >
              {loading ? 'กำลังบันทึกข้อมูล...' : 'บันทึกแจ้งซ่อม'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
