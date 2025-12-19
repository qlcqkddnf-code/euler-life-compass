/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ Tailwind v4에서 content 경로가 누락되면 유틸리티가 생성되지 않아 “하얀 화면(무스타일)”이 될 수 있음
  content: [
    // ✅ 요청대로: app 폴더 내 파일을 명확한 패턴으로 스캔
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './constants/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};


