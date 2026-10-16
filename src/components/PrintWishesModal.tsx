import React from 'react';
import { PrintData } from '../types';

interface Props {
  data: PrintData | null;
  onClose: () => void;
}

export const PrintWishesModal: React.FC<Props> = ({ data, onClose }) => {
  if (!data) return null;

  const { student, wishes } = data;
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-900 text-white p-3 sm:p-4 flex flex-wrap justify-between items-center gap-3 border-b">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-xl">🖨️</span>
            <div>
              <p className="font-semibold text-white">Xem trước Phiếu Đăng Ký Nguyện Vọng (Khổ A4)</p>
              <p className="text-xs text-slate-300">Nhấn &quot;In Phiếu&quot; để xuất bản in hoặc lưu thành file PDF</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-md text-xs sm:text-sm transition flex items-center space-x-1.5 shadow"
            >
              <span>🖨️</span>
              <span>In Phiếu</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 text-gray-200 font-medium py-1.5 px-3 rounded-md text-xs sm:text-sm transition"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="overflow-y-auto flex-1 p-2 sm:p-6 bg-slate-100">
          <div className="print-area print-font bg-white text-black p-6 sm:p-10 mx-auto max-w-[210mm] min-h-[297mm] shadow-lg text-xs leading-relaxed">
            
            {/* Header: Quốc hiệu & Tiêu ngữ */}
            <div className="flex justify-between items-start mb-6">
              <div className="text-center w-1/2 pr-2">
                <p className="font-bold uppercase text-[11px]">{student.department || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}</p>
                <p className="font-semibold text-[11px]">TRƯỜNG THPT: ....................................</p>
                <div className="w-24 h-px bg-black mx-auto mt-1"></div>
              </div>
              <div className="text-center w-1/2 pl-2">
                <p className="font-bold uppercase text-[11px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-[11px]">Độc lập - Tự do - Hạnh phúc</p>
                <div className="w-32 h-px bg-black mx-auto mt-1"></div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-6">
              <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider">PHIẾU ĐĂNG KÝ NGUYỆN VỌNG XÉT TUYỂN</h1>
              <p className="italic text-[11px] text-gray-600 mt-1">Kỳ thi tốt nghiệp Trung học phổ thông & Tuyển sinh Đại học, Cao đẳng</p>
            </div>

            {/* Student Info */}
            <div className="mb-5 border border-black/20 p-3 rounded-sm bg-slate-50/40">
              <h2 className="text-xs font-bold uppercase mb-2 border-b border-black pb-1">I. THÔNG TIN THÍ SINH</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                <div>
                  <span className="font-medium">1. Họ và tên: </span>
                  <span className="font-bold uppercase">{student.fullName}</span>
                </div>
                <div>
                  <span className="font-medium">2. Ngày sinh: </span>
                  <span className="font-semibold">{student.dob || '....................'}</span>
                </div>
                <div>
                  <span className="font-medium">3. Mã học sinh: </span>
                  <span className="font-semibold">{student.studentId || '....................'}</span>
                </div>
                <div>
                  <span className="font-medium">4. Lớp: </span>
                  <span className="font-semibold">{student.class}</span>
                </div>
                <div>
                  <span className="font-medium">5. Số điện thoại: </span>
                  <span className="font-semibold">{student.phone}</span>
                </div>
                <div>
                  <span className="font-medium">6. Đơn vị dự thi: </span>
                  <span className="font-semibold">{student.department || 'Chưa cập nhật'}</span>
                </div>
              </div>
            </div>

            {/* Wishes Table */}
            <div className="my-5">
              <h2 className="text-xs font-bold uppercase mb-2 border-b border-black pb-1">II. DANH SÁCH NGUYỆN VỌNG ĐÃ ĐĂNG KÝ</h2>
              <table className="w-full text-left text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 text-center font-bold">
                    <th className="border border-black p-2 w-12">Thứ tự</th>
                    <th className="border border-black p-2 w-[40%]">Trường xét tuyển (Mã - Tên)</th>
                    <th className="border border-black p-2 w-[40%]">Ngành xét tuyển (Mã - Tên)</th>
                    <th className="border border-black p-2 w-20">Tổ hợp môn</th>
                  </tr>
                </thead>
                <tbody>
                  {wishes.map((w) => (
                    <tr key={w.order} className="border border-black">
                      <td className="border border-black p-2 text-center font-bold">{w.order}</td>
                      <td className="border border-black p-2">
                        <span className="font-bold">[{w.uniId}]</span> {w.uniName || ''}
                      </td>
                      <td className="border border-black p-2">
                        <span className="font-bold">[{w.majorId}]</span> {w.majorName || ''}
                      </td>
                      <td className="border border-black p-2 text-center font-semibold">{w.comboId}</td>
                    </tr>
                  ))}
                  {wishes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="border border-black p-4 text-center text-gray-500 italic">
                        Chưa có nguyện vọng nào được ghi nhận.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Commitment & Signatures */}
            <div className="mt-8 text-xs">
              <p className="italic text-[11px] mb-6 leading-relaxed">
                Tôi xin cam đoan các thông tin kê khai trên phiếu này là hoàn toàn chính xác và chịu mọi trách nhiệm trước pháp luật về tính chân thực của thông tin đăng ký xét tuyển.
              </p>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="font-bold">Xác nhận của Phụ huynh học sinh</p>
                  <p className="text-[10px] italic text-gray-500 mt-0.5">(Ký và ghi rõ họ tên)</p>
                  <div className="h-20"></div>
                  <p className="text-gray-400">......................................................</p>
                </div>
                <div>
                  <p className="italic text-[11px] text-gray-600 mb-1">
                    Ngày {day} tháng {month} năm {year}
                  </p>
                  <p className="font-bold">Thí sinh đăng ký</p>
                  <p className="text-[10px] italic text-gray-500 mt-0.5">(Ký và ghi rõ họ tên)</p>
                  <div className="h-20"></div>
                  <p className="font-semibold text-gray-800">{student.fullName}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
