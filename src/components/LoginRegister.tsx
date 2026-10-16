import React, { useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';
import { useToast } from '../context/ToastContext';
import {
  LogIn,
  UserPlus,
  ShieldAlert,
  Copy,
  Check,
  Eye,
  EyeOff,
  User as UserIcon,
  Lock,
  Phone,
  BookOpen,
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  Sparkles
} from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User) => void;
  onAdminLoginSuccess: () => void;
}

export const LoginRegister: React.FC<Props> = ({ onLoginSuccess, onAdminLoginSuccess }) => {
  const toast = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Admin login modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [email, setEmail] = useState('');
  const [idCard, setIdCard] = useState('');
  const [departmentSelect, setDepartmentSelect] = useState('Sở Giáo dục và Đào tạo Thành phố Hồ Chí Minh');
  const [departmentCustom, setDepartmentCustom] = useState('');
  const [ward, setWard] = useState('');
  const [hamlet, setHamlet] = useState('');
  const [dob, setDob] = useState('');
  const [studentId, setStudentId] = useState('');
  const [avatar, setAvatar] = useState('');
  const [registerError, setRegisterError] = useState('');

  // Newly issued credentials modal
  const [newCredentials, setNewCredentials] = useState<{ username: string; password: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Vui lòng điền đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await dataService.getUser(loginUsername.trim());
      if (user && user.password === loginPassword.trim()) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        toast.success(`Chào mừng thí sinh ${user.fullName} đã đăng nhập!`);
        onLoginSuccess(user);
      } else {
        setLoginError('Thông tin đăng nhập không chính xác hoặc tài khoản không tồn tại.');
        toast.error('Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } catch (err: any) {
      console.error(err);
      setLoginError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (adminPasswordInput === 'thitotnghiep27') {
      localStorage.setItem('adminAuth', 'true');
      setShowAdminModal(false);
      toast.success('Đăng nhập Quản trị viên thành công!');
      onAdminLoginSuccess();
    } else {
      setAdminError('Mật khẩu Admin không chính xác.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!name.trim() || !phone.trim() || !studentClass.trim()) {
      setRegisterError('Vui lòng nhập đầy đủ các mục có dấu (*).');
      return;
    }

    setIsLoading(true);
    try {
      const phoneExists = await dataService.checkPhoneExists(phone.trim());
      if (phoneExists) {
        setRegisterError('Số điện thoại này đã được đăng ký trên hệ thống.');
        toast.warning('Số điện thoại đã tồn tại. Bạn hãy sử dụng số khác hoặc đăng nhập.');
        setIsLoading(false);
        return;
      }

      const generatedUsername = 'TS' + phone.trim();
      const generatedPassword = Math.floor(100000 + Math.random() * 900000).toString();

      let finalDept = departmentSelect;
      if (departmentSelect === 'khac') {
        finalDept = departmentCustom.trim() || 'Chưa xác định';
      }

      const userData: User = {
        username: generatedUsername,
        password: generatedPassword,
        fullName: name.trim(),
        phone: phone.trim(),
        class: studentClass.trim(),
        email: email.trim(),
        idCard: idCard.trim(),
        department: finalDept,
        ward: ward.trim(),
        hamlet: hamlet.trim(),
        dob: dob,
        studentId: studentId.trim(),
        avatar: avatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'student'
      };

      await dataService.registerStudent(userData);

      setNewCredentials({
        username: generatedUsername,
        password: generatedPassword
      });
      toast.success('Tạo tài khoản học sinh thành công!');

      // Reset
      setName('');
      setPhone('');
      setStudentClass('');
      setEmail('');
      setIdCard('');
      setWard('');
      setHamlet('');
      setDob('');
      setStudentId('');
      setAvatar('');
      setDepartmentCustom('');
    } catch (err: any) {
      console.error('Lỗi đăng ký:', err);
      setRegisterError('Có lỗi xảy ra: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.info(`Đã sao chép: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const closeCredentialModal = () => {
    if (newCredentials) {
      setLoginUsername(newCredentials.username);
      setLoginPassword(newCredentials.password);
    }
    setNewCredentials(null);
    setMode('login');
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 min-h-screen flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200/80 transition-all">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 transform hover:scale-105 transition">
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            CỔNG ĐĂNG KÝ NGUYỆN VỌNG
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
            Hệ thống xét tuyển Tốt nghiệp THPT & Tuyển sinh Đại học trực tuyến
          </p>

          {/* Switch Tab buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-xs mt-4">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
              }}
              className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegisterError('');
              }}
              className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'register' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký mới</span>
            </button>
          </div>
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start space-x-2">
                <span className="shrink-0 text-sm">⚠️</span>
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">
                Tên đăng nhập (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Ví dụ: TS0912345678"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wider">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập 6 số hoặc mật khẩu đã đổi..."
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}</span>
            </button>

            <div className="pt-2 flex flex-col sm:flex-row justify-between items-center text-xs gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Chưa có tài khoản? Đăng ký ngay
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdminModal(true);
                  setAdminPasswordInput('');
                  setAdminError('');
                }}
                className="text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center space-x-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 inline" />
                <span>Đăng nhập Admin</span>
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Thông tin Học sinh</span>
              </span>
              <span className="text-[11px] text-rose-500 font-medium">(*) Bắt buộc</span>
            </div>

            {registerError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl">
                {registerError}
              </div>
            )}

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên thí sinh *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Duy nhất"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp học *</label>
                  <input
                    type="text"
                    required
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Ví dụ: 12A1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Sở Giáo dục và Đào tạo</label>
                <select
                  value={departmentSelect}
                  onChange={(e) => setDepartmentSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="Sở Giáo dục và Đào tạo Thành phố Hồ Chí Minh">Sở GD&ĐT TP. Hồ Chí Minh</option>
                  <option value="Sở Giáo dục và Đào tạo Thành phố Hà Nội">Sở GD&ĐT Hà Nội</option>
                  <option value="Sở Giáo dục và Đào tạo Tỉnh Nghệ An">Sở GD&ĐT Nghệ An</option>
                  <option value="Sở Giáo dục và Đào tạo Thành phố Đà Nẵng">Sở GD&ĐT Đà Nẵng</option>
                  <option value="Sở Giáo dục và Đào tạo Thành phố Cần Thơ">Sở GD&ĐT Cần Thơ</option>
                  <option value="khac">Khác (Tự nhập tên Sở...)</option>
                </select>
                {departmentSelect === 'khac' && (
                  <input
                    type="text"
                    value={departmentCustom}
                    onChange={(e) => setDepartmentCustom(e.target.value)}
                    placeholder="Nhập tên Sở GD&ĐT cụ thể..."
                    className="mt-1.5 w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Số CCCD</label>
                  <input
                    type="text"
                    value={idCard}
                    onChange={(e) => setIdCard(e.target.value)}
                    placeholder="Số định danh cá nhân"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Mã học sinh</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Mã định danh trường"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Ngày sinh</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Xã / Phường</label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="Xã / Phường"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Khu phố / Ấp</label>
                  <input
                    type="text"
                    value={hamlet}
                    onChange={(e) => setHamlet(e.target.value)}
                    placeholder="Ấp / Thôn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Ảnh đại diện (Link ảnh)</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://... (để trống nếu dùng mặc định)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-2.5 rounded-xl transition shadow-md shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 text-xs sm:text-sm"
              >
                {isLoading ? 'Đang xử lý đăng ký...' : 'Xác nhận Đăng ký Ngay'}
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-semibold transition"
              >
                Quay lại Đăng nhập
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ADMIN LOGIN MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-rose-600 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="text-base font-bold">Xác thực Quản trị viên (Admin)</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Nhập mã quản trị hệ thống để truy cập bảng điều khiển tuyển sinh.
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-3">
              {adminError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg font-medium">
                  {adminError}
                </p>
              )}
              <div className="relative">
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  autoFocus
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Mật khẩu Admin..."
                  className="w-full pl-3 pr-10 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
                >
                  Đăng nhập Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS ISSUED MODAL */}
      {newCredentials && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-black text-emerald-700 mb-1">Đăng Ký Thành Công!</h4>
            <p className="text-xs text-slate-600 mb-4">
              Vui lòng sao chép hoặc ghi nhớ thông tin đăng nhập tự động được cấp dưới đây:
            </p>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl mb-4 text-left space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Tên đăng nhập</span>
                  <span className="text-blue-700 font-bold text-sm">{newCredentials.username}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newCredentials.username, 'user')}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                  title="Sao chép tên đăng nhập"
                >
                  {copiedKey === 'user' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Mật khẩu</span>
                  <span className="text-blue-700 font-bold text-sm">{newCredentials.password}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newCredentials.password, 'pass')}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                  title="Sao chép mật khẩu"
                >
                  {copiedKey === 'pass' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={closeCredentialModal}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-blue-500/20"
            >
              Đã lưu và Chuyển đến Đăng nhập
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
