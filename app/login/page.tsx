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
      setLoading(false);
      return;
    }

    // ROL KONTROLÜ: Eğer bu mail students tablosunda varsa, bu eğitmen değildir.
    const { data: studentRecord } = await supabase.from('students').select('email').eq('email', cleanEmail).single();

    if (studentRecord) {
      await supabase.auth.signOut();
      alert("Sen bir öğrencisin! Lütfen Öğrenci Girişi sayfasını kullan. 🎒");
      router.push('/student-login');
    } else {
      router.push('/dashboard'); 
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-tegv-navy flex items-center justify-center p-6 text-center">
      <div className="bg-white w-full max-w-md rounded-[60px] shadow-2xl p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-tegv-orange rounded-bl-[100px] -mr-10 -mt-10 opacity-20"></div>
        <Link href="/" className="text-tegv-navy font-black text-[10px] uppercase tracking-widest block mb-8">← Ana Sayfa</Link>
        <div className="text-7xl mb-6">🧑‍🏫</div>
        <h1 className="text-4xl font-black text-tegv-navy uppercase tracking-tighter mb-10 leading-none">EĞİTMEN <span className="text-tegv-orange">GİRİŞİ</span></h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Adresin" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifren" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          <button type="submit" disabled={loading} className="w-full bg-tegv-orange text-white font-black py-5 rounded-3xl text-2xl shadow-xl hover:scale-105 transition-all mt-4 uppercase">{loading ? '...' : 'SİSTEME GİR 🚀'}</button>
        </form>
      </div>
    </main>
  );
}