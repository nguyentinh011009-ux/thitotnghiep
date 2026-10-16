import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { Combo, University, Major, Wish, User, GlobalSettings, WishRule, SavedForm } from '../types';

// Default initial system combos in Vietnam National High School Exam & University Admissions
export const DEFAULT_COMBOS: Combo[] = [
  { id: 'A00', subjects: ['Toán', 'Vật lý', 'Hóa học'] },
  { id: 'A01', subjects: ['Toán', 'Vật lý', 'Tiếng Anh'] },
  { id: 'B00', subjects: ['Toán', 'Hóa học', 'Sinh học'] },
  { id: 'C00', subjects: ['Ngữ văn', 'Lịch sử', 'Địa lý'] },
  { id: 'D01', subjects: ['Toán', 'Ngữ văn', 'Tiếng Anh'] },
  { id: 'D07', subjects: ['Toán', 'Hóa học', 'Tiếng Anh'] },
  { id: 'D08', subjects: ['Toán', 'Sinh học', 'Tiếng Anh'] },
  { id: 'A02', subjects: ['Toán', 'Vật lý', 'Sinh học'] },
  { id: 'B08', subjects: ['Toán', 'Sinh học', 'Tiếng Anh'] },
  { id: 'C01', subjects: ['Ngữ văn', 'Toán', 'Vật lý'] },
  { id: 'C02', subjects: ['Ngữ văn', 'Toán', 'Hóa học'] },
  { id: 'C03', subjects: ['Ngữ văn', 'Toán', 'Lịch sử'] },
  { id: 'C04', subjects: ['Ngữ văn', 'Toán', 'Địa lý'] },
  { id: 'D14', subjects: ['Ngữ văn', 'Lịch sử', 'Tiếng Anh'] },
  { id: 'D15', subjects: ['Ngữ văn', 'Địa lý', 'Tiếng Anh'] }
];

// Initial starter universities if Firestore is empty
export const DEFAULT_UNIS: University[] = [
  { id: 'QST', name: 'Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM' },
  { id: 'BKA', name: 'Đại học Bách Khoa Hà Nội' },
  { id: 'QSB', name: 'Trường Đại học Bách Khoa - ĐHQG TP.HCM' },
  { id: 'UEH', name: 'Đại học Kinh tế TP. Hồ Chí Minh' },
  { id: 'NEU', name: 'Trường Đại học Kinh tế Quốc dân' },
  { id: 'KHA', name: 'Trường Đại học Kiến trúc Hà Nội' },
  { id: 'DDK', name: 'Trường Đại học Sư phạm Kỹ thuật - ĐH Đà Nẵng' }
];

export const DEFAULT_MAJORS: Major[] = [
  { uniId: 'QST', id: '7220201', name: 'Ngôn ngữ Anh', combos: ['D01', 'D14', 'D15'] },
  { uniId: 'QST', id: '7310101', name: 'Kinh tế học', combos: ['A00', 'A01', 'D01'] },
  { uniId: 'QST', id: '7310301', name: 'Xã hội học', combos: ['C00', 'D01', 'C03'] },
  { uniId: 'QST', id: '7320101', name: 'Báo chí', combos: ['C00', 'D01', 'D14'] },
  { uniId: 'BKA', id: '7480201', name: 'Khoa học Máy tính (IT1)', combos: ['A00', 'A01'] },
  { uniId: 'BKA', id: '7480101', name: 'Khoa học Dữ liệu và AI (IT-E10)', combos: ['A00', 'A01'] },
  { uniId: 'BKA', id: '7520216', name: 'Kỹ thuật Điều khiển - Tự động hóa', combos: ['A00', 'A01'] },
  { uniId: 'QSB', id: '7480201', name: 'Khoa học Máy tính', combos: ['A00', 'A01'] },
  { uniId: 'QSB', id: '7510301', name: 'Kỹ thuật Cơ khí', combos: ['A00', 'A01'] },
  { uniId: 'UEH', id: '7340101', name: 'Quản trị Kinh doanh', combos: ['A00', 'A01', 'D01', 'D07'] },
  { uniId: 'UEH', id: '7340201', name: 'Tài chính - Ngân hàng', combos: ['A00', 'A01', 'D01', 'D07'] },
  { uniId: 'NEU', id: '7340101', name: 'Quản trị Kinh doanh', combos: ['A00', 'A01', 'D01', 'D07'] },
  { uniId: 'NEU', id: '7340201', name: 'Tài chính - Ngân hàng', combos: ['A00', 'A01', 'D01', 'D07'] }
];

