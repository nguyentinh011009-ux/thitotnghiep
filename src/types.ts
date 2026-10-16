export interface User {
  username: string;
  password?: string;
  fullName: string;
  phone: string;
  class: string;
  email?: string;
  idCard?: string;
  department?: string;
  ward?: string;
  hamlet?: string;
  dob?: string;
  studentId?: string;
  avatar?: string;
  role: 'student' | 'admin';
}

export interface Combo {
  id: string; // e.g., 'A00'
  subjects: string[]; // e.g., ['Toán', 'Vật lý', 'Hóa học']
}

export interface University {
  id: string; // e.g., 'QST'
  name: string; // e.g., 'Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM'
}

export interface Major {
  uniId: string;
  id: string; // e.g., '7220201'
  name: string;
  combos: string[];
}

export interface Wish {
  order: number;
  uniId: string;
  uniName?: string;
  majorId: string;
  majorName?: string;
  comboId: string;
}

export interface SavedForm {
  id: string;
  studentUid: string;
  timestamp?: any;
  formattedDate?: string;
  wishes: Wish[];
}

export interface GlobalSettings {
  examDate: string;
  maxWishes: number;
  lockWishes: boolean;
  rangeMin?: number;
  rangeMax?: number;
}

export interface WishRule {
  id: string;
  uniId: string;
  majors: string[];
  orderMin: number;
  orderMax: number;
}

export interface PrintData {
  student: {
    fullName: string;
    class: string;
    studentId: string;
    phone: string;
    department: string;
    dob: string;
  };
  wishes: Wish[];
}
