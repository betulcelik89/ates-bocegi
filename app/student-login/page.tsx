"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function StudentLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    // 1. Giriş yapmayı dene
    const { error: authError } = await supabase.auth.signInWithPassword({ 
      email: cleanEmail, 
      password 
    });

    if (authError) {
      alert("Giriş Hatası: " + authError.message);
      setLoading(false);
      return;
    }

    // 2. ROL KONTROLÜ: Students tablosunda bu mail var mı?
    const { data: studentRecord, error: dbError } = await supabase
      .from('students')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle(); // .single() yerine .maybeSingle() daha güvenlidir

    if (studentRecord) {
      // ÖĞRENCİ BULUNDU! Kendi bahçesine süzül...
      router.push('/student-dashboard'); 
    } else {
      // ÖĞRENCİ TABLOSUNDA YOK! Demek ki bu bir eğitmen...
      await supabase.auth.signOut();
      alert("Bu hesapla sadece Eğitmen Girişi yapabilirsin. 🧑‍🏫");
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-tegv-orange flex items-center justify-center p-6 text-center">
      <div className="bg-white w-full max-w-md rounded-[60px] shadow-2xl p-12 border-b-[15px] border-tegv-navy/10 relative">
        <Link href="/" className="text-tegv-navy font-black text-[10px] uppercase tracking-widest block mb-8">← Ana Sayfa</Link>
        <div className="text-8xl mb-6">🎒</div>
        <h1 className="text-4xl font-black text-tegv-navy uppercase tracking-tighter mb-10 leading-none">ÖĞRENCİ <span className="text-tegv-orange">GİRİŞİ</span></h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Posta Adresin" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifren" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          <button type="submit" disabled={loading} className="w-full bg-tegv-orange text-white font-black py-5 rounded-3xl text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all mt-4 uppercase cursor-pointer">
            {loading ? 'KONTROL EDİLİYOR...' : 'BAHÇEME GİT 🚀'}
          </button>
        </form>
        
        <p className="mt-10 text-gray-400 font-black text-[10px] uppercase tracking-widest">Henüz hesabın yok mu? <Link href="/student-signup" className="text-tegv-orange underline uppercase">Işığını Yak ✨</Link></p>
      </div>
    </main>
  );
}