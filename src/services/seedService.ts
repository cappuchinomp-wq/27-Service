import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export async function checkAndSeedInitialData(userUid: string, userDisplayName: string) {
  try {
    // 1. Incidents
    const incidentsSnap = await getDocs(collection(db, 'incidents'));
    if (incidentsSnap.empty) {
      const initialIncidents = [
        {
          id: 'inc-0031',
          incidentNumber: 'INC-2026-0031',
          location: 'ปั๊มน้ำชั้นใต้ดิน B1',
          title: 'แรงดันน้ำตก',
          description: 'แรงดันน้ำตกต่อเนื่อง / เคยเกิด 2 ครั้งในเดือนนี้',
          priority: 'critical',
          status: 'open',
          reportedByUid: userUid,
          reportedByName: userDisplayName || 'เจ้าหน้าที่รับแจ้ง',
          targetCompletionDate: 'วันนี้ 18:00',
          recurrenceCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'inc-0032',
          incidentNumber: 'INC-2026-0032',
          location: 'ลิฟต์โดยสาร A',
          title: 'เสียงดังผิดปกติ',
          description: 'เสียงดังเสียดสีขณะขึ้นชั้น 8 ผู้โดยสารแจ้งหลายราย',
          priority: 'urgent',
          status: 'in_progress',
          reportedByUid: userUid,
          reportedByName: userDisplayName || 'เจ้าหน้าที่รับแจ้ง',
          targetCompletionDate: '16 ต.ค. 2026',
          recurrenceCount: 1,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'inc-0033',
          incidentNumber: 'INC-2026-0033',
          location: 'แอร์ชั้น 12 โซนตะวันออก',
          title: 'น้ำแอร์หยด',
          description: 'น้ำหยดจากคอยล์เย็นลงบนฝ้าเพดาน',
          priority: 'normal',
          status: 'open',
          reportedByUid: userUid,
          reportedByName: userDisplayName || 'เจ้าหน้าที่รับแจ้ง',
          targetCompletionDate: '18 ต.ค. 2026',
          recurrenceCount: 0,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      for (const item of initialIncidents) {
        await setDoc(doc(db, 'incidents', item.id), item);
      }
    }

    // 2. Maintenance
    const maintenanceSnap = await getDocs(collection(db, 'maintenance'));
    if (maintenanceSnap.empty) {
      const initialPM = [
        {
          id: 'pm-001',
          equipmentName: 'เครื่องกำเนิดไฟฟ้า G-01',
          taskDescription: 'ตรวจเช็กประจำเดือน ตรวจระดับน้ำมันเครื่องและแบตเตอรี่',
          frequency: 'monthly',
          nextDueDate: '18 ต.ค. 2026',
          daysRemaining: 5,
          status: 'scheduled',
          assignedTo: 'ทีมช่าง A',
          lastHistory: 'เปลี่ยนไส้กรอง, น้ำมันเครื่อง',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pm-002',
          equipmentName: 'ปั๊มน้ำดับเพลิง FP-02',
          taskDescription: 'ทดสอบแรงดันและเปลี่ยนน้ำมันเครื่อง',
          frequency: 'monthly',
          nextDueDate: '20 ต.ค. 2026',
          daysRemaining: 7,
          status: 'scheduled',
          assignedTo: 'ทีมช่าง B',
          lastHistory: 'ตรวจสอบและทำความสะอาด',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pm-003',
          equipmentName: 'ลิฟต์โดยสาร A',
          taskDescription: 'ตรวจเช็กระบบเบรกและสายสลิง Monthly',
          frequency: 'monthly',
          nextDueDate: '05 พ.ย. 2026',
          daysRemaining: 23,
          status: 'scheduled',
          assignedTo: 'บริษัทคู่สัญญา (Otis)',
          lastHistory: 'เปลี่ยนลูกลอกประตู, หล่อลื่นราง',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      for (const item of initialPM) {
        await setDoc(doc(db, 'maintenance', item.id), item);
      }
    }

    // 3. Inventory
    const inventorySnap = await getDocs(collection(db, 'inventory'));
    if (inventorySnap.empty) {
      const initialInventory = [
        {
          id: 'inv-001',
          name: 'ไส้กรองอากาศ AHU-12',
          location: 'คลัง A · ชั้น 1',
          quantity: 8,
          minThreshold: 12,
          unit: 'ชิ้น',
          status: 'low',
          lastUpdatedBy: 'ช่างวิชัย',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'inv-002',
          name: 'น้ำมันเครื่อง SAE 40',
          location: 'คลัง B · B1',
          quantity: 24,
          minThreshold: 10,
          unit: 'แกลลอน',
          status: 'ok',
          lastUpdatedBy: 'ช่างมานพ',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'inv-003',
          name: 'ซีลปั๊มน้ำ 2 inch',
          location: 'คลัง A · ชั้น 1',
          quantity: 3,
          minThreshold: 5,
          unit: 'ชุด',
          status: 'low',
          lastUpdatedBy: 'ช่างวิชัย',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'inv-004',
          name: 'หลอดไฟ LED 18W',
          location: 'คลัง C · ชั้น 2',
          quantity: 46,
          minThreshold: 20,
          unit: 'หลอด',
          status: 'ok',
          lastUpdatedBy: 'ช่างวิชัย',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'inv-005',
          name: 'แบตเตอรี่สำรอง 12V',
          location: 'คลัง B · B1',
          quantity: 6,
          minThreshold: 4,
          unit: 'ลูก',
          status: 'ok',
          lastUpdatedBy: 'ช่างมานพ',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'inv-006',
          name: 'สายพานเครื่องกำเนิดไฟ',
          location: 'คลัง A · ชั้น 1',
          quantity: 1,
          minThreshold: 2,
          unit: 'เส้น',
          status: 'low',
          lastUpdatedBy: 'ช่างวิชัย',
          updatedAt: new Date().toISOString(),
        }
      ];

      for (const item of initialInventory) {
        await setDoc(doc(db, 'inventory', item.id), item);
      }
    }

    // 4. Expenses
    const expensesSnap = await getDocs(collection(db, 'expenses'));
    if (expensesSnap.empty) {
      const initialExpenses = [
        {
          id: 'exp-001',
          date: '14 ต.ค. 2026',
          equipmentOrLocation: 'ปั๊มน้ำ B1',
          description: 'เปลี่ยนซีลปั๊มและตั้งแรงดันใหม่',
          responsibleParty: 'ทีมช่าง A',
          amount: 8500,
          recurrenceText: 'เกิดซ้ำครั้งที่ 3',
          createdByUid: userUid,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp-002',
          date: '13 ต.ค. 2026',
          equipmentOrLocation: 'ลิฟต์โดยสาร A',
          description: 'เปลี่ยนลูกลอกประตู, หล่อลื่นราง',
          responsibleParty: 'บริษัทคู่สัญญา',
          amount: 12000,
          createdByUid: userUid,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'exp-003',
          date: '10 ต.ค. 2026',
          equipmentOrLocation: 'AHU ชั้น 12',
          description: 'ล้างคอยล์เย็น, เปลี่ยนไส้กรอง',
          responsibleParty: 'ทีมช่าง B',
          amount: 3250,
          createdByUid: userUid,
          createdAt: new Date(Date.now() - 345600000).toISOString(),
        }
      ];

      for (const item of initialExpenses) {
        await setDoc(doc(db, 'expenses', item.id), item);
      }
    }
  } catch (err) {
    console.error('Seeding initial data error:', err);
    // Don't throw fatal error if already seeded or permission differs
  }
}
