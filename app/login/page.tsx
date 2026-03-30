"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanEmail = email.toLowerCase().trim();

    const { error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    if (authError) {
      alert("Hata: " + authError.message);
    } else {
      // Bu kişi öğrenci mi kontrol et
      const { data: isSt } = await supabase.from('students').select('email').eq('email', cleanEmail).single();
      if (isSt) {
        await supabase.auth.signOut();
        alert("Bu bir öğrenci hesabı! Lütfen Öğrenci Girişi'ni kullan. 🎒");
        router.push('/student-login');
      } else {
        router.push('/dashboard'); 
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-tegv-navy flex items-center justify-center p-6 text-center">
      <div className="bg-white w-full max-w-md rounded-[60px] shadow-2xl p-12 relative overflow-hidden">
        <Link href="/" className="text-tegv-navy font-black text-[10px] uppercase tracking-widest block mb-8">← Ana Sayfa</Link>
        <div className="text-7xl mb-6">🧑‍🏫</div>
        <h1 className="text-4xl font-black text-tegv-navy uppercase tracking-tighter mb-10 leading-none">EĞİTMEN <span className="text-tegv-orange">GİRİŞİ</span></h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Posta" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          <button type="submit" disabled={loading} className="w-full bg-tegv-orange text-white font-black py-5 rounded-3xl text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all mt-4 uppercase cursor-pointer">
            {loading ? '...' : 'SİSTEME GİR 🚀'}
          </button>
        </form>

        {/* --- İŞTE O EKSİK LİNK --- */}
        <div className="mt-10 pt-6 border-t-2 border-dashed border-gray-100">
           <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">Henüz hesabın yok mu?</p>
           <Link href="/signup" className="text-tegv-navy font-black uppercase text-xs tracking-widest underline hover:text-tegv-orange transition-colors">
              Eğitmen Olarak Kayıt Ol ✨
           </Link>
        </div>
      </div>
    </main>
  );
}