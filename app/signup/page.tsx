"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function TeacherSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    // 1. Sisteme kayıt (Auth)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
    });

    if (authError) {
      alert("Hata: " + authError.message);
    } else {
      // 2. Öğretmenler tablosuna kesin kayıt
      const { error: dbError } = await supabase.from('teachers').insert([
        { 
          id: authData.user?.id, 
          full_name: name, 
          email: cleanEmail, 
          avatar_url: '🧑‍🏫' 
        }
      ]);

      if (dbError) {
        alert("Veritabanı Hatası: " + dbError.message);
      } else {
        alert("Eğitmen Kaydı Başarılı! ✨ Şimdi giriş yapabilirsin.");
        router.push('/login');
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-tegv-navy flex items-center justify-center p-6 text-center">
      <div className="bg-white w-full max-w-md rounded-[60px] shadow-2xl p-12 relative overflow-hidden">
        <Link href="/login" className="text-tegv-navy font-black text-[10px] uppercase tracking-widest block mb-8">← Girişe Dön</Link>
        <div className="text-7xl mb-4">🧑‍🏫</div>
        <h1 className="text-3xl font-black text-tegv-navy uppercase tracking-tighter mb-10 leading-none">YENİ <span className="text-tegv-orange">EĞİTMEN</span> KAYDI</h1>
        
        <form onSubmit={handleSignup} className="space-y-4 text-left">
          <label className="text-[10px] font-black uppercase ml-4 opacity-40">Adın Soyadın</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Ahmet Yılmaz" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          
          <label className="text-[10px] font-black uppercase ml-4 opacity-40">E-Posta Adresin</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="gonullu@tegv.org" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          
          <label className="text-[10px] font-black uppercase ml-4 opacity-40">Şifre Belirle</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-6 py-4 rounded-3xl bg-tegv-light border-4 border-transparent focus:border-tegv-orange outline-none font-bold text-tegv-navy" required />
          
          <button type="submit" disabled={loading} className="w-full bg-tegv-orange text-white font-black py-5 rounded-3xl text-xl shadow-xl hover:scale-105 active:scale-95 transition-all mt-6 uppercase cursor-pointer">
            {loading ? 'KAYDEDİLİYOR...' : 'KAYDIMI TAMAMLA! 🚀'}
          </button>
        </form>
      </div>
    </main>
  );
}