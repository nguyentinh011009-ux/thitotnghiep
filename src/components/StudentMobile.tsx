import React, { useState, useEffect } from 'react';
import { User, Wish, Combo, University, Major, SavedForm, GlobalSettings, PrintData } from '../types';
import { dataService, DEFAULT_COMBOS } from '../services/dataService';
import { PrintWishesModal } from './PrintWishesModal';
import { useToast } from '../context/ToastContext';
import {
  Home,
  Layers,
  ClipboardList,
  Sparkles,
  FolderArchive,
  Save,
  Printer,
  FilePlus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Monitor,
  Search,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
  onSwitchToPC: () => void;
}

const EXTRA_SUBJECTS = [
  'Tiếng Anh', 'Tiếng Nga', 'Tiếng Pháp', 'Tiếng Trung Quốc',
  'Tiếng Đức', 'Tiếng Nhật', 'Tiếng Hàn', 'Lịch sử',
  'Địa lý', 'Vật lý', 'Hóa học', 'Sinh học',
  'Giáo dục kinh tế và pháp luật', 'Tin học', 'Công nghệ Công nghiệp', 'Công nghệ Nông nghiệp'
];

export const StudentMobile: React.FC<Props> = ({ user, onLogout, onSwitchToPC }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'combos' | 'wishes' | 'suggest' | 'forms'>('overview');
  const [globalConfig, setGlobalConfig] = useState<GlobalSettings>({
    examDate: '2027-06-25',
    maxWishes: 20,
    lockWishes: false
  });
  const [countdownText, setCountdownText] = useState('Đang tính...');

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

  // Wish entry form
  const [wishUniFilter, setWishUniFilter] = useState('');
  const [selectedUniId, setSelectedUniId] = useState('');
  const [wishMajorFilter, setWishMajorFilter] = useState('');
  const [selectedMajorId, setSelectedMajorId] = useState('');
  const [selectedCombosForWish, setSelectedCombosForWish] = useState<string[]>([]);

  // Suggestion tab
  const [suggestChosenCombos, setSuggestChosenCombos] = useState<string[]>([]);
  const [suggestKeyword, setSuggestKeyword] = useState('');
  const [suggestedResults, setSuggestedResults] = useState<{ major: Major; uniName: string }[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  // Manage forms tab
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordMsg, setChangePasswordMsg] = useState('');

  // Print modal
  const [printData, setPrintData] = useState<PrintData | null>(null);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      if (!globalConfig.examDate) return;
      const target = new Date(globalConfig.examDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;
      if (diff < 0) {
        setCountdownText('Đã thi!');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        setCountdownText(`Còn ${days} ngày`);
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
          return {
            ...w,
            order: index + 1,
            uniName: uni?.name || w.uniName || '',
            majorName: map.get(`${w.uniId}_${w.majorId}`) || w.majorName || w.majorId
          };
        });
        setCurrentWishes(resolvedWishes);
      } catch (err) {
        console.error('Lỗi khi nạp dữ liệu di động:', err);
      }
    };

    loadAll();
  }, [user.username]);

  // Load saved forms
  useEffect(() => {
    if (activeTab === 'forms') {
      dataService.getSavedForms(user.username).then(setSavedForms);
    }
  }, [activeTab, user.username]);

  // Combinations
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

  const handleCheckCombos = () => {
    if (selectedExtraSubjects.length !== 2) {
      toast.warning('Vui lòng chọn chính xác đúng 2 môn thi tự chọn.');
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
      toast.success(`Tìm thấy ${matched.length} tổ hợp khớp!`);
    } else {
      toast.info('Không tìm thấy tổ hợp nào phù hợp với 4 môn thi.');
    }
  };

  const handleToggleExtraSubject = (subject: string) => {
    if (selectedExtraSubjects.includes(subject)) {
      setSelectedExtraSubjects(prev => prev.filter(s => s !== subject));
    } else {
      if (selectedExtraSubjects.length >= 2) {
        toast.warning('Chỉ được chọn tối đa đúng 2 môn thi tự chọn.');
        return;
      }
      setSelectedExtraSubjects(prev => [...prev, subject]);
    }
  };

  const handleToggleChosenCombo = (comboId: string) => {
    setChosenCombos(prev =>
      prev.includes(comboId) ? prev.filter(x => x !== comboId) : [...prev, comboId]
    );
  };

  const handleConfirmCombos = async () => {
    if (chosenCombos.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một tổ hợp xét tuyển.');
      return;
    }
    try {
      await dataService.saveStudentCombos(user.username, chosenCombos, selectedExtraSubjects);
      setSuggestChosenCombos(chosenCombos);
      toast.success('Xác nhận đăng ký tổ hợp thành công!');
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  // Validate wish position
  const validateWishPosition = async (uniId: string, majorId: string, targetOrder: number): Promise<boolean> => {
    try {
      const rules = await dataService.getWishRules(uniId);
      for (const rule of rules) {
        if (rule.majors.includes(majorId)) {
          if (targetOrder < rule.orderMin || targetOrder > rule.orderMax) {
            toast.warning(
              `Quy định: Ngành ${majorId} trường ${uniId} chỉ được đặt từ thứ tự ${rule.orderMin} đến ${rule.orderMax}.`
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

  // Add Wish
  const handleAddWish = async () => {
    if (globalConfig.lockWishes) {
      toast.error('Hệ thống đã khóa điều chỉnh.');
      return;
    }
    if (currentWishes.length >= globalConfig.maxWishes) {
      toast.warning(`Chỉ được đăng ký tối đa ${globalConfig.maxWishes} NV.`);
      return;
    }
    if (!selectedUniId || !selectedMajorId) {
      toast.warning('Vui lòng chọn trường và ngành học.');
      return;
    }

    const uniObj = universities.find(u => u.id === selectedUniId);
    const majorObj = allMajors.find(m => m.uniId === selectedUniId && m.id === selectedMajorId);
    const majorName = majorObj?.name || selectedMajorId;

    const registeredUpper = (chosenCombos || []).map(c => c.trim().toUpperCase());
    const validMatches = (majorObj?.combos || []).filter(c => registeredUpper.includes(c.trim().toUpperCase()));

    if (validMatches.length === 0) {
      toast.error(
        'Hệ thống từ chối đăng ký nguyện vọng đó vì lý do tổ hợp môn đăng ký xét tuyển chưa có tổ hợp phù hợp với nguyện vọng đang xét tuyển. Mời bạn thay đổi.'
      );
      return;
    }

    if (selectedCombosForWish.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một tổ hợp môn hợp lệ.');
      return;
    }

    const nextOrder = currentWishes.length + 1;
    const isValid = await validateWishPosition(selectedUniId, selectedMajorId, nextOrder);
    if (!isValid) return;

    const comboStr = selectedCombosForWish.join(', ');

    const newWish: Wish = {
      order: nextOrder,
      uniId: selectedUniId,
      uniName: uniObj?.name || '',
      majorId: selectedMajorId,
      majorName,
      comboId: comboStr
    };

    setCurrentWishes(prev => [...prev, newWish]);
    setHasUnsavedChanges(true);
    setSelectedMajorId('');
    toast.success(`Đã thêm NV ${nextOrder}!`);
  };

  const handleMoveWish = (index: number, direction: -1 | 1) => {
    if (globalConfig.lockWishes) {
      toast.error('Hệ thống đã khóa.');
      return;
    }
    const target = index + direction;
    if (target < 0 || target >= currentWishes.length) return;

    const updated = [...currentWishes];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    updated.forEach((w, i) => {
      w.order = i + 1;
    });

    setCurrentWishes(updated);
    setHasUnsavedChanges(true);
  };

  const handleDeleteWish = (index: number) => {
    if (globalConfig.lockWishes) {
      toast.error('Hệ thống đã khóa.');
      return;
    }
    const updated = currentWishes.filter((_, i) => i !== index).map((w, i) => ({ ...w, order: i + 1 }));
    setCurrentWishes(updated);
    setHasUnsavedChanges(true);
    toast.info('Đã xóa nguyện vọng.');
  };

  const handleSaveWishesToDatabase = async () => {
    try {
      await dataService.saveWishes(user.username, currentWishes);
      setHasUnsavedChanges(false);
      toast.success('Đã lưu danh sách nguyện vọng thành công!');
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleArchiveWishForm = async () => {
    if (currentWishes.length === 0) {
      toast.warning('Không có nguyện vọng nào để lưu.');
      return;
    }
    try {
      await dataService.archiveWishForm(user.username, currentWishes);
      toast.success('Đã lưu thành phiếu thành công!');
      setActiveTab('forms');
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleOpenPrint = () => {
    if (currentWishes.length === 0) {
      toast.warning('Không có nguyện vọng nào để in.');
      return;
    }
    const resolvedWishes = currentWishes.map(w => {
      const uni = universities.find(u => u.id === w.uniId);
      return {
        ...w,
        uniName: uni?.name || w.uniName || '',
        majorName: majorNamesMap.get(`${w.uniId}_${w.majorId}`) || w.majorName || w.majorId
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

  const handleSearchSuggestions = () => {
    if (suggestChosenCombos.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một tổ hợp môn.');
      return;
    }
    setIsSearchingSuggestions(true);
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

    setSuggestedResults(
      matched.map(m => ({
        major: m,
        uniName: uniMap.get(m.uniId) || m.uniId
      }))
    );
    setIsSearchingSuggestions(false);
    toast.success(`Tìm thấy ${matched.length} ngành học!`);
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
      toast.success('Đã cập nhật mật khẩu mới!');
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
  const registeredCombosUpper = (chosenCombos || []).map(c => c.trim().toUpperCase());
  const validMatchedCombos = currentSelectedMajor
    ? currentSelectedMajor.combos.filter(c => registeredCombosUpper.includes(c.trim().toUpperCase()))
    : [];
  const hasValidMatchedCombos = validMatchedCombos.length > 0;

  return (
    <div className="bg-slate-100 font-sans flex flex-col min-h-screen pb-20">
      {/* Mobile Sticky Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-3 flex justify-between items-center sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-2.5">
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            className="w-9 h-9 rounded-full border border-white/80 object-cover bg-white"
            alt="Avatar"
          />
          <div className="text-xs">
            <p className="font-extrabold leading-none truncate max-w-[140px] text-white">{user.fullName}</p>
            <p className="text-[10px] text-blue-200 mt-1">Lớp: {user.class} • SĐT: {user.phone}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-bold bg-slate-900/60 px-2 py-1 rounded-lg text-amber-300 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{countdownText}</span>
          </span>
          <button
            onClick={onSwitchToPC}
            className="text-[11px] bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg font-bold flex items-center space-x-1"
            title="Chuyển sang PC"
          >
            <Monitor className="w-3 h-3" />
            <span>PC</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-3.5 flex-1">
        {/* Tab 1: Tổng quan */}
        {activeTab === 'overview' && (
          <section className="space-y-3.5">
            <h2 className="font-extrabold text-base text-slate-800">Thông tin cá nhân</h2>
            <div className="bg-white p-4 rounded-2xl shadow-xs space-y-2.5 text-xs border border-slate-200">
              <p><strong>Mã học sinh:</strong> <span className="font-mono text-blue-700 font-bold">{user.studentId || 'Chưa cập nhật'}</span></p>
              <p><strong>Số điện thoại:</strong> <span>{user.phone}</span></p>
              <p><strong>Ngày sinh:</strong> <span>{user.dob || 'Chưa cập nhật'}</span></p>
              <p><strong>Lớp:</strong> <span>{user.class}</span></p>
              <p><strong>Sở GD&ĐT:</strong> <span>{user.department || 'Chưa cập nhật'}</span></p>
              <p><strong>Xã / Phường:</strong> <span>{user.ward || 'Chưa cập nhật'}</span></p>
              <p><strong>Số CCCD:</strong> <span>{user.idCard || 'Chưa cập nhật'}</span></p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl text-xs space-y-2">
              <p className="font-bold text-blue-900">Trạng thái hồ sơ:</p>
              <p className="text-blue-700">
                • <strong>{chosenCombos.length}</strong> tổ hợp xét tuyển đã đăng ký
              </p>
              <p className="text-blue-700">
                • <strong>{currentWishes.length}</strong> nguyện vọng đã kê khai
              </p>
              <button
                onClick={() => setActiveTab('wishes')}
                className="w-full mt-1 bg-blue-600 text-white py-2 rounded-xl font-bold text-xs shadow-sm"
              >
                Kê khai nguyện vọng
              </button>
            </div>
          </section>
        )}

        {/* Tab 2: Tổ hợp môn */}
        {activeTab === 'combos' && (
          <section className="space-y-3.5">
            <h2 className="font-extrabold text-base text-slate-800">Chọn Tổ hợp Môn</h2>

            <div className="bg-white p-4 rounded-2xl shadow-xs space-y-3 text-xs border border-slate-200">
              <p className="text-xs text-rose-500 font-bold">* Mặc định: Toán, Ngữ văn</p>
              <p className="text-xs font-bold text-slate-700">
                Chọn thêm 2 môn thi tự chọn ({selectedExtraSubjects.length}/2):
              </p>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {EXTRA_SUBJECTS.map(sub => {
                  const isChecked = selectedExtraSubjects.includes(sub);
                  return (
                    <label
                      key={sub}
                      className={`flex items-center space-x-1.5 p-1.5 rounded-xl border text-[11px] ${
                        isChecked ? 'bg-blue-50 border-blue-400 font-bold text-blue-800' : 'bg-slate-50 border-slate-200'
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

              <button
                onClick={handleCheckCombos}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold text-xs shadow-sm transition"
              >
                1. Tự động ghép tổ hợp
              </button>

              {matchedCombos.length > 0 && (
                <div className="border-t pt-2 space-y-1.5">
                  <p className="font-bold text-emerald-800 text-xs">Tổ hợp tìm thấy:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {matchedCombos.map(c => {
                      const isChosen = chosenCombos.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center space-x-2 p-1.5 border rounded-lg bg-slate-50 text-xs">
                          <input
                            type="checkbox"
                            checked={isChosen}
                            onChange={() => handleToggleChosenCombo(c.id)}
                            className="w-3.5 h-3.5 rounded text-emerald-600"
                          />
                          <span><strong>{c.id}</strong>: {c.subjects.join('-')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Manual Select */}
            <div className="bg-white p-4 rounded-2xl shadow-xs space-y-2 text-xs border border-slate-200">
              <p className="font-bold text-slate-700">Tìm & Thêm tổ hợp thủ công</p>
              <input
                type="text"
                value={comboSearchQuery}
                onChange={(e) => setComboSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const q = comboSearchQuery.trim().toUpperCase();
                    if (!q) return;
                    const match = allSystemCombos.find(c => c.id.toUpperCase() === q) ||
                      allSystemCombos.find(c => c.id.toUpperCase().startsWith(q));
                    if (match) {
                      if (!chosenCombos.includes(match.id)) {
                        setChosenCombos(prev => [...prev, match.id]);
                        toast.success(`Đã thêm ${match.id}`);
                      } else {
                        toast.info(`Tổ hợp ${match.id} đã có trong danh sách.`);
                      }
                      setComboSearchQuery('');
                    } else {
                      toast.warning(`Không tìm thấy mã tổ hợp "${q}".`);
                    }
                  }
                }}
                placeholder="Gõ mã (A00, D01...) nhấn Enter để chọn nhanh"
                className="w-full border border-slate-200 p-2 rounded-xl text-xs bg-slate-50 uppercase font-mono"
              />
              <select
                size={3}
                value={manualComboSelectedId}
                onChange={(e) => setManualComboSelectedId(e.target.value)}
                className="w-full border border-slate-200 p-1.5 rounded-xl text-xs bg-white"
              >
                {allSystemCombos
                  .filter(c => {
                    const q = comboSearchQuery.toLowerCase();
                    return c.id.toLowerCase().includes(q) || c.subjects.some(s => s.toLowerCase().includes(q));
                  })
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.id} - ({c.subjects.join(', ')})</option>
                  ))}
              </select>
              <button
                onClick={() => {
                  if (manualComboSelectedId && !chosenCombos.includes(manualComboSelectedId)) {
                    setChosenCombos(prev => [...prev, manualComboSelectedId]);
                    toast.success(`Đã thêm ${manualComboSelectedId}`);
                  }
                }}
                className="w-full bg-slate-800 text-white py-2 rounded-xl font-bold text-xs"
              >
                Thêm tổ hợp thủ công
              </button>
            </div>

            {/* Registered list */}
            <div className="bg-white p-4 rounded-2xl shadow-xs space-y-2 text-xs border border-slate-200">
              <p className="font-bold text-slate-700">Danh sách đăng ký ({chosenCombos.length}):</p>
              <div className="flex flex-wrap gap-1.5">
                {chosenCombos.length === 0 ? (
                  <span className="text-slate-400 italic">Chưa chọn tổ hợp...</span>
                ) : (
                  chosenCombos.map(id => (
                    <span key={id} className="bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <span>{id}</span>
                      <button onClick={() => handleToggleChosenCombo(id)} className="text-rose-600 font-extrabold ml-1">×</button>
                    </span>
                  ))
                )}
              </div>
              <button
                onClick={handleConfirmCombos}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm mt-2"
              >
                Xác nhận đăng ký tổ hợp
              </button>
            </div>
          </section>
        )}

        {/* Tab 3: Kê khai Nguyện vọng */}
        {activeTab === 'wishes' && (
          <section className="space-y-3.5">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-base text-slate-800">Cập nhật Nguyện vọng</h2>
              {hasUnsavedChanges && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  ⚠️ Chưa lưu
                </span>
              )}
            </div>

            {/* Quick Add Form */}
            <div className="bg-white p-4 rounded-2xl shadow-xs space-y-2.5 border border-slate-200 text-xs">
              <p className="font-bold text-slate-800">Thêm nhanh Nguyện vọng</p>

              <div className="space-y-1">
                <input
                  type="text"
                  value={wishUniFilter}
                  onChange={(e) => setWishUniFilter(e.target.value)}
                  placeholder="Tìm trường (mã hoặc tên)..."
                  className="w-full border border-slate-200 p-2 rounded-xl text-xs bg-slate-50"
                />
                <select
                  value={selectedUniId}
                  onChange={(e) => {
                    setSelectedUniId(e.target.value);
                    setSelectedMajorId('');
                    setSelectedCombosForWish([]);
                  }}
                  className="w-full border border-slate-200 p-2 rounded-xl text-xs bg-white font-medium"
                >
                  <option value="">-- Chọn trường học ({filteredUnis.length}) --</option>
                  {filteredUnis.map(u => (
                    <option key={u.id} value={u.id}>{u.id} - {u.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  value={wishMajorFilter}
                  onChange={(e) => setWishMajorFilter(e.target.value)}
                  placeholder="Tìm ngành (mã hoặc tên)..."
                  className="w-full border border-slate-200 p-2 rounded-xl text-xs bg-slate-50"
                />
                <select
                  value={selectedMajorId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setSelectedMajorId(mId);
                    if (!mId) {
                      setSelectedCombosForWish([]);
                      return;
                    }
                    const mObj = allMajors.find(m => m.uniId === selectedUniId && m.id === mId);
                    if (mObj) {
                      const regUpper = (chosenCombos || []).map(c => c.trim().toUpperCase());
                      const matched = (mObj.combos || []).filter(c => regUpper.includes(c.trim().toUpperCase()));
                      if (matched.length > 0) {
                        setSelectedCombosForWish(matched);
                        toast.success(`Đã tự động chọn ${matched.length} tổ hợp hợp lệ!`);
                      } else {
                        setSelectedCombosForWish([]);
                        toast.error('Hệ thống từ chối đăng ký: Tổ hợp môn đăng ký xét tuyển chưa có tổ hợp phù hợp với ngành này. Mời bạn thay đổi.');
                      }
                    } else {
                      setSelectedCombosForWish([]);
                    }
                  }}
                  className="w-full border border-slate-200 p-2 rounded-xl text-xs bg-white font-medium"
                >
                  <option value="">-- Chọn ngành học ({filteredMajors.length}) --</option>
                  {filteredMajors.map(m => (
                    <option key={m.id} value={m.id}>{m.id} - {m.name}</option>
                  ))}
                </select>
              </div>

              {currentSelectedMajor && (
                <div className="pt-1">
                  {hasValidMatchedCombos ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                      <div className="flex items-start gap-1.5 text-xs text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-[11px]">Đã tự động chọn tổ hợp phù hợp ({validMatchedCombos.join(', ')})</p>
                          <p className="text-[10px] text-emerald-700">Hệ thống đã chọn tất cả tổ hợp hợp lệ của bạn. Chỉ cần bấm Thêm Nguyện Vọng.</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {currentSelectedMajor.combos.map(c => {
                          const isMatched = registeredCombosUpper.includes(c.trim().toUpperCase());
                          const isChecked = selectedCombosForWish.includes(c);
                          if (!isMatched) {
                            return (
                              <span
                                key={c}
                                className="text-[10px] px-2 py-0.5 rounded-lg border border-dashed border-slate-300 text-slate-400 bg-slate-50"
                              >
                                {c} (Chưa ĐK)
                              </span>
                            );
                          }
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setSelectedCombosForWish(prev =>
                                  prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                                );
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition flex items-center gap-1 ${
                                isChecked ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300'
                              }`}
                            >
                              <span>{c}</span>
                              <span className={`text-[9px] px-1 rounded ${isChecked ? 'bg-emerald-700' : 'bg-emerald-50 text-emerald-700'}`}>Hợp lệ</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-xs text-rose-900 space-y-1.5">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-800 text-[11px]">Hệ thống từ chối đăng ký nguyện vọng này!</p>
                          <p className="text-[10.5px] text-rose-700 leading-snug">
                            Lý do: Tổ hợp môn đăng ký xét tuyển chưa có tổ hợp phù hợp với nguyện vọng đang xét tuyển. Mời bạn thay đổi.
                          </p>
                        </div>
                      </div>
                      <div className="text-[10px] bg-white/80 p-1.5 rounded border border-rose-200">
                        <p>• Ngành yêu cầu: <b className="text-rose-700">{currentSelectedMajor.combos.join(', ')}</b></p>
                        <p>• Bạn đã đăng ký: <b className="text-indigo-700">{chosenCombos.length > 0 ? chosenCombos.join(', ') : 'Chưa có'}</b></p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleAddWish}
                disabled={currentSelectedMajor && !hasValidMatchedCombos}
                className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-sm transition ${
                  currentSelectedMajor && !hasValidMatchedCombos
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed opacity-90'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {currentSelectedMajor && !hasValidMatchedCombos
                  ? '❌ Từ chối đăng ký (Chưa có tổ hợp phù hợp)'
                  : '+ Thêm Nguyện Vọng'}
              </button>
            </div>

            {/* Wishes List */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Thứ tự đã thêm:</span>
                <span className="text-slate-500 font-semibold">{currentWishes.length} NV</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {currentWishes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Chưa có nguyện vọng nào.</p>
                ) : (
                  currentWishes.map((w, index) => {
                    const uni = universities.find(u => u.id === w.uniId);
                    return (
                      <div key={index} className="border border-slate-200 p-3 rounded-xl bg-slate-50 text-xs flex justify-between items-center shadow-2xs">
                        <div className="space-y-0.5 pr-2">
                          <p className="font-bold text-blue-800">
                            NV {w.order}: [{w.uniId}] {w.majorName || w.majorId}
                          </p>
                          <p className="text-[11px] text-slate-600">{uni?.name || w.uniName}</p>
                          <p className="text-[10px] text-emerald-700 font-semibold">Tổ hợp: {w.comboId}</p>
                        </div>
                        <div className="flex flex-col space-y-1 shrink-0">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleMoveWish(index, -1)}
                              disabled={index === 0}
                              className="p-1 bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-20"
                              title="Lên"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveWish(index, 1)}
                              disabled={index === currentWishes.length - 1}
                              className="p-1 bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-20"
                              title="Xuống"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleDeleteWish(index)}
                            className="text-rose-600 text-[10px] font-bold text-center hover:underline pt-0.5"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleSaveWishesToDatabase}
                  className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  💾 Lưu Nguyện Vọng
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={handleOpenPrint}
                    className="w-1/2 bg-slate-700 text-white py-2 rounded-xl text-xs font-bold"
                  >
                    🖨️ In phiếu
                  </button>
                  <button
                    onClick={handleArchiveWishForm}
                    className="w-1/2 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold"
                  >
                    📂 Lưu thành phiếu
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 4: Gợi ý nguyện vọng */}
        {activeTab === 'suggest' && (
          <section className="space-y-3.5">
            <h2 className="font-extrabold text-base text-slate-800">Gợi ý Nguyện vọng</h2>

            <div className="bg-white p-4 rounded-2xl shadow-xs space-y-2.5 text-xs border border-slate-200">
              <p className="font-bold text-slate-600">Bước 1: Chọn tổ hợp của bạn</p>
              <div className="flex flex-wrap gap-1">
                {chosenCombos.map(id => {
                  const isChecked = suggestChosenCombos.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSuggestChosenCombos(prev =>
                          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                        );
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full font-bold border transition ${
                        isChecked ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {id}
                    </button>
                  );
                })}
              </div>

              <div className="border-t pt-2 space-y-1">
                <p className="font-bold text-slate-600">Bước 2: Từ khóa tìm kiếm</p>
                <input
                  type="text"
                  value={suggestKeyword}
                  onChange={(e) => setSuggestKeyword(e.target.value)}
                  placeholder="Nhập tên ngành, trường..."
                  className="w-full border border-slate-200 p-2 rounded-xl text-xs"
                />
              </div>

              <button
                onClick={handleSearchSuggestions}
                disabled={isSearchingSuggestions}
                className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold text-xs shadow-sm"
              >
                Tìm ngành phù hợp
              </button>
            </div>

            {/* Results */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-2">
              <p className="font-bold text-xs text-slate-700">Kết quả ({suggestedResults.length}):</p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {suggestedResults.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-4">Tích chọn tổ hợp và nhấn tìm để xem kết quả.</p>
                ) : (
                  suggestedResults.map(({ major, uniName }) => (
                    <div key={`${major.uniId}_${major.id}`} className="border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-xs space-y-1">
                      <p className="font-bold text-slate-900">[{major.uniId}] {major.name}</p>
                      <p className="text-[10px] text-slate-500">{uniName} • Mã: {major.id}</p>
                      <p className="text-[10px] text-emerald-700 font-semibold">Tổ hợp: {major.combos.join(', ')}</p>
                      <button
                        onClick={() => {
                          setSelectedUniId(major.uniId);
                          setSelectedMajorId(major.id);
                          const compatible = major.combos.filter(c => chosenCombos.includes(c));
                          setSelectedCombosForWish(compatible.length > 0 ? [compatible[0]] : [major.combos[0]]);
                          setActiveTab('wishes');
                          toast.info(`Đã chọn ngành ${major.name}`);
                        }}
                        className="w-full mt-1.5 bg-blue-600 text-white py-1.5 rounded-lg text-[11px] font-bold"
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

        {/* Tab 5: Hồ sơ & Đổi mật khẩu */}
        {activeTab === 'forms' && (
          <section className="space-y-3.5">
            <h2 className="font-extrabold text-base text-slate-800">Phiếu của tôi & Bảo mật</h2>

            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-2">
              <p className="font-bold text-xs text-slate-800">Lịch sử Phiếu Đăng Ký Đã Lưu:</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {savedForms.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Chưa có phiếu lưu trữ nào.</p>
                ) : (
                  savedForms.map(form => (
                    <div key={form.id} className="border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-xs space-y-0.5">
                      <p className="font-bold text-blue-700">{form.id} - <span className="text-[10px] text-slate-500 font-normal">{form.formattedDate}</span></p>
                      <p className="text-[11px] text-slate-600">{form.wishes.map(w => `NV ${w.order}: ${w.uniId}-${w.majorId}`).join(', ')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-rose-600">Đổi mật khẩu bảo mật</p>
              {changePasswordMsg && (
                <p className="text-emerald-700 font-semibold bg-emerald-50 p-1.5 rounded-lg">{changePasswordMsg}</p>
              )}
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full border border-slate-200 p-2 rounded-xl text-xs"
              />
              <button
                onClick={handleChangePassword}
                className="bg-rose-600 text-white px-3 py-2 rounded-xl font-bold text-xs w-full shadow-sm"
              >
                Cập nhật mật khẩu
              </button>
            </div>

            <button
              onClick={onLogout}
              className="w-full bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold mt-2 shadow-xs"
            >
              Đăng xuất khỏi hệ thống
            </button>
          </section>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around p-2 text-center text-xs shadow-lg z-50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center py-1 transition ${activeTab === 'overview' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px] mt-1">Tổng quan</span>
        </button>
        <button
          onClick={() => setActiveTab('combos')}
          className={`flex flex-col items-center py-1 transition ${activeTab === 'combos' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] mt-1">Tổ hợp</span>
        </button>
        <button
          onClick={() => setActiveTab('wishes')}
          className={`flex flex-col items-center py-1 transition ${activeTab === 'wishes' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}
        >
          <ClipboardList className="w-4 h-4" />
          <span className="text-[10px] mt-1">Nguyện vọng</span>
        </button>
        <button
          onClick={() => setActiveTab('suggest')}
          className={`flex flex-col items-center py-1 transition ${activeTab === 'suggest' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] mt-1">Gợi ý</span>
        </button>
        <button
          onClick={() => setActiveTab('forms')}
          className={`flex flex-col items-center py-1 transition ${activeTab === 'forms' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}
        >
          <FolderArchive className="w-4 h-4" />
          <span className="text-[10px] mt-1">Hồ sơ</span>
        </button>
      </nav>

      {/* Print Modal */}
      <PrintWishesModal data={printData} onClose={() => setPrintData(null)} />
    </div>
  );
};
