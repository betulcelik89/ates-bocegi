"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function StudentSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    // 1. Önce Auth kaydı
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (authError) {
      alert("Hata: " + authError.message);
    } else {
      // 2. Tabloya e-posta ile birlikte kesin kayıt
      const { error: dbError } = await supabase.from('students').insert([
        { 
          name: name, 
          email: cleanEmail, 
          points: 10, 
          attendance_status: 'Yeni Işık' 
        }
      ]);

      if (dbError) {
        alert("Tablo Kayıt Hatası: " + dbError.message);
      } else {
        alert("Kayıt Başarılı! Şimdi giriş yapabilirsin ✨");
        router.push('/student-login');
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-tegv-orange flex items-center justify-center p-6 text-center">
      <div className="bg-white w-full max-w-md rounded-[60px] shadow-2xl p-12 relative overflow-hidden">
        <Link href="/student-login" className="text-tegv-navy font-black text-[10px] uppercase tracking-widest block mb-8">← Geri Dön</Link>
        <div className="text-7xl mb-4">🌟</div>
        <h1 className="text-4xl font-black text-tegv-navy uppercase tracking-tighter mb-10 leading-none">YENİ <span className="text-tegv-orange">IŞIK</span> OL</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adın Soyadın" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Posta Adresin" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifren" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          <button type="submit" disabled={loading} className="w-full bg-tegv-orange text-white font-black py-5 rounded-3xl text-2xl shadow-xl hover:scale-105 transition-all mt-4 uppercase">{loading ? '...' : 'HESAP OLUŞTUR 🚀'}</button>
        </form>
      </div>
    </main>
  );
}