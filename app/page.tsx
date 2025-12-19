import Link from "next/link";

export default function Home() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white"
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* 배경 노이즈 효과 */}
      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-[url('/noise.svg')]"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.2,
          backgroundImage: "url(/noise.svg)", // ✅ 절대 경로
          backgroundRepeat: "repeat",
        }}
      />
      
      <div
        className="relative z-10 flex flex-col items-center gap-8 px-6 text-center"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
          paddingInline: "1.5rem",
          textAlign: "center",
        }}
      >
        <div className="space-y-4">
          <h1 className="text-4xl font-light tracking-[0.2em] sm:text-6xl uppercase">
            Euler Life Compass
          </h1>
          <p className="text-zinc-500 tracking-widest text-sm sm:text-base">
            2030 포스트 특이점 시대를 위한 실존적 나침반
          </p>
        </div>

        <div className="h-[1px] w-24 bg-zinc-800" />

        <Link 
          href="/test/"
          className="group relative px-12 py-4 border border-zinc-700 hover:border-white transition-all duration-500"
          style={{
            position: "relative",
            padding: "1rem 3rem",
            border: "1px solid rgba(255,255,255,0.35)",
            color: "white",
            textDecoration: "none",
            overflow: "hidden",
          }}
        >
          <span className="relative z-10 text-sm tracking-[0.3em] font-light group-hover:text-black transition-colors duration-500">
            시작하기
          </span>
          <div className="absolute inset-0 z-0 bg-white scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
        </Link>
      </div>

      {/* 장식용 스캔라인 */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))",
          backgroundSize: "100% 2px, 3px 100%",
        }}
      />
    </main>
  );
}