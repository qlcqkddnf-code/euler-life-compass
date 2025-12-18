/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ Tailwind v4에서 content 경로가 누락되면 유틸리티가 생성되지 않아 “하얀 화면(무스타일)”이 될 수 있음
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './constants/**/*.{js,ts,jsx,tsx,mdx}',
    './utils/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};


