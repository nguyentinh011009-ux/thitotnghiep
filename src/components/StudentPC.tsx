import React, { useState, useEffect } from 'react';
import { User, Wish, Combo, University, Major, SavedForm, GlobalSettings, PrintData } from '../types';
import { dataService, DEFAULT_COMBOS } from '../services/dataService';
import { PrintWishesModal } from './PrintWishesModal';
import { useToast } from '../context/ToastContext';
import {
  User as UserIcon,
  Layers,
  Sparkles,
  ClipboardList,
  FolderArchive,
  Save,
  Printer,
  FileText,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Search,
  CheckCircle2,
  Clock,
  Smartphone,
  LogOut,
  AlertCircle
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
  onSwitchToMobile: () => void;
}

const EXTRA_SUBJECTS = [
  'Tiếng Anh', 'Tiếng Nga', 'Tiếng Pháp', 'Tiếng Trung Quốc',
  'Tiếng Đức', 'Tiếng Nhật', 'Tiếng Hàn', 'Lịch sử',
  'Địa lý', 'Vật lý', 'Hóa học', 'Sinh học',
  'Giáo dục kinh tế và pháp luật', 'Tin học', 'Công nghệ Công nghiệp', 'Công nghệ Nông nghiệp'
];

export const StudentPC: React.FC<Props> = ({ user, onLogout, onSwitchToMobile }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'combos' | 'suggest' | 'wishes' | 'forms'>('overview');
  const [globalConfig, setGlobalConfig] = useState<GlobalSettings>({
    examDate: '2027-06-25',
    maxWishes: 20,
    lockWishes: false
  });
  const [countdownText, setCountdownText] = useState('Đang tính thời gian...');

  // Combos data
  const [allSystemCombos, setAllSystemCombos] = useState<Combo[]>([]);
  const [selectedExtraSubjects, setSelectedExtraSubjects] = useState<string[]>([]);
  const [matchedCombos, setMatchedCombos] = useState<Combo[]>([]);
  const [comboSearchQuery, setComboSearchQuery] = useState('');
  const [manualComboSelectedId, setManualComboSelectedId] = useState('');
  const [chosenCombos, setChosenCombos] = useState<string[]>([]);

  // Universities and Majors data
  const [universities, setUniversities] = useState<University[]>([]);
  const [allMajors, setAllMajors] = useState<Major[]>([]);
  const [majorNamesMap, setMajorNamesMap] = useState<Map<string, string>>(new Map());

  // Wishes data
  const [currentWishes, setCurrentWishes] = useState<Wish[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  // Wish entry form
  const [wishUniFilter, setWishUniFilter] = useState('');
  const [selectedUniId, setSelectedUniId] = useState('');
  const [wishMajorFilter, setWishMajorFilter] = useState('');
  const [selectedMajorId, setSelectedMajorId] = useState('');
  const [selectedCombosForWish, setSelectedCombosForWish] = useState<string[]>([]);

  // Suggestion tab
  const [suggestChosenCombos, setSuggestChosenCombos] = useState<string[]>([]);
  const [suggestKeyword, setSuggestKeyword] = useState('');
  const [suggestProgressStage, setSuggestProgressStage] = useState<number>(0);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [suggestedResults, setSuggestedResults] = useState<{ major: Major; uniName: string }[]>([]);
  const [suggestLocalFilter, setSuggestLocalFilter] = useState('');

  // Manage forms tab
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordMsg, setChangePasswordMsg] = useState('');

  // Print modal
  const [printData, setPrintData] = useState<PrintData | null>(null);

  // Drag and drop state
  const [dragStartIndex, setDragStartIndex] = useState<number>(-1);
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      if (!globalConfig.examDate) return;
      const target = new Date(globalConfig.examDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;
      if (diff < 0) {
        setCountdownText('Kỳ thi đã bắt đầu!');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        setCountdownText(`Còn ${days} ngày đến kỳ thi`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [globalConfig.examDate]);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [settings, combos, unis, majors, studentCombos, wishes] = await Promise.all([
          dataService.getSettings(),
          dataService.getCombos(),
          dataService.getUniversities(),
          dataService.getMajors(),
          dataService.getStudentCombos(user.username),
          dataService.getWishes(user.username)
        ]);

        setGlobalConfig(settings);
        setAllSystemCombos(combos.length > 0 ? combos : DEFAULT_COMBOS);
        setUniversities(unis);
        setAllMajors(majors);
        setChosenCombos(studentCombos.registeredCombos);
        setSelectedExtraSubjects(studentCombos.selectedSubjects);
        setSuggestChosenCombos(studentCombos.registeredCombos);

        const map = new Map<string, string>();
        majors.forEach(m => {
          map.set(`${m.uniId}_${m.id}`, m.name);
        });
        setMajorNamesMap(map);

        const resolvedWishes = wishes.map((w, index) => {
          const uni = unis.find(u => u.id === w.uniId);
          const majorName = map.get(`${w.uniId}_${w.majorId}`) || w.majorName || w.majorId;
          return {
            ...w,
            order: index + 1,
            uniName: uni?.name || w.uniName || '',
            majorName
          };
        });
        setCurrentWishes(resolvedWishes);
      } catch (err) {
        console.error('Lỗi khi nạp dữ liệu ban đầu:', err);
      }
    };

    loadAll();
  }, [user.username]);

  // Load saved forms when switching to forms tab
  useEffect(() => {
    if (activeTab === 'forms') {
      dataService.getSavedForms(user.username).then(setSavedForms);
    }
  }, [activeTab, user.username]);

  // Helper for combinations
  const getCombinations = (array: string[], k: number): string[][] => {
    const result: string[][] = [];
    const helper = (start: number, combo: string[]) => {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < array.length; i++) {
        combo.push(array[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    };
    helper(0, []);
    return result;
  };

  // Tab 2: Check & Find combos
  const handleCheckAndFindCombos = () => {
    if (selectedExtraSubjects.length !== 2) {
      toast.warning('Vui lòng chọn chính xác đúng 2 môn thi tự chọn bổ sung.');
      return;
    }

    const allSelected = ['Toán', 'Ngữ văn', ...selectedExtraSubjects];
    const subSets = getCombinations(allSelected, 3);
    const matched: Combo[] = [];

    allSystemCombos.forEach(sysCombo => {
      const sysSubjectsSorted = [...sysCombo.subjects].sort().join(',');
      subSets.forEach(subSet => {
        const subSetSorted = [...subSet].sort().join(',');
        if (sysSubjectsSorted === subSetSorted) {
          matched.push(sysCombo);
        }
      });
    });

    setMatchedCombos(matched);
    if (matched.length > 0) {
      toast.success(`Tìm thấy ${matched.length} tổ hợp khớp với 4 môn thi của bạn!`);
    } else {
      toast.info('Không tìm thấy tổ hợp nào phù hợp với các môn đã chọn.');
    }
  };

  const handleToggleExtraSubject = (subject: string) => {
    if (selectedExtraSubjects.includes(subject)) {
      setSelectedExtraSubjects(prev => prev.filter(s => s !== subject));
    } else {
      if (selectedExtraSubjects.length >= 2) {
        toast.warning('Chỉ được chọn tối đa đúng 2 môn bổ sung (tổng cộng 4 môn thi).');
        return;
      }
      setSelectedExtraSubjects(prev => [...prev, subject]);
    }
  };

  const handleToggleChosenCombo = (comboId: string) => {
    setChosenCombos(prev => {
      if (prev.includes(comboId)) {
        return prev.filter(id => id !== comboId);
      } else {
        return [...prev, comboId];
      }
    });
  };

  const handleSaveCombos = async () => {
    if (chosenCombos.length === 0) {
      toast.warning('Vui lòng lựa chọn ít nhất một tổ hợp xét tuyển trước khi xác nhận.');
      return;
    }
    try {
      await dataService.saveStudentCombos(user.username, chosenCombos, selectedExtraSubjects);
      setSuggestChosenCombos(chosenCombos);
      toast.success('Cập nhật đăng ký tổ hợp xét tuyển thành công!');
    } catch (err: any) {
      toast.error('Lỗi cập nhật: ' + err.message);
    }
  };

  // Validate wish position with wish_rules
  const validateWishPosition = async (uniId: string, majorId: string, targetOrder: number): Promise<boolean> => {
    try {
      const rules = await dataService.getWishRules(uniId);
      for (const rule of rules) {
        if (rule.majors.includes(majorId)) {
          if (targetOrder < rule.orderMin || targetOrder > rule.orderMax) {
            toast.warning(
              `Vi phạm quy định! Ngành ${majorId} của Trường ${uniId} chỉ được phép đặt ở thứ tự NV từ ${rule.orderMin} đến ${rule.orderMax}.`,
              'Quy định giới hạn'
            );
            return false;
          }
        }
      }
    } catch (err) {
      console.warn('Lỗi kiểm tra quy định:', err);
    }
    return true;
  };

  // Tab 4: Add wish row
  const handleAddWishRow = async () => {
    if (globalConfig.lockWishes) {
      toast.error('Hệ thống đã khóa chức năng điều chỉnh nguyện vọng.', 'Khóa tuyển sinh');
      return;
    }

    if (currentWishes.length >= globalConfig.maxWishes) {
      toast.warning(`Bạn chỉ được đăng ký tối đa ${globalConfig.maxWishes} nguyện vọng.`);
      return;
    }

    if (!selectedUniId || !selectedMajorId || selectedCombosForWish.length === 0) {
      toast.warning('Vui lòng chọn đầy đủ Trường, Ngành và ít nhất một Tổ hợp môn tương thích.');
      return;
    }

    const nextOrder = currentWishes.length + 1;
    const isValid = await validateWishPosition(selectedUniId, selectedMajorId, nextOrder);
    if (!isValid) return;

    const uniObj = universities.find(u => u.id === selectedUniId);
    const majorObj = allMajors.find(m => m.uniId === selectedUniId && m.id === selectedMajorId);
    const majorName = majorObj?.name || selectedMajorId;

    if (editingIndex >= 0) {
      const updated = [...currentWishes];
      updated[editingIndex] = {
        ...updated[editingIndex],
        uniId: selectedUniId,
        uniName: uniObj?.name || '',
        majorId: selectedMajorId,
        majorName,
        comboId: selectedCombosForWish.join(', ')
      };
      setCurrentWishes(updated);
      setEditingIndex(-1);
      toast.success('Đã cập nhật nguyện vọng!');
    } else {
      const newWish: Wish = {
        order: nextOrder,
        uniId: selectedUniId,
        uniName: uniObj?.name || '',
        majorId: selectedMajorId,
        majorName,
        comboId: selectedCombosForWish.join(', ')
      };
      setCurrentWishes(prev => [...prev, newWish]);
      toast.success(`Đã thêm Nguyện vọng ${nextOrder}!`);
    }

    setHasUnsavedChanges(true);
    setSelectedMajorId('');
    setSelectedCombosForWish([]);
  };

  const handleEditWish = (index: number) => {
    const w = currentWishes[index];
    setSelectedUniId(w.uniId);
    setSelectedMajorId(w.majorId);
    setSelectedCombosForWish(w.comboId.split(',').map(s => s.trim()));
    setEditingIndex(index);
    toast.info(`Đang sửa Nguyện vọng ${w.order}`);
  };

  const handleDeleteWish = (index: number) => {
    if (globalConfig.lockWishes) {
      toast.error('Hệ thống đã khóa điều chỉnh.');
      return;
    }
    const updated = currentWishes.filter((_, i) => i !== index).map((w, i) => ({ ...w, order: i + 1 }));
    setCurrentWishes(updated);
    setHasUnsavedChanges(true);
    if (editingIndex === index) {
      setEditingIndex(-1);
    }
    toast.info('Đã xóa nguyện vọng khỏi danh sách.');
  };

  const handleMoveWish = async (index: number, direction: -1 | 1) => {
    if (globalConfig.lockWishes) {
      toast.error('Hệ thống đã khóa.');
      return;
    }
    const target = index + direction;
    if (target < 0 || target >= currentWishes.length) return;

    const backup = [...currentWishes];
    const updated = [...currentWishes];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;

    updated.forEach((w, i) => {
      w.order = i + 1;
    });

    setCurrentWishes(updated);
    setHasUnsavedChanges(true);

    const item1 = updated[index];
    const item2 = updated[target];
    const valid1 = await validateWishPosition(item1.uniId, item1.majorId, item1.order);
    const valid2 = await validateWishPosition(item2.uniId, item2.majorId, item2.order);

    if (!valid1 || !valid2) {
      setCurrentWishes(backup);
    }
  };

  // Drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (globalConfig.lockWishes) {
      e.preventDefault();
      return;
    }
    setDragStartIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (globalConfig.lockWishes) return;
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    if (globalConfig.lockWishes) return;
    e.preventDefault();
    setDragOverIndex(-1);

    if (dragStartIndex === -1 || dragStartIndex === targetIndex) return;

    const backup = [...currentWishes];
    const updated = [...currentWishes];
    const [movedItem] = updated.splice(dragStartIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    updated.forEach((w, i) => {
      w.order = i + 1;
    });

    setCurrentWishes(updated);
    setHasUnsavedChanges(true);

    const isValid = await validateWishPosition(movedItem.uniId, movedItem.majorId, targetIndex + 1);
    if (!isValid) {
      setCurrentWishes(backup);
    }
  };

  // Save wishes to Firestore
  const handleSaveWishesToDatabase = async () => {
    try {
      await dataService.saveWishes(user.username, currentWishes);
      setHasUnsavedChanges(false);
      toast.success('Đã lưu dữ liệu nguyện vọng lên máy chủ tuyển sinh!');
    } catch (err: any) {
      toast.error('Lỗi khi lưu nguyện vọng: ' + err.message);
    }
  };

  // Archive to saved forms
  const handleArchiveWishForm = async () => {
    if (currentWishes.length === 0) {
      toast.warning('Không có nguyện vọng nào để lưu thành phiếu.');
      return;
    }
    try {
      await dataService.archiveWishForm(user.username, currentWishes);
      toast.success('Đã lưu thành công thành một Phiếu đăng ký mới!');
      setActiveTab('forms');
    } catch (err: any) {
      toast.error('Lỗi lưu trữ: ' + err.message);
    }
  };

  // Open print modal
  const handleOpenPrint = () => {
    if (currentWishes.length === 0) {
      toast.warning('Không có nguyện vọng nào để in.');
      return;
    }

    const resolvedWishes = currentWishes.map(w => {
      const uni = universities.find(u => u.id === w.uniId);
      const majorName = majorNamesMap.get(`${w.uniId}_${w.majorId}`) || w.majorName || w.majorId;
      return {
        ...w,
        uniName: uni?.name || w.uniName || '',
        majorName
      };
    });

    setPrintData({
      student: {
        fullName: user.fullName,
        class: user.class,
        studentId: user.studentId || '....................',
        phone: user.phone || '....................',
        department: user.department || '....................',
        dob: user.dob || '....................'
      },
      wishes: resolvedWishes
    });
  };

  // Suggestion search
  const handleSearchSuggestions = async () => {
    if (suggestChosenCombos.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một tổ hợp môn xét tuyển để tìm kiếm.');
      return;
    }

    setIsSearchingSuggestions(true);
    setSuggestProgressStage(1);
    await new Promise(r => setTimeout(r, 150));
    setSuggestProgressStage(2);
    await new Promise(r => setTimeout(r, 150));
    setSuggestProgressStage(3);

    const uniMap = new Map(universities.map(u => [u.id, u.name]));
    const query = suggestKeyword.toLowerCase().trim();

    const matched = allMajors.filter(m => {
      const hasCombo = m.combos.some(c => suggestChosenCombos.includes(c));
      if (!hasCombo) return false;

      if (!query) return true;
      const uName = uniMap.get(m.uniId)?.toLowerCase() || '';
      return (
        m.name.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        m.uniId.toLowerCase().includes(query) ||
        uName.includes(query)
      );
    });

    await new Promise(r => setTimeout(r, 150));
    setSuggestProgressStage(4);
    setIsSearchingSuggestions(false);

    setSuggestedResults(
      matched.map(m => ({
        major: m,
        uniName: uniMap.get(m.uniId) || m.uniId
      }))
    );
    toast.success(`Tìm thấy ${matched.length} ngành học tương thích!`);
  };

  const handleAddFromSuggestion = (major: Major, uniName: string) => {
    setSelectedUniId(major.uniId);
    setSelectedMajorId(major.id);
    const compatible = major.combos.filter(c => chosenCombos.includes(c));
    setSelectedCombosForWish(compatible.length > 0 ? [compatible[0]] : [major.combos[0]]);
    setActiveTab('wishes');
    toast.info(`Đã chọn ngành ${major.name}. Hãy kiểm tra và nhấn "Đưa vào danh sách"!`);
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.warning('Vui lòng nhập mật khẩu mới.');
      return;
    }
    try {
      await dataService.updatePassword(user.username, newPassword.trim());
      setChangePasswordMsg('Đã đổi mật khẩu thành công!');
      setNewPassword('');
      toast.success('Mật khẩu đã được cập nhật thành công!');
      setTimeout(() => setChangePasswordMsg(''), 4000);
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const filteredUnis = universities.filter(u =>
    u.id.toLowerCase().includes(wishUniFilter.toLowerCase().trim()) ||
    u.name.toLowerCase().includes(wishUniFilter.toLowerCase().trim())
  );

  const availableMajorsForSelectedUni = allMajors.filter(m => m.uniId === selectedUniId);
  const filteredMajors = availableMajorsForSelectedUni.filter(m =>
    m.id.toLowerCase().includes(wishMajorFilter.toLowerCase().trim()) ||
    m.name.toLowerCase().includes(wishMajorFilter.toLowerCase().trim())
  );

  const currentSelectedMajor = allMajors.find(m => m.uniId === selectedUniId && m.id === selectedMajorId);

  const displayedSuggestions = suggestedResults.filter(item => {
    if (!suggestLocalFilter.trim()) return true;
    const q = suggestLocalFilter.toLowerCase();
    return (
      item.major.name.toLowerCase().includes(q) ||
      item.major.id.toLowerCase().includes(q) ||
      item.uniName.toLowerCase().includes(q) ||
      item.major.uniId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-slate-100 font-sans flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-3.5 sm:p-4 flex flex-wrap justify-between items-center shadow-lg border-b border-blue-900/40 gap-3">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            className="w-10 h-10 rounded-full border-2 border-white/90 object-cover shadow-sm bg-white"
            alt="Avatar"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight">{user.fullName}</h1>
              <span className="bg-blue-600/80 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-400/40">
                Thí sinh
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Lớp: <span className="font-semibold text-white">{user.class}</span> • SĐT: {user.phone}
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-slate-900/50 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/10 text-xs sm:text-sm font-bold text-amber-300 flex items-center space-x-2 shadow-inner">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>{countdownText}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSwitchToMobile}
            title="Xem giao diện điện thoại di động"
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-white/15"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Giao diện Di động</span>
          </button>
          <button
            onClick={onLogout}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 space-y-1.5 shadow-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2.5 ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <UserIcon className="w-4 h-4 text-blue-600 shrink-0" />
            <span>1. Tổng quan hồ sơ</span>
          </button>
          <button
            onClick={() => setActiveTab('combos')}
            className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2.5 ${
              activeTab === 'combos'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>2. Đăng ký Tổ hợp môn</span>
          </button>
          <button
            onClick={() => setActiveTab('suggest')}
            className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2.5 ${
              activeTab === 'suggest'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>3. Gợi ý Nguyện vọng</span>
          </button>
          <button
            onClick={() => setActiveTab('wishes')}
            className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2.5 ${
              activeTab === 'wishes'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>4. Kê khai Nguyện vọng</span>
          </button>
          <button
            onClick={() => setActiveTab('forms')}
            className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2.5 ${
              activeTab === 'forms'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-slate-600 shrink-0" />
            <span>5. Quản lý Phiếu & MK</span>
          </button>
        </aside>

        {/* Content Tabs */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === 'overview' && (
            <section className="space-y-5 max-w-4xl">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Hồ sơ Thông tin Thí sinh</h2>
                <p className="text-xs text-slate-500 mt-0.5">Thông tin đăng ký dự thi tuyển sinh quốc gia</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="border-b pb-3 md:border-b-0">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Họ và tên thí sinh</p>
                  <p className="font-extrabold text-base text-slate-900 mt-1">{user.fullName}</p>
                </div>
                <div className="border-b pb-3 md:border-b-0">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Mã học sinh</p>
                  <p className="font-mono font-bold text-base text-blue-700 mt-1">{user.studentId || 'Chưa cập nhật'}</p>
                </div>
                <div className="border-b pb-3 md:border-b-0">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Số điện thoại</p>
                  <p className="font-semibold text-slate-800 mt-1">{user.phone} (Mã: {user.username})</p>
                </div>
                <div className="border-b pb-3 md:border-b-0">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Lớp học</p>
                  <p className="font-semibold text-slate-800 mt-1">{user.class}</p>
                </div>
                <div className="border-b pb-3 md:border-b-0">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Đơn vị (Sở GD&ĐT)</p>
                  <p className="font-semibold text-slate-800 mt-1">{user.department || 'Chưa cập nhật'}</p>
                </div>
                <div className="border-b pb-3 md:border-b-0">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Ngày sinh</p>
                  <p className="font-semibold text-slate-800 mt-1">{user.dob || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Số CCCD / Định danh</p>
                  <p className="font-semibold text-slate-800 mt-1">{user.idCard || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Địa chỉ cư trú</p>
                  <p className="font-semibold text-slate-800 mt-1">{user.ward ? `${user.ward}, ${user.hamlet || ''}` : 'Chưa cập nhật'}</p>
                </div>
              </div>

              {/* Status summary box */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xs">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-2xl shadow-sm">
                    📋
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-blue-900">Trạng thái hồ sơ đăng ký nguyện vọng</h3>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Đã chọn <strong className="text-blue-900">{chosenCombos.length}</strong> tổ hợp môn xét tuyển • Đã kê khai <strong className="text-blue-900">{currentWishes.length}</strong> nguyện vọng
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('wishes')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 active:scale-95"
                >
                  Kê khai nguyện vọng ngay
                </button>
              </div>
            </section>
          )}

          {/* TAB 2: ĐĂNG KÝ TỔ HỢP */}
          {activeTab === 'combos' && (
            <section className="space-y-4 max-w-5xl">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Đăng ký Tổ hợp xét tuyển</h2>
                <p className="text-xs text-slate-500 mt-0.5">Lựa chọn tổ hợp môn thi để hệ thống đối chiếu với các ngành đại học</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Cách 1: Tự động ghép */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                    <span className="text-blue-600 font-black">1.</span>
                    <span>Tự động ghép theo môn thi tốt nghiệp</span>
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2.5 rounded-xl font-medium">
                    * 2 môn thi bắt buộc mặc định: <strong>Toán</strong> và <strong>Ngữ văn</strong>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        Chọn thêm đúng 2 môn thi bổ sung:
                      </span>
                      <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {selectedExtraSubjects.length}/2 môn
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                      {EXTRA_SUBJECTS.map((sub) => {
                        const isChecked = selectedExtraSubjects.includes(sub);
                        return (
                          <label
                            key={sub}
                            className={`flex items-center space-x-2 text-xs p-2 rounded-xl border transition cursor-pointer ${
                              isChecked
                                ? 'bg-blue-50 border-blue-400 font-bold text-blue-800 shadow-xs'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleExtraSubject(sub)}
                              className="w-3.5 h-3.5 rounded text-blue-600"
                            />
                            <span className="truncate">{sub}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleCheckAndFindCombos}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Khớp tổ hợp hệ thống
                  </button>

                  {/* Kết quả ghép */}
                  {matchedCombos.length > 0 && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-bold text-emerald-800">
                        Tìm thấy {matchedCombos.length} tổ hợp khớp (Tích chọn để lưu vào hồ sơ):
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {matchedCombos.map(c => {
                          const isChosen = chosenCombos.includes(c.id);
                          return (
                            <label
                              key={c.id}
                              className={`flex items-center space-x-2.5 p-2 rounded-xl border text-xs cursor-pointer transition ${
                                isChosen
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChosen}
                                onChange={() => handleToggleChosenCombo(c.id)}
                                className="w-4 h-4 rounded text-emerald-600"
                              />
                              <span>
                                <strong>{c.id}</strong>: {c.subjects.join(' - ')}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cách 2: Tìm kiếm thủ công */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                    <span className="text-indigo-600 font-black">2.</span>
                    <span>Tìm kiếm & Chọn tổ hợp tự do</span>
                  </h3>

                  <div className="space-y-2.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nhập mã tổ hợp (A00, D01, C00...) hoặc tên môn:
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={comboSearchQuery}
                        onChange={(e) => setComboSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm tổ hợp..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <select
                      size={5}
                      value={manualComboSelectedId}
                      onChange={(e) => setManualComboSelectedId(e.target.value)}
                      className="w-full border border-slate-200 p-2 rounded-xl text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                    >
                      {allSystemCombos
                        .filter(c => {
                          const q = comboSearchQuery.toLowerCase();
                          return c.id.toLowerCase().includes(q) || c.subjects.some(s => s.toLowerCase().includes(q));
                        })
                        .map(c => (
                          <option key={c.id} value={c.id} className="py-1">
                            {c.id} - ({c.subjects.join(', ')})
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => {
                        if (!manualComboSelectedId) {
                          toast.warning('Vui lòng chọn một tổ hợp từ danh sách trên.');
                          return;
                        }
                        if (!chosenCombos.includes(manualComboSelectedId)) {
                          setChosenCombos(prev => [...prev, manualComboSelectedId]);
                          toast.success(`Đã thêm tổ hợp ${manualComboSelectedId}!`);
                        }
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Thêm tổ hợp này vào danh sách
                    </button>
                  </div>
                </div>
              </div>

              {/* Chosen Combos Badge Overview */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Danh sách tổ hợp bạn chọn đăng ký</h3>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                    {chosenCombos.length} tổ hợp
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 min-h-12 items-center">
                  {chosenCombos.length === 0 ? (
                    <span className="text-slate-400 text-xs italic">Chưa có tổ hợp nào được chọn...</span>
                  ) : (
                    chosenCombos.map(id => {
                      const info = allSystemCombos.find(c => c.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-full shadow-xs"
                        >
                          <span>{id} {info ? `(${info.subjects.join('-')})` : ''}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleChosenCombo(id)}
                            className="ml-2 text-blue-500 hover:text-rose-600 font-extrabold text-sm transition"
                            title="Xóa tổ hợp này"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveCombos}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm transition shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    Xác nhận Đăng ký tổ hợp
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: GỢI Ý NGUYỆN VỌNG */}
          {activeTab === 'suggest' && (
            <section className="space-y-4 max-w-5xl">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Gợi ý Nguyện vọng Phù hợp</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tìm kiếm ngành học và trường học theo tổ hợp môn thi của bạn</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Bước 1: Chọn các tổ hợp xét tuyển của bạn để tìm ngành tương thích:
                  </p>
                  {chosenCombos.length === 0 ? (
                    <p className="text-xs text-rose-500 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      Bạn chưa đăng ký tổ hợp môn nào. Hãy chuyển sang Tab 2 để đăng ký trước.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {chosenCombos.map(id => {
                        const isChecked = suggestChosenCombos.includes(id);
                        return (
                          <label
                            key={id}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                              isChecked
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSuggestChosenCombos(prev =>
                                  prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                                );
                              }}
                              className="w-3.5 h-3.5 rounded text-blue-600"
                            />
                            <span>{id}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Bước 2: Nhập từ khóa ngành hoặc trường:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={suggestKeyword}
                        onChange={(e) => setSuggestKeyword(e.target.value)}
                        placeholder="Tìm theo tên ngành, mã ngành, tên trường hoặc mã trường..."
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleSearchSuggestions}
                      disabled={isSearchingSuggestions}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                    >
                      <Search className="w-4 h-4" />
                      <span>{isSearchingSuggestions ? 'Đang tìm...' : 'Tìm ngành phù hợp'}</span>
                    </button>
                  </div>

                  {/* Quick keyword chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs text-slate-500">
                    <span className="text-[11px] font-semibold text-slate-400">Gợi ý nhanh:</span>
                    {['Công nghệ thông tin', 'Kinh tế', 'Bách Khoa', 'Sư phạm', 'Kỹ thuật'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSuggestKeyword(tag);
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-[11px] font-medium transition"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Tracker */}
              {suggestProgressStage > 0 && (
                <div className="bg-blue-50 border border-blue-200/80 p-4 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center space-x-2 border-b border-blue-200 pb-1.5">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
                    <span className="font-bold text-blue-900 uppercase text-[11px]">Tiến trình phân tích dữ liệu tuyển sinh</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className={suggestProgressStage >= 1 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {suggestProgressStage >= 1 ? '✓' : '⚪'} [Giai đoạn 1]: Khởi tạo bản đồ liên kết các Trường học & Ngành học...
                    </div>
                    <div className={suggestProgressStage >= 2 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {suggestProgressStage >= 2 ? '✓' : '⚪'} [Giai đoạn 2]: Nạp dữ liệu chỉ tiêu và mã ngành tuyển sinh...
                    </div>
                    <div className={suggestProgressStage >= 3 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {suggestProgressStage >= 3 ? '✓' : '⚪'} [Giai đoạn 3]: Đối chiếu các tổ hợp xét tuyển ({suggestChosenCombos.join(', ')})...
                    </div>
                    <div className={suggestProgressStage >= 4 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      {suggestProgressStage >= 4 ? '✓' : '⚪'} [Giai đoạn 4]: Hoàn tất! Tìm thấy {suggestedResults.length} ngành học tương thích.
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestion Results */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">
                    Kết quả ngành học đề xuất ({displayedSuggestions.length} ngành)
                  </h3>
                  {suggestedResults.length > 0 && (
                    <input
                      type="text"
                      value={suggestLocalFilter}
                      onChange={(e) => setSuggestLocalFilter(e.target.value)}
                      placeholder="Lọc nhanh kết quả..."
                      className="border border-slate-200 p-1.5 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none w-full sm:w-56"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {displayedSuggestions.length === 0 ? (
                    <div className="col-span-2 text-center py-10 text-slate-400 text-xs">
                      {suggestProgressStage === 0
                        ? 'Tích chọn tổ hợp môn và nhấn "Tìm ngành phù hợp" để hiển thị gợi ý.'
                        : 'Không tìm thấy ngành nào phù hợp với bộ lọc.'}
                    </div>
                  ) : (
                    displayedSuggestions.map(({ major, uniName }) => (
                      <div
                        key={`${major.uniId}_${major.id}`}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 transition flex flex-col justify-between space-y-2 shadow-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                              {major.uniId}
                            </span>
                            <span className="text-xs font-semibold text-slate-600 truncate">{uniName}</span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 mt-1">{major.name}</h4>
                          <p className="font-mono text-[11px] text-slate-500">Mã ngành: {major.id}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {major.combos.map(c => {
                              const matches = chosenCombos.includes(c);
                              return (
                                <span
                                  key={c}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    matches ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {c}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddFromSuggestion(major, uniName)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-xl transition shadow-xs mt-2"
                        >
                          + Chọn đăng ký ngành này
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: ĐĂNG KÝ NGUYỆN VỌNG */}
          {activeTab === 'wishes' && (
            <section className="space-y-5 max-w-6xl">
              {/* Action Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs gap-4">
                <div className="flex items-center space-x-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Kê khai Nguyện vọng Xét tuyển</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thứ tự ưu tiên: Nguyện vọng 1 là ưu tiên cao nhất khi xét tuyển
                    </p>
                  </div>
                  {hasUnsavedChanges && (
                    <span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse border border-amber-200">
                      ⚠️ Có thay đổi chưa lưu
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSaveWishesToDatabase}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Nguyện Vọng</span>
                  </button>
                  <button
                    onClick={handleOpenPrint}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border border-slate-200"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In Phiếu Đăng Ký</span>
                  </button>
                  <button
                    onClick={handleArchiveWishForm}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border border-emerald-200"
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>Lưu thành Phiếu</span>
                  </button>
                </div>
              </div>

              {/* Form & Table Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Left Form */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 xl:col-span-1">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <span className="text-blue-600 font-black">{editingIndex >= 0 ? '✏️' : '✨'}</span>
                      <span>{editingIndex >= 0 ? 'Chỉnh sửa Nguyện vọng' : 'Thêm Nguyện vọng mới'}</span>
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {/* Step 1: Uni */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Bước 1: Tìm & Chọn Trường
                      </label>
                      <input
                        type="text"
                        value={wishUniFilter}
                        onChange={(e) => setWishUniFilter(e.target.value)}
                        placeholder="Tìm theo mã hoặc tên trường..."
                        className="w-full border border-slate-200 p-2 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-none mb-1.5 bg-slate-50"
                      />
                      <select
                        value={selectedUniId}
                        onChange={(e) => {
                          setSelectedUniId(e.target.value);
                          setSelectedMajorId('');
                          setSelectedCombosForWish([]);
                        }}
                        className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- Chọn trường đại học ({filteredUnis.length}) --</option>
                        {filteredUnis.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.id} - {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step 2: Major */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Bước 2: Tìm & Chọn Ngành
                      </label>
                      <input
                        type="text"
                        value={wishMajorFilter}
                        onChange={(e) => setWishMajorFilter(e.target.value)}
                        placeholder="Tìm theo mã hoặc tên ngành..."
                        className="w-full border border-slate-200 p-2 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-none mb-1.5 bg-slate-50"
                      />
                      <select
                        value={selectedMajorId}
                        onChange={(e) => {
                          const mId = e.target.value;
                          setSelectedMajorId(mId);
                          const mObj = allMajors.find(m => m.uniId === selectedUniId && m.id === mId);
                          if (mObj && mObj.combos.length > 0) {
                            setSelectedCombosForWish([mObj.combos[0]]);
                          } else {
                            setSelectedCombosForWish([]);
                          }
                        }}
                        className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- Chọn ngành học ({filteredMajors.length}) --</option>
                        {filteredMajors.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.id} - {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step 3: Combos */}
                    {currentSelectedMajor && (
                      <div className="space-y-1.5 pt-2 border-t">
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Bước 3: Chọn Tổ hợp môn xét tuyển
                        </label>
                        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                          {currentSelectedMajor.combos.map(c => {
                            const isChecked = selectedCombosForWish.includes(c);
                            return (
                              <label
                                key={c}
                                className={`text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer border transition ${
                                  isChecked
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedCombosForWish(prev =>
                                      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                                    );
                                  }}
                                  className="sr-only"
                                />
                                <span>{c}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleAddWishRow}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 active:scale-95"
                    >
                      {editingIndex >= 0 ? 'Cập nhật Nguyện vọng' : 'Đưa vào danh sách'}
                    </button>
                    {editingIndex >= 0 && (
                      <button
                        onClick={() => {
                          setEditingIndex(-1);
                          setSelectedMajorId('');
                          setSelectedCombosForWish([]);
                        }}
                        className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-xs font-semibold"
                      >
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Wishes Table */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs xl:col-span-2 flex flex-col">
                  <div className="border-b pb-3 mb-3 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm">Thứ tự nguyện vọng đã kê khai</h3>
                    <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                      {currentWishes.length} / {globalConfig.maxWishes} Nguyện vọng
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b">
                          <th className="p-3 text-center w-8"></th>
                          <th className="p-3 text-center w-12">Thứ tự</th>
                          <th className="p-3 text-center w-20">Mã Trường</th>
                          <th className="p-3 text-left">Tên Trường</th>
                          <th className="p-3 text-left">Ngành xét tuyển</th>
                          <th className="p-3 text-left w-24">Tổ hợp môn</th>
                          <th className="p-3 text-center w-32">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {currentWishes.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-10 text-center text-slate-400 text-xs">
                              Chưa có nguyện vọng nào. Vui lòng chọn trường và ngành ở bảng bên trái để thêm.
                            </td>
                          </tr>
                        ) : (
                          currentWishes.map((w, index) => {
                            const uni = universities.find(u => u.id === w.uniId);
                            const isBeingDraggedOver = dragOverIndex === index;
                            return (
                              <tr
                                key={index}
                                draggable={!globalConfig.lockWishes}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                className={`border-b transition select-none ${
                                  isBeingDraggedOver ? 'border-t-2 border-t-blue-500 bg-blue-50/50' : 'hover:bg-blue-50/20'
                                }`}
                              >
                                <td className="p-3 text-center text-slate-400 cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4 mx-auto" />
                                </td>
                                <td className="p-3 text-center">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                                    {w.order}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-slate-700">
                                  {w.uniId}
                                </td>
                                <td className="p-3 font-medium text-slate-800 max-w-[180px] break-words">
                                  {uni?.name || w.uniName || w.uniId}
                                </td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-900">{w.majorName || w.majorId}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">Mã: {w.majorId}</div>
                                </td>
                                <td className="p-3 font-semibold text-emerald-700">
                                  {w.comboId}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="inline-flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                                    <button
                                      onClick={() => handleMoveWish(index, -1)}
                                      title="Di chuyển lên"
                                      disabled={index === 0}
                                      className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-20"
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveWish(index, 1)}
                                      title="Di chuyển xuống"
                                      disabled={index === currentWishes.length - 1}
                                      className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-20"
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-px h-3.5 bg-slate-200"></span>
                                    <button
                                      onClick={() => handleEditWish(index)}
                                      className="p-1 hover:bg-blue-50 text-blue-600 rounded"
                                      title="Chỉnh sửa"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteWish(index)}
                                      className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                      title="Xóa"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: QUẢN LÝ PHIẾU & ĐỔI MẬT KHẨU */}
          {activeTab === 'forms' && (
            <section className="space-y-5 max-w-4xl">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Lịch sử Phiếu Đăng Ký Đã Lưu</h2>
                <p className="text-xs text-slate-500 mt-0.5">Danh sách các bản lưu trữ nguyện vọng và đổi mật khẩu bảo mật</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                {savedForms.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">Chưa có phiếu lưu trữ nào.</p>
                ) : (
                  savedForms.map(form => (
                    <div key={form.id} className="border border-slate-200 p-4 rounded-xl bg-slate-50/70 text-xs space-y-1.5 shadow-xs">
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span className="text-blue-700">Mã Phiếu: {form.id}</span>
                        <span className="text-[11px] text-slate-500 font-normal">{form.formattedDate}</span>
                      </div>
                      <p className="text-slate-700">
                        {form.wishes.map(w => `NV ${w.order}: [${w.uniId}] ${w.majorId}`).join(', ')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Password change */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs max-w-sm space-y-3">
                <h3 className="font-bold text-sm text-rose-600">Đổi mật khẩu tài khoản</h3>
                {changePasswordMsg && (
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg">{changePasswordMsg}</p>
                )}
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:ring-1 focus:ring-rose-500"
                />
                <button
                  onClick={handleChangePassword}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Print Modal */}
      <PrintWishesModal data={printData} onClose={() => setPrintData(null)} />
    </div>
  );
};
