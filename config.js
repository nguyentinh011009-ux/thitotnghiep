// config.js
const firebaseConfig = {
  apiKey: "AIzaSyADFk75bvScT28rj8AukdvFeY0UhcgPVtM",
  authDomain: "alex-3dee0.firebaseapp.com",
  projectId: "alex-3dee0",
  storageBucket: "alex-3dee0.firebasestorage.app",
  messagingSenderId: "754491161459",
  appId: "1:754491161459:web:6437f3b6168290974b6306",
  measurementId: "G-NFED8NHYJN"
};

// Khởi tạo Firebase phiên bản Compat để dễ sử dụng trực tiếp trong HTML
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();