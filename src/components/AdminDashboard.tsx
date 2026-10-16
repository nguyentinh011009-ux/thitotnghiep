import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { User, Combo, University, Major, GlobalSettings, WishRule, Wish } from '../types';
import { dataService } from '../services/dataService';
import { PrintWishesModal } from './PrintWishesModal';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard,
  Layers,
  GraduationCap,
  BookOpen,
  Users,
  ClipboardList,
  KeyRound,
  Sliders,
  Plus,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit,
  Eye,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LogOut,
  RefreshCw
} from 'lucide-react';

interface Props {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'combos' | 'universities' | 'majors' | 'students' | 'wishes' | 'passwords' | 'display'
  >('dashboard');

  // Stats
  const [stats, setStats] = useState({
    studentsCount: 0,
    unisCount: 0,
    majorsCount: 0,
    formsCount: 0
  });

  // Entities
  const [combos, setCombos] = useState<Combo[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [wishesDocs, setWishesDocs] = useState<{ studentUid: string; wishes: Wish[] }[]>([]);
  const [wishRules, setWishRules] = useState<WishRule[]>([]);

  // Search & Filter filters
  const [searchCombo, setSearchCombo] = useState('');
  const [searchUni, setSearchUni] = useState('');
  const [searchMajor, setSearchMajor] = useState('');
  const [filterMajorUni, setFilterMajorUni] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [filterStudentStatus, setFilterStudentStatus] = useState<'all' | 'hasForm' | 'noForm'>('all');
  const [searchWishStudent, setSearchWishStudent] = useState('');
  const [filterWishUni, setFilterWishUni] = useState('');

  // Settings
  const [systemSettings, setSystemSettings] = useState<GlobalSettings>({
    examDate: '2027-06-25',
    maxWishes: 20,
    lockWishes: false
  });

  // Modals state for Combos
  const [showComboModal, setShowComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [comboFormData, setComboFormData] = useState({ id: '', m1: '', m2: '', m3: '' });

  // Modals state for Unis
  const [showUniModal, setShowUniModal] = useState(false);
  const [editingUni, setEditingUni] = useState<University | null>(null);
  const [uniFormData, setUniFormData] = useState({ id: '', name: '' });

  // Modals state for Majors
  const [showMajorModal, setShowMajorModal] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [majorFormData, setMajorFormData] = useState<{ uniId: string; id: string; name: string; combos: string[] }>({
    uniId: '',
    id: '',
    name: '',
    combos: []
  });

  // Edit Student Modal
  const [editingStudent, setEditingStudent] = useState<{
    oldUsername: string;
    fullName: string;
    username: string;
    password: string;
    class: string;
    studentId: string;
    phone: string;
    dob: string;
    department: string;
  } | null>(null);

  // View Student Details Drawer/Modal
  const [viewingStudent, setViewingStudent] = useState<{
    student: User;
    combos: string[];
    wishes: Wish[];
  } | null>(null);

  // Print modal trigger
  const [printData, setPrintData] = useState<any>(null);

  // Password Reset tab
  const [resetUsername, setResetUsername] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');

  // Rule setup
  const [ruleSearchQuery, setRuleSearchQuery] = useState('');
  const [ruleMatchedMajors, setRuleMatchedMajors] = useState<Major[]>([]);
  const [selectedRuleMajors, setSelectedRuleMajors] = useState<string[]>([]);
  const [ruleOrderMin, setRuleOrderMin] = useState<number | ''>('');
  const [ruleOrderMax, setRuleOrderMax] = useState<number | ''>('');

  // Excel Import Progress
  const [progressState, setProgressState] = useState<{
    visible: boolean;
    title: string;
    percentage: number;
    status: string;
    isError: boolean;
    errors: string[];
    isDone: boolean;
  }>({
    visible: false,
    title: '',
    percentage: 0,
    status: '',
    isError: false,
    errors: [],
    isDone: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingExcelType, setPendingExcelType] = useState<'combos' | 'universities' | 'majors' | null>(null);

  // Refresh
  const refreshAll = async () => {
    try {
      const [uList, mList, cList, sList, wList, fCount, rules, settings] = await Promise.all([
        dataService.getUniversities(),
        dataService.getMajors(),
        dataService.getCombos(),
        dataService.getAllStudents(),
        dataService.getAllWishesDocs(),
        dataService.countSavedForms(),
        dataService.getWishRules(),
        dataService.getSettings()
      ]);

      setUniversities(uList);
      setMajors(mList);
      setCombos(cList);
      setStudents(sList);
      setWishesDocs(wList);
      setWishRules(rules);
      setSystemSettings(settings);

      setStats({
        studentsCount: sList.length,
        unisCount: uList.length,
        majorsCount: mList.length,
        formsCount: fCount
      });
    } catch (err) {
      console.error('Lỗi khi nạp dữ liệu admin:', err);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Save or Update Combo
  const handleOpenAddCombo = () => {
    setEditingCombo(null);
    setComboFormData({ id: '', m1: '', m2: '', m3: '' });
    setShowComboModal(true);
  };

  const handleOpenEditCombo = (c: Combo) => {
    setEditingCombo(c);
    setComboFormData({
      id: c.id,
      m1: c.subjects[0] || '',
      m2: c.subjects[1] || '',
      m3: c.subjects[2] || ''
    });
    setShowComboModal(true);
  };

  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = comboFormData.id.trim().toUpperCase();
    const m1 = comboFormData.m1.trim();
    const m2 = comboFormData.m2.trim();
    const m3 = comboFormData.m3.trim();
    if (!id || !m1 || !m2 || !m3) {
      toast.warning('Vui lòng điền đủ mã và 3 môn thi của tổ hợp.');
      return;
    }
    try {
      await dataService.saveCombo({ id, subjects: [m1, m2, m3] });
      setShowComboModal(false);
      toast.success(`Đã lưu tổ hợp ${id}!`);
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tổ hợp ${comboId}?`)) return;
    try {
      await dataService.deleteCombo(comboId);
      toast.info(`Đã xóa tổ hợp ${comboId}`);
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  // Save or Update Uni
  const handleOpenAddUni = () => {
    setEditingUni(null);
    setUniFormData({ id: '', name: '' });
    setShowUniModal(true);
  };

  const handleOpenEditUni = (u: University) => {
    setEditingUni(u);
    setUniFormData({ id: u.id, name: u.name });
    setShowUniModal(true);
  };

  const handleSaveUni = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = uniFormData.id.trim().toUpperCase();
    const name = uniFormData.name.trim();
    if (!id || !name) {
      toast.warning('Vui lòng điền đủ mã trường và tên trường.');
      return;
    }
    try {
      await dataService.saveUniversity({ id, name });
      setShowUniModal(false);
      toast.success(`Đã lưu thông tin trường ${id}!`);
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleDeleteUni = async (uniId: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa trường ${uniId}? Các ngành thuộc trường này có thể bị ảnh hưởng.`)) return;
    try {
      await dataService.deleteUniversity(uniId);
      toast.info(`Đã xóa trường ${uniId}`);
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  // Save or Update Major
  const handleOpenAddMajor = () => {
    setEditingMajor(null);
    setMajorFormData({
      uniId: universities[0]?.id || '',
      id: '',
      name: '',
      combos: []
    });
    setShowMajorModal(true);
  };

  const handleOpenEditMajor = (m: Major) => {
    setEditingMajor(m);
    setMajorFormData({
      uniId: m.uniId,
      id: m.id,
      name: m.name,
      combos: m.combos || []
    });
    setShowMajorModal(true);
  };

  const handleSaveMajor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!majorFormData.uniId || !majorFormData.id.trim() || !majorFormData.name.trim() || majorFormData.combos.length === 0) {
      toast.warning('Vui lòng chọn trường, nhập mã, tên ngành và chọn ít nhất một tổ hợp.');
      return;
    }
    try {
      await dataService.saveMajor({
        uniId: majorFormData.uniId,
        id: majorFormData.id.trim(),
        name: majorFormData.name.trim(),
        combos: majorFormData.combos
      });
      setShowMajorModal(false);
      toast.success(`Đã lưu ngành ${majorFormData.name}!`);
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleDeleteMajor = async (uniId: string, majorId: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ngành ${majorId} của trường ${uniId}?`)) return;
    try {
      await dataService.deleteMajor(uniId, majorId);
      toast.info(`Đã xóa ngành ${majorId}`);
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  // Excel Import
  const triggerExcelInput = (type: 'combos' | 'universities' | 'majors') => {
    setPendingExcelType(type);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingExcelType) return;

    setProgressState({
      visible: true,
      title: `Đang nạp dữ liệu ${pendingExcelType} từ tệp Excel`,
      percentage: 0,
      status: 'Đang đọc nội dung tệp tin...',
      isError: false,
      errors: [],
      isDone: false
    });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          setProgressState(prev => ({
            ...prev,
            status: 'Tệp Excel không chứa hàng dữ liệu hợp lệ.',
            isError: true,
            isDone: true
          }));
          return;
        }

        const totalRows = rows.length;
        let successCount = 0;
        const errorLogs: string[] = [];

        for (let i = 0; i < totalRows; i++) {
          const row = rows[i];
          const rowNum = i + 2;

          try {
            if (pendingExcelType === 'combos') {
              const rawMa = row.MaToHop ? String(row.MaToHop).trim() : '';
              const m1 = row.Mon1 ? String(row.Mon1).trim() : '';
              const m2 = row.Mon2 ? String(row.Mon2).trim() : '';
              const m3 = row.Mon3 ? String(row.Mon3).trim() : '';

              if (!rawMa || !m1 || !m2 || !m3) {
                errorLogs.push(`Dòng ${rowNum}: Thiếu cột bắt buộc (MaToHop, Mon1, Mon2, Mon3).`);
                continue;
              }
              await dataService.saveCombo({
                id: rawMa.toUpperCase(),
                subjects: [m1, m2, m3]
              });
              successCount++;
            } else if (pendingExcelType === 'universities') {
              const rawMa = row.MaTruong ? String(row.MaTruong).trim() : '';
              const rawTen = row.TenTruong ? String(row.TenTruong).trim() : '';
              if (!rawMa || !rawTen) {
                errorLogs.push(`Dòng ${rowNum}: Thiếu dữ liệu bắt buộc (MaTruong, TenTruong).`);
                continue;
              }
              await dataService.saveUniversity({
                id: rawMa.toUpperCase(),
                name: rawTen
              });
              successCount++;
            } else if (pendingExcelType === 'majors') {
              const rawUni = row.MaTruong ? String(row.MaTruong).trim() : '';
              let rawMajorId = row.MaNganh ? String(row.MaNganh).trim() : '';
              const rawTenNganh = row.TenNganh ? String(row.TenNganh).trim() : '';
              const rawToHop = row.ToHop ? String(row.ToHop).trim() : '';

              if (!rawUni || !rawTenNganh || !rawToHop) {
                errorLogs.push(`Dòng ${rowNum}: Thiếu thông tin bắt buộc (MaTruong, TenNganh, ToHop).`);
                continue;
              }

              if (!rawMajorId) {
                let hash = 0;
                const combined = rawUni.toUpperCase() + '_' + rawTenNganh;
                for (let j = 0; j < combined.length; j++) {
                  hash = (hash << 5) - hash + combined.charCodeAt(j);
                  hash |= 0;
                }
                rawMajorId = '2027' + Math.abs(hash).toString().padEnd(6, '0').slice(0, 6);
              }

              const combosArr = rawToHop.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean);
              if (combosArr.length === 0) {
                errorLogs.push(`Dòng ${rowNum}: Danh sách tổ hợp không hợp lệ.`);
                continue;
              }

              await dataService.saveMajor({
                uniId: rawUni.toUpperCase(),
                id: rawMajorId,
                name: rawTenNganh,
                combos: combosArr
              });
              successCount++;
            }
          } catch (err: any) {
            errorLogs.push(`Dòng ${rowNum}: Lỗi máy chủ (${err.message}).`);
          }

          const percent = Math.round(((i + 1) / totalRows) * 100);
          setProgressState(prev => ({
            ...prev,
            percentage: percent,
            status: `Đang xử lý dòng ${i + 1}/${totalRows} (${percent}%)`
          }));
        }

        setProgressState(prev => ({
          ...prev,
          percentage: 100,
          status: errorLogs.length > 0
            ? `Hoàn tất. Thành công: ${successCount}/${totalRows}, Lỗi: ${errorLogs.length}`
            : `Thành công! Đã xử lý toàn bộ ${successCount} dòng dữ liệu.`,
          isError: errorLogs.length > 0,
          errors: errorLogs,
          isDone: true
        }));

        toast.success(`Đã xử lý xong tệp Excel (${successCount} dòng thành công)`);
        refreshAll();
      } catch (err: any) {
        setProgressState(prev => ({
          ...prev,
          status: 'Lỗi cấu trúc tệp tin: ' + err.message,
          isError: true,
          isDone: true
        }));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // View student full details
  const handleViewStudentDetails = async (s: User) => {
    try {
      const [combosDoc, wishesList] = await Promise.all([
        dataService.getStudentCombos(s.username),
        dataService.getWishes(s.username)
      ]);
      const uniMap = new Map(universities.map(u => [u.id, u.name]));
      const majorMap = new Map(majors.map(m => [`${m.uniId}_${m.id}`, m.name]));

      const resolvedWishes = wishesList.map(w => ({
        ...w,
        uniName: uniMap.get(w.uniId) || w.uniName || '',
        majorName: majorMap.get(`${w.uniId}_${w.majorId}`) || w.majorName || w.majorId
      }));

      setViewingStudent({
        student: s,
        combos: combosDoc.registeredCombos,
        wishes: resolvedWishes
      });
    } catch (err) {
      toast.error('Không thể nạp chi tiết học sinh.');
    }
  };

  const handlePrintStudentFormFromAdmin = (s: User, wishes: Wish[]) => {
    setPrintData({
      student: {
        fullName: s.fullName,
        class: s.class,
        studentId: s.studentId || '....................',
        phone: s.phone || '....................',
        department: s.department || '....................',
        dob: s.dob || '....................'
      },
      wishes: wishes
    });
  };

  // Edit Student
  const handleOpenEditStudent = (s: User) => {
    setEditingStudent({
      oldUsername: s.username,
      fullName: s.fullName,
      username: s.username,
      password: s.password || '',
      class: s.class,
      studentId: s.studentId || '',
      phone: s.phone || '',
      dob: s.dob || '',
      department: s.department || ''
    });
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const { oldUsername, fullName, username, password, class: studentClass, phone, dob, department } = editingStudent;

    if (!fullName || !username || !password) {
      toast.warning('Vui lòng điền đủ họ tên, tên tài khoản và mật khẩu.');
      return;
    }

    try {
      const updatedUser: User = {
        username: username.trim(),
        password: password.trim(),
        fullName: fullName.trim(),
        class: studentClass.trim(),
        studentId: editingStudent.studentId.trim(),
        phone: phone.trim(),
        dob: dob.trim(),
        department: department.trim(),
        role: 'student'
      };

      await dataService.updateStudent(oldUsername, updatedUser);
      toast.success('Cập nhật thông tin học sinh thành công!');
      setEditingStudent(null);
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi khi cập nhật học sinh: ' + err.message);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (username: string) => {
    const ok = window.confirm(
      `Bạn có chắc chắn muốn xóa học sinh ${username}? Hành động này sẽ xóa hoàn toàn tài khoản, các nguyện vọng và phiếu đã lưu liên quan.`
    );
    if (!ok) return;

    try {
      await dataService.deleteStudent(username);
      toast.success('Đã xóa thành công học sinh!');
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  // Password reset by admin
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUsername.trim() || !resetNewPass.trim()) {
      toast.warning('Vui lòng điền đầy đủ tên tài khoản và mật khẩu mới.');
      return;
    }

    try {
      const u = await dataService.getUser(resetUsername.trim());
      if (!u) {
        toast.error('Không tìm thấy tài khoản học sinh này.');
        return;
      }
      await dataService.updatePassword(resetUsername.trim(), resetNewPass.trim());
      toast.success(`Đã cập nhật mật khẩu mới cho ${resetUsername}!`);
      setResetUsername('');
      setResetNewPass('');
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  // Save System Settings
  const handleSaveSettings = async () => {
    try {
      await dataService.saveSettings(systemSettings);
      toast.success('Cấu hình hệ thống đã được cập nhật thành công!');
    } catch (err: any) {
      toast.error('Lỗi lưu cấu hình: ' + err.message);
    }
  };

  // Search rule majors
  const handleSearchRuleMajors = () => {
    if (!ruleSearchQuery.trim()) {
      toast.warning('Vui lòng nhập từ khóa tìm kiếm.');
      return;
    }
    const q = ruleSearchQuery.toLowerCase().trim();
    const filtered = majors.filter(m =>
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.uniId.toLowerCase().includes(q)
    );
    setRuleMatchedMajors(filtered);
    toast.info(`Tìm thấy ${filtered.length} ngành học.`);
  };

  // Create Wish Rule
  const handleCreateWishRule = async () => {
    if (selectedRuleMajors.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một ngành áp dụng.');
      return;
    }
    const min = typeof ruleOrderMin === 'number' ? ruleOrderMin : parseInt(ruleOrderMin);
    const max = typeof ruleOrderMax === 'number' ? ruleOrderMax : parseInt(ruleOrderMax);

    if (isNaN(min) || isNaN(max) || min < 1 || max < min) {
      toast.warning('Vui lòng cấu hình phạm vi thứ tự hợp lệ (Min <= Max).');
      return;
    }

    const grouped: { [uniId: string]: string[] } = {};
    selectedRuleMajors.forEach(item => {
      const [uId, mId] = item.split('|');
      if (!grouped[uId]) grouped[uId] = [];
      grouped[uId].push(mId);
    });

    try {
      const promises = Object.keys(grouped).map(uId => {
        const ruleId = `${uId}_rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        return dataService.saveWishRule({
          id: ruleId,
          uniId: uId,
          majors: grouped[uId],
          orderMin: min,
          orderMax: max
        });
      });

      await Promise.all(promises);
      toast.success('Đã thiết lập luật giới hạn thứ tự thành công!');
      setSelectedRuleMajors([]);
      setRuleMatchedMajors([]);
      setRuleSearchQuery('');
      setRuleOrderMin('');
      setRuleOrderMax('');
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa quy định giới hạn này?')) return;
    try {
      await dataService.deleteWishRule(ruleId);
      toast.info('Đã xóa quy định giới hạn.');
      refreshAll();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const wishesSet = new Set(wishesDocs.filter(d => d.wishes && d.wishes.length > 0).map(d => d.studentUid));

  // Filtered lists
  const displayedCombos = combos.filter(c => {
    if (!searchCombo.trim()) return true;
    const q = searchCombo.toLowerCase();
    return c.id.toLowerCase().includes(q) || c.subjects.some(s => s.toLowerCase().includes(q));
  });

  const displayedUnis = universities.filter(u => {
    if (!searchUni.trim()) return true;
    const q = searchUni.toLowerCase();
    return u.id.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  });

  const displayedMajors = majors.filter(m => {
    if (filterMajorUni && m.uniId !== filterMajorUni) return false;
    if (!searchMajor.trim()) return true;
    const q = searchMajor.toLowerCase();
    return m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.uniId.toLowerCase().includes(q);
  });

  const displayedStudents = students.filter(s => {
    const hasForm = wishesSet.has(s.username);
    if (filterStudentStatus === 'hasForm' && !hasForm) return false;
    if (filterStudentStatus === 'noForm' && hasForm) return false;
    if (!searchStudent.trim()) return true;
    const q = searchStudent.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.class.toLowerCase().includes(q)
    );
  });

  const displayedWishesDocs = wishesDocs.filter(doc => {
    if (filterWishUni) {
      const hasUni = doc.wishes.some(w => w.uniId === filterWishUni);
      if (!hasUni) return false;
    }
    if (!searchWishStudent.trim()) return true;
    const q = searchWishStudent.toLowerCase();
    const st = students.find(s => s.username === doc.studentUid);
    return (
      doc.studentUid.toLowerCase().includes(q) ||
      (st && st.fullName.toLowerCase().includes(q)) ||
      (st && st.class.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-slate-100 font-sans flex flex-col min-h-screen">
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleExcelFileChange}
      />

      {/* Top Header */}
      <header className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-3.5 sm:p-4 flex justify-between items-center shadow-lg border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-xl shadow-md">
            🏛️
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight">
              HỆ THỐNG QUẢN TRỊ TUYỂN SINH
            </h1>
            <p className="text-[11px] text-slate-400">Trang điều hành & Giám sát dữ liệu thi tốt nghiệp THPT</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={refreshAll}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar Nav */}
        <nav className="w-full md:w-64 bg-white border-r border-slate-200 space-y-1 p-3 sm:p-4 shadow-xs shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2.5 ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
            <span>1. Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('combos')}
            className={`w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2.5 ${
              activeTab === 'combos'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>2. Quản lý Tổ hợp</span>
          </button>
          <button
            onClick={() => setActiveTab('universities')}
            className={`w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2.5 ${
              activeTab === 'universities'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>3. Quản lý Trường</span>
          </button>
          <button
            onClick={() => setActiveTab('majors')}
            className={`w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2.5 ${
              activeTab === 'majors'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span>4. Quản lý Ngành</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2.5 ${
              activeTab === 'students'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600 shrink-0" />
            <span>5. Quản lý Học sinh</span>
          </button>
          <button
            onClick={() => setActiveTab('wishes')}
            className={`w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2.5 ${
              activeTab === 'wishes'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-cyan-600 shrink-0" />
            <span>6. Theo dõi Đăng ký NV</span>
          </button>
          <button
            onClick={() => setActiveTab('passwords')}
            className={`w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2.5 ${
              activeTab === 'passwords'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <KeyRound className="w-4 h-4 text-rose-600 shrink-0" />
            <span>7. Quản lý Mật khẩu</span>
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2.5 ${
              activeTab === 'display'
                ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-600 shrink-0" />
            <span>8. Cấu hình & Giới hạn</span>
          </button>
        </nav>

        {/* Content Tabs */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Dashboard Tổng quan Tuyển sinh</h2>
                <p className="text-xs text-slate-500 mt-0.5">Dữ liệu thống kê thời gian thực từ hệ thống tuyển sinh</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center transform hover:scale-[1.02] transition">
                  <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                    👥
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Học sinh đăng ký</p>
                  <p className="text-3xl font-black text-blue-800 mt-1">{stats.studentsCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center transform hover:scale-[1.02] transition">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                    🏫
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Trường Đại học</p>
                  <p className="text-3xl font-black text-emerald-800 mt-1">{stats.unisCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center transform hover:scale-[1.02] transition">
                  <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                    🎓
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ngành đào tạo</p>
                  <p className="text-3xl font-black text-amber-800 mt-1">{stats.majorsCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center transform hover:scale-[1.02] transition">
                  <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                    📄
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Phiếu lưu trữ</p>
                  <p className="text-3xl font-black text-purple-800 mt-1">{stats.formsCount}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Xuất Báo Cáo Excel Nhanh</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => dataService.exportStudentsToExcel(students, wishesSet)}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất Danh Sách Học Sinh (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => dataService.exportWishesToExcel(wishesDocs, students, universities, majors)}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất Toàn Bộ Nguyện Vọng (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => dataService.exportMajorsToExcel(majors, universities)}
                    className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất Danh Mục Ngành & Tổ Hợp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ TỔ HỢP */}
          {activeTab === 'combos' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Quản lý Tổ hợp xét tuyển</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Danh mục {combos.length} tổ hợp môn xét tuyển hệ thống</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => dataService.exportCombosToExcel(combos)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất Excel</span>
                  </button>
                  <button
                    onClick={() => triggerExcelInput('combos')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Nhập Excel</span>
                  </button>
                  <button
                    onClick={handleOpenAddCombo}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm tổ hợp</span>
                  </button>
                </div>
              </div>

              {/* Filter */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  value={searchCombo}
                  onChange={(e) => setSearchCombo(e.target.value)}
                  placeholder="Tìm theo mã tổ hợp (A00, D01...) hoặc tên môn học..."
                  className="w-full text-xs outline-none bg-transparent"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto bg-white rounded-2xl shadow-xs border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b">
                    <tr>
                      <th className="p-3 w-28">Mã tổ hợp</th>
                      <th className="p-3">Môn 1</th>
                      <th className="p-3">Môn 2</th>
                      <th className="p-3">Môn 3</th>
                      <th className="p-3 text-center w-28">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedCombos.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-mono font-bold text-blue-800">{c.id}</td>
                        <td className="p-3 font-medium text-slate-800">{c.subjects[0] || ''}</td>
                        <td className="p-3 font-medium text-slate-800">{c.subjects[1] || ''}</td>
                        <td className="p-3 font-medium text-slate-800">{c.subjects[2] || ''}</td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => handleOpenEditCombo(c)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Sửa"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCombo(c.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: QUẢN LÝ TRƯỜNG */}
          {activeTab === 'universities' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Quản lý Trường Đại học</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Danh mục {universities.length} trường tuyển sinh</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => dataService.exportUniversitiesToExcel(universities)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất Excel</span>
                  </button>
                  <button
                    onClick={() => triggerExcelInput('universities')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Nhập Excel</span>
                  </button>
                  <button
                    onClick={handleOpenAddUni}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm trường</span>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  value={searchUni}
                  onChange={(e) => setSearchUni(e.target.value)}
                  placeholder="Tìm theo mã trường (QST, BKA...) hoặc tên trường..."
                  className="w-full text-xs outline-none bg-transparent"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto bg-white rounded-2xl shadow-xs border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b">
                    <tr>
                      <th className="p-3 w-32">Mã trường</th>
                      <th className="p-3">Tên trường đầy đủ</th>
                      <th className="p-3 text-center w-28">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedUnis.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-mono font-bold text-blue-800">{u.id}</td>
                        <td className="p-3 font-medium text-slate-900">{u.name}</td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => handleOpenEditUni(u)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Sửa"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUni(u.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: QUẢN LÝ NGÀNH */}
          {activeTab === 'majors' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Quản lý Ngành đào tạo</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Danh mục {majors.length} ngành xét tuyển</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => dataService.exportMajorsToExcel(majors, universities)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất Excel</span>
                  </button>
                  <button
                    onClick={() => triggerExcelInput('majors')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Nhập Excel</span>
                  </button>
                  <button
                    onClick={handleOpenAddMajor}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm ngành</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center">
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    value={searchMajor}
                    onChange={(e) => setSearchMajor(e.target.value)}
                    placeholder="Tìm theo tên ngành, mã ngành..."
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
                <select
                  value={filterMajorUni}
                  onChange={(e) => setFilterMajorUni(e.target.value)}
                  className="border border-slate-200 p-1.5 rounded-lg text-xs bg-slate-50 outline-none"
                >
                  <option value="">-- Tất cả các trường --</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>[{u.id}] {u.name}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto bg-white rounded-2xl shadow-xs border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b">
                    <tr>
                      <th className="p-3 w-28">Trường</th>
                      <th className="p-3 w-32">Mã ngành</th>
                      <th className="p-3">Tên ngành</th>
                      <th className="p-3">Tổ hợp xét tuyển</th>
                      <th className="p-3 text-center w-28">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedMajors.map((m) => (
                      <tr key={`${m.uniId}_${m.id}`} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-mono font-bold text-slate-700">{m.uniId}</td>
                        <td className="p-3 font-mono font-bold text-blue-800">{m.id}</td>
                        <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                        <td className="p-3">
                          <span className="text-emerald-700 font-semibold">{m.combos.join(', ')}</span>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => handleOpenEditMajor(m)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Sửa"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMajor(m.uniId, m.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: QUẢN LÝ HỌC SINH */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Danh sách Học sinh Đăng ký</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Tổng số {students.length} học sinh trong hệ thống</p>
                </div>
                <button
                  onClick={() => dataService.exportStudentsToExcel(students, wishesSet)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Danh Sách Excel</span>
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center">
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Tìm theo họ tên, số điện thoại, tài khoản hoặc lớp..."
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filterStudentStatus}
                    onChange={(e: any) => setFilterStudentStatus(e.target.value)}
                    className="border border-slate-200 p-1.5 rounded-lg text-xs bg-slate-50 outline-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="hasForm">Đã kê khai NV</option>
                    <option value="noForm">Chưa kê khai NV</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto bg-white rounded-2xl shadow-xs border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b">
                    <tr>
                      <th className="p-3">Họ và tên</th>
                      <th className="p-3">Tài khoản</th>
                      <th className="p-3">Số điện thoại</th>
                      <th className="p-3">Lớp</th>
                      <th className="p-3">Trạng thái phiếu NV</th>
                      <th className="p-3 text-center w-36">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">Không tìm thấy học sinh nào phù hợp.</td>
                      </tr>
                    ) : (
                      displayedStudents.map((s) => {
                        const hasWishes = wishesSet.has(s.username);
                        return (
                          <tr key={s.username} className="hover:bg-slate-50/70 transition">
                            <td className="p-3 font-semibold text-slate-900">{s.fullName}</td>
                            <td className="p-3 font-mono font-bold text-blue-800">{s.username}</td>
                            <td className="p-3 text-slate-700">{s.phone}</td>
                            <td className="p-3 text-slate-700">{s.class}</td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  hasWishes ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {hasWishes ? 'Đã kê khai' : 'Chưa đăng ký'}
                              </span>
                            </td>
                            <td className="p-3 text-center space-x-1.5">
                              <button
                                onClick={() => handleViewStudentDetails(s)}
                                className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                                title="Xem chi tiết & In phiếu"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditStudent(s)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Sửa thông tin"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.username)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                title="Xóa học sinh"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: THEO DÕI ĐĂNG KÝ NV */}
          {activeTab === 'wishes' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Theo dõi Đăng ký Nguyện vọng</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Giám sát danh sách nguyện vọng của toàn bộ học sinh</p>
                </div>
                <button
                  onClick={() => dataService.exportWishesToExcel(wishesDocs, students, universities, majors)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Toàn Bộ NV (.xlsx)</span>
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center">
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    value={searchWishStudent}
                    onChange={(e) => setSearchWishStudent(e.target.value)}
                    placeholder="Tìm theo tên học sinh, tài khoản hoặc lớp..."
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
                <select
                  value={filterWishUni}
                  onChange={(e) => setFilterWishUni(e.target.value)}
                  className="border border-slate-200 p-1.5 rounded-lg text-xs bg-slate-50 outline-none"
                >
                  <option value="">-- Lọc theo trường nguyện vọng --</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>[{u.id}] {u.name}</option>
                  ))}
                </select>
              </div>

              {/* List */}
              <div className="space-y-3">
                {displayedWishesDocs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Không tìm thấy nguyện vọng nào phù hợp.</p>
                ) : (
                  displayedWishesDocs.map((doc) => {
                    const studentObj = students.find(s => s.username === doc.studentUid);
                    const studentName = studentObj ? studentObj.fullName : doc.studentUid;
                    return (
                      <div key={doc.studentUid} className="border border-slate-200 p-4 rounded-2xl bg-white shadow-xs space-y-2">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="font-extrabold text-sm text-blue-900">
                            {studentName}{' '}
                            <span className="font-mono text-xs text-slate-500 font-normal">
                              ({doc.studentUid}) • Lớp: {studentObj?.class || 'N/A'}
                            </span>
                          </h4>
                          <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                            {doc.wishes.length} nguyện vọng
                          </span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                          {doc.wishes && doc.wishes.length > 0 ? (
                            doc.wishes.map((w) => (
                              <li key={w.order}>
                                <span className="font-bold text-slate-900">Nguyện vọng {w.order}:</span> Trường{' '}
                                <span className="font-mono font-bold text-blue-700">[{w.uniId}]</span> - Ngành{' '}
                                <span className="font-mono font-bold text-blue-700">{w.majorId}</span> (Tổ hợp:{' '}
                                <span className="font-semibold text-emerald-700">{w.comboId}</span>)
                              </li>
                            ))
                          ) : (
                            <li className="italic text-slate-400">Chưa đăng ký các nguyện vọng cụ thể</li>
                          )}
                        </ul>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 7: CẤP LẠI MẬT KHẨU */}
          {activeTab === 'passwords' && (
            <div className="space-y-4 max-w-md">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Cấp lại Mật khẩu Thí sinh</h2>
                <p className="text-xs text-slate-500 mt-0.5">Đặt lại mật khẩu truy cập cho học sinh theo tài khoản</p>
              </div>

              <form onSubmit={handleResetPassword} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên tài khoản thí sinh (Username)</label>
                  <input
                    type="text"
                    required
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    placeholder="Ví dụ: TS0912345678"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới cấp</label>
                  <input
                    type="text"
                    required
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    placeholder="Nhập 6 số hoặc mật khẩu mới..."
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  Cập nhật mật khẩu ngay
                </button>
              </form>
            </div>
          )}

          {/* TAB 8: CẤU HÌNH & GIỚI HẠN */}
          {activeTab === 'display' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Cấu hình Hệ thống & Quy định Tuyển sinh</h2>
                <p className="text-xs text-slate-500 mt-0.5">Thiết lập thời gian đếm ngược, số lượng nguyện vọng và quy định ngành</p>
              </div>

              {/* 1. Basic config */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 text-xs">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 uppercase tracking-wider">
                  1. Cấu hình cơ bản
                </h3>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Ngày bắt đầu kỳ thi (Đếm ngược)</label>
                  <input
                    type="date"
                    value={systemSettings.examDate}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, examDate: e.target.value }))}
                    className="w-full border border-slate-200 p-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Số nguyện vọng tối đa được phép đăng ký</label>
                  <input
                    type="number"
                    value={systemSettings.maxWishes}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, maxWishes: parseInt(e.target.value) || 20 }))}
                    className="w-full border border-slate-200 p-2 rounded-xl text-xs"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="lockWishesChk"
                    checked={systemSettings.lockWishes}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, lockWishes: e.target.checked }))}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <label htmlFor="lockWishesChk" className="font-bold text-rose-600 cursor-pointer">
                    Khóa chức năng điều chỉnh nguyện vọng đối với tất cả học sinh
                  </label>
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-sm"
                >
                  Lưu cấu hình hệ thống
                </button>
              </div>

              {/* 2. Wish rules */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 text-xs">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 uppercase tracking-wider">
                  2. Quy định giới hạn thứ tự theo Ngành học
                </h3>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <label className="block font-bold text-slate-700">Tìm kiếm ngành học cần áp dụng giới hạn:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ruleSearchQuery}
                      onChange={(e) => setRuleSearchQuery(e.target.value)}
                      placeholder="Nhập tên hoặc mã ngành..."
                      className="flex-1 border border-slate-200 p-2 rounded-xl text-xs bg-white"
                    />
                    <button
                      onClick={handleSearchRuleMajors}
                      className="bg-blue-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs"
                    >
                      Tìm kiếm
                    </button>
                  </div>

                  {ruleMatchedMajors.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Chọn ngành áp dụng:</span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRuleMajors(ruleMatchedMajors.map(m => `${m.uniId}|${m.id}`))}
                            className="text-blue-600 font-bold underline"
                          >
                            Chọn tất cả
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRuleMajors([])}
                            className="text-slate-500 underline"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                      </div>
                      <div className="border border-slate-200 rounded-xl bg-white p-2.5 max-h-40 overflow-y-auto space-y-1">
                        {ruleMatchedMajors.map(m => {
                          const key = `${m.uniId}|${m.id}`;
                          const isChecked = selectedRuleMajors.includes(key);
                          const u = universities.find(x => x.id === m.uniId);
                          return (
                            <label key={key} className="flex items-start space-x-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer border-b text-xs">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedRuleMajors(prev =>
                                    prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
                                  );
                                }}
                                className="w-3.5 h-3.5 mt-0.5"
                              />
                              <div>
                                <p className="font-bold text-blue-800">[{m.uniId}] {u?.name}</p>
                                <p className="font-semibold text-slate-800">{m.name} ({m.id})</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <label className="block font-semibold mb-1">Thứ tự tối thiểu (Min)</label>
                      <input
                        type="number"
                        value={ruleOrderMin}
                        onChange={(e) => setRuleOrderMin(e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="Ví dụ: 1"
                        className="w-full border border-slate-200 p-2 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Thứ tự tối đa (Max)</label>
                      <input
                        type="number"
                        value={ruleOrderMax}
                        onChange={(e) => setRuleOrderMax(e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="Ví dụ: 3"
                        className="w-full border border-slate-200 p-2 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreateWishRule}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                  >
                    Tạo & Áp dụng luật giới hạn
                  </button>
                </div>

                {/* Active Rules List */}
                <div className="pt-2">
                  <p className="font-bold text-slate-700 text-xs mb-2">Các luật giới hạn hiện hành:</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {wishRules.length === 0 ? (
                      <p className="text-slate-400 italic text-xs">Hiện không có quy định giới hạn nào.</p>
                    ) : (
                      wishRules.map(rule => (
                        <div key={rule.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-blue-800">[Trường {rule.uniId}]</span> Ngành:{' '}
                            <span className="font-semibold">{rule.majors.join(', ')}</span>
                            <p className="text-rose-600 font-bold mt-0.5">Khoảng cho phép: [{rule.orderMin} - {rule.orderMax}]</p>
                          </div>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-rose-600 font-bold hover:underline ml-2"
                          >
                            Xóa
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Manual Combo Modal */}
      {showComboModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveCombo} className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-3 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-800">
              {editingCombo ? `Sửa Tổ Hợp ${editingCombo.id}` : 'Thêm Tổ Hợp Mới'}
            </h3>
            <input
              type="text"
              required
              disabled={!!editingCombo}
              placeholder="Mã tổ hợp (Ví dụ: A00)"
              value={comboFormData.id}
              onChange={(e) => setComboFormData(prev => ({ ...prev, id: e.target.value }))}
              className="w-full border border-slate-200 p-2 rounded-xl disabled:bg-slate-100 uppercase"
            />
            <input
              type="text"
              required
              placeholder="Môn học 1 (Ví dụ: Toán)"
              value={comboFormData.m1}
              onChange={(e) => setComboFormData(prev => ({ ...prev, m1: e.target.value }))}
              className="w-full border border-slate-200 p-2 rounded-xl"
            />
            <input
              type="text"
              required
              placeholder="Môn học 2 (Ví dụ: Vật lý)"
              value={comboFormData.m2}
              onChange={(e) => setComboFormData(prev => ({ ...prev, m2: e.target.value }))}
              className="w-full border border-slate-200 p-2 rounded-xl"
            />
            <input
              type="text"
              required
              placeholder="Môn học 3 (Ví dụ: Hóa học)"
              value={comboFormData.m3}
              onChange={(e) => setComboFormData(prev => ({ ...prev, m3: e.target.value }))}
              className="w-full border border-slate-200 p-2 rounded-xl"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowComboModal(false)}
                className="bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-bold">
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Uni Modal */}
      {showUniModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveUni} className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-3 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-800">
              {editingUni ? `Sửa Trường ${editingUni.id}` : 'Thêm Trường Đại Học'}
            </h3>
            <input
              type="text"
              required
              disabled={!!editingUni}
              placeholder="Mã trường (Ví dụ: QST)"
              value={uniFormData.id}
              onChange={(e) => setUniFormData(prev => ({ ...prev, id: e.target.value }))}
              className="w-full border border-slate-200 p-2 rounded-xl disabled:bg-slate-100 uppercase"
            />
            <input
              type="text"
              required
              placeholder="Tên trường đầy đủ"
              value={uniFormData.name}
              onChange={(e) => setUniFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-slate-200 p-2 rounded-xl"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUniModal(false)}
                className="bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-bold">
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Major Modal */}
      {showMajorModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveMajor} className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-3 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-800">
              {editingMajor ? `Sửa Ngành ${editingMajor.name}` : 'Thêm Ngành Học Tuyển Sinh'}
            </h3>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Thuộc trường</label>
              <select
                disabled={!!editingMajor}
                value={majorFormData.uniId}
                onChange={(e) => setMajorFormData(prev => ({ ...prev, uniId: e.target.value }))}
                className="w-full border border-slate-200 p-2 rounded-xl bg-white disabled:bg-slate-100"
              >
                {universities.map(u => (
                  <option key={u.id} value={u.id}>[{u.id}] {u.name}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              required
              disabled={!!editingMajor}
              placeholder="Mã ngành (Ví dụ: 7480201)"
              value={majorFormData.id}
              onChange={(e) => setMajorFormData(prev => ({ ...prev, id: e.target.value }))}
              className="w-full border border-slate-200 p-2 rounded-xl disabled:bg-slate-100 font-mono"
            />
            <input
              type="text"
              required
              placeholder="Tên ngành học (Ví dụ: Công nghệ thông tin)"
              value={majorFormData.name}
              onChange={(e) => setMajorFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-slate-200 p-2 rounded-xl"
            />
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tổ hợp xét tuyển ({majorFormData.combos.length} đã chọn):
              </label>
              <div className="grid grid-cols-3 gap-1.5 border border-slate-200 p-2 rounded-xl max-h-36 overflow-y-auto">
                {combos.map(c => {
                  const isChecked = majorFormData.combos.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center space-x-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setMajorFormData(prev => ({
                            ...prev,
                            combos: isChecked
                              ? prev.combos.filter(x => x !== c.id)
                              : [...prev.combos, c.id]
                          }));
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600"
                      />
                      <span>{c.id}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMajorModal(false)}
                className="bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-bold">
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudentEdit} className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-2xl space-y-3.5 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Cập Nhật Thông Tin Học Sinh</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editingStudent.fullName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  className="w-full border border-slate-200 p-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Tài khoản (Username)</label>
                <input
                  type="text"
                  required
                  value={editingStudent.username}
                  onChange={(e) => setEditingStudent({ ...editingStudent, username: e.target.value })}
                  className="w-full border border-slate-200 p-2 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Mật khẩu</label>
                <input
                  type="text"
                  required
                  value={editingStudent.password}
                  onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                  className="w-full border border-slate-200 p-2 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Lớp</label>
                <input
                  type="text"
                  value={editingStudent.class}
                  onChange={(e) => setEditingStudent({ ...editingStudent, class: e.target.value })}
                  className="w-full border border-slate-200 p-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Mã học sinh</label>
                <input
                  type="text"
                  value={editingStudent.studentId}
                  onChange={(e) => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                  className="w-full border border-slate-200 p-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Số điện thoại</label>
                <input
                  type="text"
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full border border-slate-200 p-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Ngày sinh</label>
                <input
                  type="date"
                  value={editingStudent.dob}
                  onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                  className="w-full border border-slate-200 p-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Sở GD&ĐT</label>
                <input
                  type="text"
                  value={editingStudent.department}
                  onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
                  className="w-full border border-slate-200 p-2 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-bold">
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student View Details Drawer/Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-xl w-full shadow-2xl space-y-4 text-xs border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-800">
                Hồ sơ chi tiết: {viewingStudent.student.fullName}
              </h3>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p><strong>Tài khoản:</strong> <span className="font-mono text-blue-700">{viewingStudent.student.username}</span></p>
              <p><strong>Lớp:</strong> {viewingStudent.student.class}</p>
              <p><strong>SĐT:</strong> {viewingStudent.student.phone}</p>
              <p><strong>Ngày sinh:</strong> {viewingStudent.student.dob || 'N/A'}</p>
              <p><strong>Mã HS:</strong> {viewingStudent.student.studentId || 'N/A'}</p>
              <p><strong>Sở GD&ĐT:</strong> {viewingStudent.student.department || 'N/A'}</p>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-1.5">Tổ hợp môn đăng ký ({viewingStudent.combos.length}):</p>
              <div className="flex flex-wrap gap-1">
                {viewingStudent.combos.length === 0 ? (
                  <span className="text-slate-400 italic">Chưa đăng ký tổ hợp.</span>
                ) : (
                  viewingStudent.combos.map(c => (
                    <span key={c} className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                      {c}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <p className="font-bold text-slate-800">Danh sách nguyện vọng ({viewingStudent.wishes.length}):</p>
                {viewingStudent.wishes.length > 0 && (
                  <button
                    onClick={() => handlePrintStudentFormFromAdmin(viewingStudent.student, viewingStudent.wishes)}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center space-x-1"
                  >
                    <span>🖨️ In phiếu này</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {viewingStudent.wishes.length === 0 ? (
                  <p className="text-slate-400 italic">Học sinh chưa kê khai nguyện vọng nào.</p>
                ) : (
                  viewingStudent.wishes.map(w => (
                    <div key={w.order} className="p-2 border rounded-lg bg-slate-50 flex justify-between items-center">
                      <span>
                        <strong className="text-blue-800">NV {w.order}:</strong> [{w.uniId}] {w.majorName || w.majorId}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {w.comboId}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setViewingStudent(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-1.5 rounded-xl font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Progress Modal */}
      {progressState.visible && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-4 text-xs border border-slate-200">
            <h4 className="text-base font-bold text-slate-800">{progressState.title}</h4>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 transition-all duration-200"
                style={{ width: `${progressState.percentage}%` }}
              ></div>
            </div>
            <p className={`font-semibold ${progressState.isError ? 'text-amber-600' : 'text-blue-600'}`}>
              {progressState.status}
            </p>

            {progressState.errors.length > 0 && (
              <div className="text-left bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-rose-700 max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
                <p className="font-bold border-b border-rose-200 pb-1">Chi tiết lỗi ({progressState.errors.length}):</p>
                {progressState.errors.map((err, idx) => (
                  <p key={idx}>⚠️ {err}</p>
                ))}
              </div>
            )}

            {progressState.isDone && (
              <button
                onClick={() => setProgressState(prev => ({ ...prev, visible: false }))}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs"
              >
                Đóng hộp thoại
              </button>
            )}
          </div>
        </div>
      )}

      {/* Print Modal for Admin preview */}
      <PrintWishesModal data={printData} onClose={() => setPrintData(null)} />
    </div>
  );
};