// Helper to safely get from LocalStorage cache
const getCached = <T>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(`cache_${key}`);
    if (val) return JSON.parse(val);
  } catch (e) {
    // Ignore cache error
  }
  return fallback;
};

const setCached = (key: string, data: any) => {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify(data));
  } catch (e) {
    // Ignore cache error
  }
};

export const dataService = {
  // Global Settings
  async getSettings(): Promise<GlobalSettings> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        const d = snap.data();
        const res: GlobalSettings = {
          examDate: d.examDate || '2027-06-25',
          maxWishes: d.maxWishes ?? 20,
          lockWishes: !!d.lockWishes,
          rangeMin: d.rangeMin ?? 1,
          rangeMax: d.rangeMax ?? 20
        };
        setCached('settings', res);
        return res;
      }
    } catch (e) {
      console.warn('Error reading settings from Firestore:', e);
    }
    return getCached('settings', {
      examDate: '2027-06-25',
      maxWishes: 20,
      lockWishes: false,
      rangeMin: 1,
      rangeMax: 20
    });
  },

  async saveSettings(settings: GlobalSettings): Promise<void> {
    setCached('settings', settings);
    await setDoc(doc(db, 'settings', 'global'), settings);
  },

  // Combos
  async getCombos(): Promise<Combo[]> {
    try {
      const snap = await getDocs(collection(db, 'combos'));
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as Combo);
        setCached('combos', list);
        return list;
      }
    } catch (e) {
      console.warn('Error fetching combos:', e);
    }
    return getCached('combos', DEFAULT_COMBOS);
  },

  async saveCombo(combo: Combo): Promise<void> {
    const id = combo.id.toUpperCase();
    await setDoc(doc(db, 'combos', id), {
      id,
      subjects: combo.subjects
    });
    const current = getCached<Combo[]>('combos', DEFAULT_COMBOS);
    const updated = [...current.filter(c => c.id !== id), { id, subjects: combo.subjects }];
    setCached('combos', updated);
  },

  async deleteCombo(comboId: string): Promise<void> {
    const id = comboId.toUpperCase();
    await deleteDoc(doc(db, 'combos', id));
    const current = getCached<Combo[]>('combos', DEFAULT_COMBOS);
    setCached('combos', current.filter(c => c.id !== id));
  },

  // Universities
  async getUniversities(): Promise<University[]> {
    try {
      const snap = await getDocs(collection(db, 'universities'));
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as University);
        setCached('universities', list);
        return list;
      }
    } catch (e) {
      console.warn('Error fetching universities:', e);
    }
    return getCached('universities', DEFAULT_UNIS);
  },

  async saveUniversity(uni: University): Promise<void> {
    const id = uni.id.toUpperCase();
    await setDoc(doc(db, 'universities', id), {
      id,
      name: uni.name
    });
    const current = getCached<University[]>('universities', DEFAULT_UNIS);
    const updated = [...current.filter(u => u.id !== id), { id, name: uni.name }];
    setCached('universities', updated);
  },

  async deleteUniversity(uniId: string): Promise<void> {
    const id = uniId.toUpperCase();
    await deleteDoc(doc(db, 'universities', id));
    const current = getCached<University[]>('universities', DEFAULT_UNIS);
    setCached('universities', current.filter(u => u.id !== id));
  },

  // Majors
  async getMajors(uniId?: string): Promise<Major[]> {
    try {
      if (uniId) {
        const q = query(collection(db, 'majors'), where('uniId', '==', uniId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as Major);
        }
      } else {
        const snap = await getDocs(collection(db, 'majors'));
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Major);
          setCached('majors', list);
          return list;
        }
      }
    } catch (e) {
      console.warn('Error fetching majors:', e);
    }
    const all = getCached<Major[]>('majors', DEFAULT_MAJORS);
    if (uniId) {
      return all.filter(m => m.uniId === uniId);
    }
    return all;
  },

  async saveMajor(major: Major): Promise<void> {
    const docId = `${major.uniId.toUpperCase()}_${major.id}`;
    const payload = {
      uniId: major.uniId.toUpperCase(),
      id: major.id,
      name: major.name,
      combos: major.combos
    };
    await setDoc(doc(db, 'majors', docId), payload);
    const current = getCached<Major[]>('majors', DEFAULT_MAJORS);
    const updated = [...current.filter(m => !(m.uniId === major.uniId && m.id === major.id)), payload];
    setCached('majors', updated);
  },

  async deleteMajor(uniId: string, majorId: string): Promise<void> {
    const docId = `${uniId.toUpperCase()}_${majorId}`;
    await deleteDoc(doc(db, 'majors', docId));
    const current = getCached<Major[]>('majors', DEFAULT_MAJORS);
    setCached('majors', current.filter(m => !(m.uniId === uniId && m.id === majorId)));
  },

  // Student Combos
  async getStudentCombos(username: string): Promise<{ registeredCombos: string[]; selectedSubjects: string[] }> {
    try {
      const snap = await getDoc(doc(db, 'student_combos', username));
      if (snap.exists()) {
        const d = snap.data();
        const res = {
          registeredCombos: d.registeredCombos || [],
          selectedSubjects: d.selectedSubjects || []
        };
        setCached(`combos_${username}`, res);
        return res;
      }
    } catch (e) {
      console.warn('Error fetching student combos:', e);
    }
    return getCached(`combos_${username}`, { registeredCombos: [], selectedSubjects: [] });
  },

  async saveStudentCombos(username: string, registeredCombos: string[], selectedSubjects: string[]): Promise<void> {
    const data = { registeredCombos, selectedSubjects };
    setCached(`combos_${username}`, data);
    await setDoc(doc(db, 'student_combos', username), data);
  },

  // Wishes
  async getWishes(username: string): Promise<Wish[]> {
    try {
      const snap = await getDoc(doc(db, 'wishes', username));
      if (snap.exists()) {
        const list = (snap.data().wishes || []) as Wish[];
        setCached(`wishes_${username}`, list);
        return list;
      }
    } catch (e) {
      console.warn('Error fetching wishes:', e);
    }
    return getCached(`wishes_${username}`, []);
  },

  async saveWishes(username: string, wishes: Wish[]): Promise<void> {
    setCached(`wishes_${username}`, wishes);
    await setDoc(doc(db, 'wishes', username), { wishes });
  },

  // Saved Forms Archive
  async getSavedForms(username: string): Promise<SavedForm[]> {
    try {
      const q = query(collection(db, 'saved_forms'), where('studentUid', '==', username));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => {
        const data = d.data();
        let formattedDate = 'Vừa mới lưu';
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          formattedDate = data.timestamp.toDate().toLocaleString('vi-VN');
        } else if (data.createdAt) {
          formattedDate = new Date(data.createdAt).toLocaleString('vi-VN');
        }
        return {
          id: d.id,
          studentUid: data.studentUid,
          timestamp: data.timestamp,
          formattedDate,
          wishes: data.wishes || []
        };
      });
      setCached(`saved_forms_${username}`, list);
      return list;
    } catch (e) {
      console.warn('Error fetching saved forms:', e);
    }
    return getCached(`saved_forms_${username}`, []);
  },

  async archiveWishForm(username: string, wishes: Wish[]): Promise<string> {
    const docRef = await addDoc(collection(db, 'saved_forms'), {
      studentUid: username,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      wishes
    });
    return docRef.id;
  },

  // Wish Rules
  async getWishRules(uniId?: string): Promise<WishRule[]> {
    try {
      if (uniId) {
        const q = query(collection(db, 'wish_rules'), where('uniId', '==', uniId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      } else {
        const snap = await getDocs(collection(db, 'wish_rules'));
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setCached('wish_rules', list);
        return list;
      }
    } catch (e) {
      console.warn('Error fetching wish rules:', e);
    }
    const all = getCached<WishRule[]>('wish_rules', []);
    if (uniId) return all.filter(r => r.uniId === uniId);
    return all;
  },

  async saveWishRule(rule: WishRule): Promise<void> {
    await setDoc(doc(db, 'wish_rules', rule.id), rule);
    const current = getCached<WishRule[]>('wish_rules', []);
    setCached('wish_rules', [...current.filter(r => r.id !== rule.id), rule]);
  },

  async deleteWishRule(ruleId: string): Promise<void> {
    await deleteDoc(doc(db, 'wish_rules', ruleId));
    const current = getCached<WishRule[]>('wish_rules', []);
    setCached('wish_rules', current.filter(r => r.id !== ruleId));
  },

  // Users
  async getUser(username: string): Promise<User | null> {
    try {
      const snap = await getDoc(doc(db, 'users', username));
      if (snap.exists()) {
        const u = snap.data() as User;
        setCached(`user_${username}`, u);
        return u;
      }
    } catch (e) {
      console.warn('Error getting user:', e);
    }
    return getCached<User | null>(`user_${username}`, null);
  },

  async checkPhoneExists(phone: string): Promise<boolean> {
    try {
      const q = query(collection(db, 'users'), where('phone', '==', phone));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      console.warn('Error checking phone:', e);
      return false;
    }
  },

  async registerStudent(userData: User): Promise<void> {
    setCached(`user_${userData.username}`, userData);
    await setDoc(doc(db, 'users', userData.username), userData);
  },

  async updatePassword(username: string, newPass: string): Promise<void> {
    await updateDoc(doc(db, 'users', username), { password: newPass });
    const cached = getCached<User | null>(`user_${username}`, null);
    if (cached) {
      cached.password = newPass;
      setCached(`user_${username}`, cached);
    }
  },

  // Admin Student Operations
  async getAllStudents(): Promise<User[]> {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => d.data() as User);
      setCached('all_students', list);
      return list;
    } catch (e) {
      console.warn('Error getting students:', e);
    }
    return getCached<User[]>('all_students', []);
  },

  async getAllWishesDocs(): Promise<{ studentUid: string; wishes: Wish[] }[]> {
    try {
      const snap = await getDocs(collection(db, 'wishes'));
      const list = snap.docs.map(d => ({
        studentUid: d.id,
        wishes: (d.data().wishes || []) as Wish[]
      }));
      setCached('all_wishes_docs', list);
      return list;
    } catch (e) {
      console.warn('Error getting wishes monitor:', e);
    }
    return getCached<{ studentUid: string; wishes: Wish[] }[]>('all_wishes_docs', []);
  },

  async countSavedForms(): Promise<number> {
    try {
      const snap = await getDocs(collection(db, 'saved_forms'));
      return snap.size;
    } catch (e) {
      return 0;
    }
  },

  async updateStudent(oldUsername: string, updatedUser: User): Promise<void> {
    if (oldUsername === updatedUser.username) {
      await updateDoc(doc(db, 'users', oldUsername), { ...updatedUser });
    } else {
      const batch = writeBatch(db);
      const [wishDoc, comboDoc, formsSnap] = await Promise.all([
        getDoc(doc(db, 'wishes', oldUsername)),
        getDoc(doc(db, 'student_combos', oldUsername)),
        getDocs(query(collection(db, 'saved_forms'), where('studentUid', '==', oldUsername)))
      ]);

      batch.set(doc(db, 'users', updatedUser.username), updatedUser);
      batch.delete(doc(db, 'users', oldUsername));

      if (wishDoc.exists()) {
        batch.set(doc(db, 'wishes', updatedUser.username), wishDoc.data());
        batch.delete(doc(db, 'wishes', oldUsername));
      }

      if (comboDoc.exists()) {
        batch.set(doc(db, 'student_combos', updatedUser.username), comboDoc.data());
        batch.delete(doc(db, 'student_combos', oldUsername));
      }

      formsSnap.forEach(d => {
        batch.update(d.ref, { studentUid: updatedUser.username });
      });

      await batch.commit();
    }
    setCached(`user_${updatedUser.username}`, updatedUser);
  },

  async deleteStudent(username: string): Promise<void> {
    const formsSnap = await getDocs(query(collection(db, 'saved_forms'), where('studentUid', '==', username)));
    const batch = writeBatch(db);
    formsSnap.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'users', username));
    batch.delete(doc(db, 'wishes', username));
    batch.delete(doc(db, 'student_combos', username));
    await batch.commit();
  },

  // Export to Excel Helpers (SheetJS)
  exportStudentsToExcel(students: User[], wishesSet: Set<string>): void {
    const rows = students.map((s, index) => ({
      STT: index + 1,
      'Họ và tên': s.fullName,
      'Tài khoản (Username)': s.username,
      'Số điện thoại': s.phone,
      'Lớp': s.class,
      'Mã học sinh': s.studentId || '',
      'Ngày sinh': s.dob || '',
      'Số CCCD': s.idCard || '',
      'Sở GD&ĐT': s.department || '',
      'Địa chỉ': s.ward ? `${s.ward}, ${s.hamlet || ''}` : '',
      'Trạng thái': wishesSet.has(s.username) ? 'Đã lưu phiếu' : 'Chưa đăng ký'
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Học sinh');
    XLSX.writeFile(workbook, `Danh_sach_hoc_sinh_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  exportWishesToExcel(
    wishesDocs: { studentUid: string; wishes: Wish[] }[],
    students: User[],
    unis: University[],
    majors: Major[]
  ): void {
    const userMap = new Map(students.map(s => [s.username, s]));
    const uniMap = new Map(unis.map(u => [u.id, u.name]));
    const majorMap = new Map(majors.map(m => [`${m.uniId}_${m.id}`, m.name]));

    const rows: any[] = [];
    wishesDocs.forEach(doc => {
      const student = userMap.get(doc.studentUid);
      const studentName = student ? student.fullName : doc.studentUid;
      const studentClass = student?.class || '';
      const phone = student?.phone || '';

      if (doc.wishes && doc.wishes.length > 0) {
        doc.wishes.forEach(w => {
          rows.push({
            'Tài khoản': doc.studentUid,
            'Họ và tên thí sinh': studentName,
            'Lớp': studentClass,
            'Số điện thoại': phone,
            'Thứ tự NV': w.order,
            'Mã trường': w.uniId,
            'Tên trường': uniMap.get(w.uniId) || w.uniName || '',
            'Mã ngành': w.majorId,
            'Tên ngành': majorMap.get(`${w.uniId}_${w.majorId}`) || w.majorName || '',
            'Tổ hợp môn': w.comboId
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nguyện vọng');
    XLSX.writeFile(workbook, `Danh_sach_nguyen_vong_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  exportUniversitiesToExcel(unis: University[]): void {
    const rows = unis.map((u, i) => ({
      STT: i + 1,
      MaTruong: u.id,
      TenTruong: u.name
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trường');
    XLSX.writeFile(workbook, `Danh_sach_truong_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  exportMajorsToExcel(majors: Major[], unis: University[]): void {
    const uniMap = new Map(unis.map(u => [u.id, u.name]));
    const rows = majors.map((m, i) => ({
      STT: i + 1,
      MaTruong: m.uniId,
      TenTruong: uniMap.get(m.uniId) || '',
      MaNganh: m.id,
      TenNganh: m.name,
      ToHop: m.combos.join(', ')
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ngành');
    XLSX.writeFile(workbook, `Danh_sach_nganh_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  exportCombosToExcel(combos: Combo[]): void {
    const rows = combos.map((c, i) => ({
      STT: i + 1,
      MaToHop: c.id,
      Mon1: c.subjects[0] || '',
      Mon2: c.subjects[1] || '',
      Mon3: c.subjects[2] || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tổ hợp');
    XLSX.writeFile(workbook, `Danh_sach_to_hop_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
};
