import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-tegv-light flex flex-col items-center justify-center p-6 text-center">
      
      {/* --- ÜST BÖLÜM: DEV KESKİN TEGV GÜNEŞİ VE BAŞLIK --- */}
      <div className="mb-10 animate-in fade-in zoom-in duration-1000">
        
        {/* DEV KESKİN TEGV GÜNEŞİ (Logodaki gibi sivri uçlu ve büyük) */}
        <div className="flex justify-center mb-6 drop-shadow-[0_0_40px_rgba(255,204,0,0.6)]">
          <svg 
            width="200" 
            height="200" 
            viewBox="0 0 200 200" 
            className="animate-[spin_40s_linear_infinite]"
          >
            <defs>
              {/* Güneşin sivri ışınlarını oluşturan üçgen tanımı */}
              <polygon id="tegvRay" points="100,2 114,80 86,80" fill="#FFCC00" />
            </defs>
            {/* 12 adet sivri ışını döndürerek diziyoruz */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
              <use key={angle} href="#tegvRay" transform={`rotate(${angle} 100 100)`} />
            ))}
            {/* Merkezdeki büyük yuvarlak */}
            <circle cx="100" cy="100" r="52" fill="#FFCC00" />
            {/* İçindeki hafif parlama efekti */}
            <circle cx="85" cy="85" r="14" fill="white" fillOpacity="0.2" />
          </svg>
        </div>

        {/* ANA BAŞLIK */}
        <h1 className="text-8xl font-black text-tegv-navy uppercase tracking-tighter leading-tight">
          ATEŞ <span className="text-tegv-orange">BÖCEĞİ</span>
        </h1>
        <div className="h-2.5 w-64 bg-tegv-orange mx-auto mt-4 rounded-full shadow-sm"></div>
        <p className="text-2xl text-tegv-navy/70 mt-6 font-bold uppercase tracking-[0.3em]">
          Gönüllü Eğitim Portalı
        </p>
      </div>

      {/* --- GİRİŞ KARTLARI (ÖĞRENCİ VE EĞİTMEN) --- */}
      <div className="grid md:grid-cols-2 gap-10 w-full max-w-6xl mt-10">
        
        {/* ÖĞRENCİ KARTI (TURUNCU TEMA) */}
        <div className="group bg-white p-14 rounded-[70px] shadow-2xl border-b-[20px] border-tegv-orange hover:translate-y-[-15px] transition-all duration-500">
          <div className="text-9xl mb-6 group-hover:scale-110 transition-transform">🎒</div>
          <h2 className="text-5xl font-black text-tegv-navy mb-4 tracking-tighter uppercase">Öğrenciyim</h2>
          <p className="text-gray-500 text-xl mb-12 font-medium leading-relaxed">
            Oyunlar, rozetler ve kendi gelişim bahçen seni bekliyor!
          </p>
          <Link href="/student-login" className="block w-full">
            <button className="bg-tegv-orange text-white font-black py-6 px-12 rounded-[35px] w-full text-3xl shadow-[0_15px_35px_rgba(255,128,0,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer uppercase tracking-tight">
              IŞIĞINI YAK! 🚀
            </button>
          </Link>
        </div>

        {/* EĞİTMEN KARTI (LACİVERT TEMA) */}
        <div className="group bg-white p-14 rounded-[70px] shadow-2xl border-b-[20px] border-tegv-navy hover:translate-y-[-15px] transition-all duration-500">
          <div className="text-9xl mb-6 group-hover:scale-110 transition-transform">🧑‍🏫</div>
          <h2 className="text-5xl font-black text-tegv-navy mb-4 tracking-tighter uppercase">Eğitmenim</h2>
          <p className="text-gray-500 text-xl mb-12 font-medium leading-relaxed">
            Sınıfını yönet, yoklama al ve gönüllü arkadaşlarınla paylaşım yap.
          </p>
          <Link href="/login" className="block w-full">
            <button className="bg-tegv-navy text-white font-black py-6 px-12 rounded-[35px] w-full text-3xl shadow-[0_15px_35px_rgba(0,51,102,0.3)] hover:brightness-125 active:scale-95 transition-all cursor-pointer uppercase tracking-tight">
              GİRİŞ YAP 💡
            </button>
          </Link>
        </div>

      </div>

      {/* --- ALT BİLGİ (MOTTO) --- */}
      <footer className="mt-28 text-tegv-navy font-black uppercase text-sm tracking-[0.5em] opacity-40">
        TEGV • BİR ÇOCUK DEĞİŞİR, TÜRKİYE GELİŞİR.
      </footer>
    </main>
  );
}