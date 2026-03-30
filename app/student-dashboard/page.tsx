"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Eksik olan import eklendi
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

// --- 🌳 GELİŞİM AŞAMALARI (SVG TASARIMLARI) ---
const TreeStages = ({ points }: { points: number }) => {
  if (points < 20) {
    return (
      <svg viewBox="0 0 200 200" className="w-48 h-48 animate-pulse">
        <rect x="70" y="150" width="60" height="40" fill="#92400E" rx="5" />
        <circle cx="100" cy="140" r="20" fill="#4ade80" className="animate-bounce" />
        <text x="75" y="130" fontSize="10" className="font-black fill-teal-600 uppercase">Filizleniyor...</text>
      </svg>
    );
  } else if (points < 50) {
    return (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <path d="M100 150 L100 100" stroke="#4B2C20" strokeWidth="8" strokeLinecap="round" />
        <path d="M100 110 Q130 90 140 110" fill="#22c55e" className="animate-bounce" />
        <path d="M100 120 Q70 100 60 120" fill="#4ade80" />
        <circle cx="100" cy="150" r="10" fill="#92400E" />
      </svg>
    );
  } else if (points < 100) {
    return (
      <svg viewBox="0 0 200 200" className="w-64 h-64 transition-all duration-1000">
        <path d="M100 160 L100 80" stroke="#4B2C20" strokeWidth="12" strokeLinecap="round" />
        <circle cx="100" cy="70" r="40" fill="#16a34a" className="animate-pulse" />
        <circle cx="120" cy="90" r="30" fill="#22c55e" />
        <circle cx="80" cy="90" r="30" fill="#4ade80" />
        <circle cx="110" cy="60" r="10" fill="#fbbf24" className="animate-bounce" />
      </svg>
    );
  } else {
    return (
      <svg viewBox="0 0 200 200" className="w-80 h-80 drop-shadow-2xl">
        <defs>
          <linearGradient id="trunk" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor:'#3d1d11'}} />
            <stop offset="100%" style={{stopColor:'#5d3d31'}} />
          </linearGradient>
        </defs>
        <path d="M100 170 C80 170 80 120 100 80 C120 120 120 170 100 170" fill="url(#trunk)" />
        <circle cx="100" cy="60" r="50" fill="#15803d" />
        <circle cx="140" cy="80" r="40" fill="#16a34a" className="animate-pulse" />
        <circle cx="60" cy="80" r="40" fill="#16a34a" />
        <circle cx="100" cy="90" r="45" fill="#15803d" opacity="0.8" />
        <path d="M130 50 Q135 45 140 50" stroke="white" fill="none" strokeWidth="2" className="animate-bounce" />
        <circle cx="80" cy="50" r="5" fill="#f87171" className="animate-ping" />
        <circle cx="120" cy="90" r="5" fill="#f87171" className="animate-ping" />
      </svg>
    );
  }
};

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [myAttendance, setMyAttendance] = useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const router = useRouter();

  const avatarlar = ['🧒', '🦸‍♂️', '🦸‍♀️', '🥷', '🧙‍♂️', '🧜‍♀️', '🤖', '🦊', '🦄', '🦁', '🚀'];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/student-login');
      else {
        const { data: info } = await supabase.from('students').select('*').eq('email', user.email?.toLowerCase().trim()).single();
        if (info) { 
          setUser(user); 
          setStudentInfo(info); 
          setNewName(info.name); 
          fetchStudentData(info.id); 
        }
        else router.push('/login');
      }
    };
    checkUser();
  }, []);

  const fetchStudentData = async (id: number) => {
    const { data: a } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
    const { data: l } = await supabase.from('attendance_logs').select('*').eq('student_id', id).order('created_at', { ascending: true });
    setAssignments(a || []); setMyAttendance(l || []);
  };

  const askChatbot = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = { role: "user", content: chatInput };
    setChatHistory(prev => [...prev, msg]); setChatInput(''); setChatLoading(true);
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: "Sen Bilge Ateş Böceği'sin. Çocuklara neşeli ve kısa cevaplar ver." }, ...chatHistory, msg] })
      });
      const d = await r.json();
      setChatHistory(prev => [...prev, { role: "assistant", content: d.choices[0].message.content }]);
    } catch (e) { alert("Ateş Böceği uykuda..."); }
    setChatLoading(false);
  };

  const updateAvatar = async (emoji: string) => {
    await supabase.from('students').update({ avatar_url: emoji }).eq('id', studentInfo.id);
    setStudentInfo({...studentInfo, avatar_url: emoji});
  };

  if (!user || !studentInfo) return <div className="min-h-screen bg-tegv-orange flex items-center justify-center text-white font-black animate-pulse text-4xl">GELİYOR...</div>;

  return (
    <main className="min-h-screen bg-[#F0FDFA] p-4 md:p-10 text-tegv-navy font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="bg-white p-8 rounded-[60px] shadow-2xl border-b-[15px] border-teal-500 flex justify-between items-center mb-10">
          <div className="flex items-center gap-6">
            <div className="text-7xl bg-teal-50 p-4 rounded-full border-4 border-teal-100">
              {studentInfo.avatar_url || '🧒'}
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black uppercase tracking-tighter">Merhaba {studentInfo.name}!</h1>
              <div className="flex gap-4 items-center">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="text-[10px] font-black uppercase text-teal-600 underline">👤 Profilimi Düzenle</button>
                <Link href="/student-dashboard/games" className="text-[10px] font-black uppercase text-orange-500 underline">🏝️ Pudi ile Macera Adası</Link>
              </div>
            </div>
          </div>
          <div className="bg-tegv-navy p-6 rounded-[40px] text-white text-center shadow-2xl border-t-4 border-teal-400 transform -rotate-2">
            <p className="text-4xl font-black italic">⭐ {studentInfo.points || 0}</p>
            <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Toplam Puan</p>
          </div>
        </header>

        {isProfileOpen && (
          <div className="bg-white p-10 rounded-[60px] shadow-2xl mb-10 border-4 border-teal-500 animate-in slide-in-from-top duration-500">
             <h2 className="text-2xl font-black uppercase mb-6 text-center">Profil Ayarların</h2>
             <div className="flex flex-wrap justify-center gap-4 mb-10">
                {avatarlar.map(a => <button key={a} onClick={() => updateAvatar(a)} className={`text-5xl p-4 rounded-3xl transition-all ${studentInfo.avatar_url === a ? 'bg-teal-500 scale-110 shadow-lg' : 'bg-gray-50 hover:scale-105'}`}>{a}</button>)}
             </div>
             <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-gray-50 p-4 rounded-3xl font-bold outline-none" placeholder="İsmini Güncelle" />
                   <button onClick={async () => { await supabase.from('students').update({ name: newName }).eq('id', studentInfo.id); alert("Güncellendi!"); window.location.reload(); }} className="bg-tegv-navy text-white px-8 py-3 rounded-full font-black uppercase text-xs">Adımı Kaydet</button>
                </div>
                <div className="space-y-4">
                   <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Yeni Şifre" className="w-full bg-gray-50 p-4 rounded-3xl font-bold outline-none" />
                   <button onClick={async () => { await supabase.auth.updateUser({ password: newPass }); alert("Şifre değişti!"); setNewPass(''); }} className="bg-teal-500 text-white px-8 py-3 rounded-full font-black uppercase text-xs">Şifremi Değiştir</button>
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* --- SOL KOLON --- */}
          <div className="lg:col-span-1 space-y-10">
            <div className="bg-white p-10 rounded-[60px] shadow-2xl border-t-[12px] border-green-500 overflow-hidden relative">
               <div className="absolute top-4 right-6 bg-green-100 text-green-700 px-4 py-1 rounded-full font-black text-[10px] uppercase">Seviye {Math.floor((studentInfo.points || 0) / 50) + 1}</div>
               <h3 className="text-xl font-black uppercase mb-8 text-center text-green-800">Gelişim Ağacım</h3>
               <div className="flex justify-center items-center min-h-[300px] bg-gradient-to-b from-blue-50 to-green-50 rounded-[50px] shadow-inner border-4 border-white">
                  <TreeStages points={studentInfo.points || 0} />
               </div>
               <div className="mt-8 space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase text-green-800">
                     <span>Büyümeye Devam Et!</span>
                     <span>{studentInfo.points % 100}%</span>
                  </div>
                  <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden border-2 border-white shadow-sm">
                     <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${studentInfo.points % 100}%` }}></div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[60px] shadow-xl border-t-10 border-tegv-orange text-center">
               <h3 className="font-black uppercase mb-4 text-xs">🏆 Rozetlerin</h3>
               <div className="flex flex-wrap gap-2 justify-center">
                  {Array.isArray(studentInfo.badges) && studentInfo.badges.map((r: string, i: number) => <div key={i} className="bg-tegv-navy text-white px-3 py-2 rounded-xl font-black text-[9px] uppercase shadow-md animate-bounce">{r}</div>)}
               </div>
            </div>

            <div className="bg-tegv-navy p-8 rounded-[50px] shadow-2xl text-white">
               <h3 className="font-black uppercase mb-4 flex items-center gap-2 text-sm italic">💡 Bilge Ateş Böceği</h3>
               <div className="h-48 overflow-y-auto mb-4 space-y-3 pr-2 custom-scrollbar">
                  {chatHistory.map((c, i) => <div key={i} className={`p-3 rounded-2xl text-[11px] font-bold ${c.role === 'user' ? 'bg-white/10 ml-4' : 'bg-teal-500 mr-4 shadow-lg'}`}>{c.content}</div>)}
                  {chatLoading && <div className="text-[10px] animate-pulse text-teal-300">Düşünüyorum... 🧠</div>}
               </div>
               <div className="flex gap-1">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && askChatbot()} className="flex-1 bg-white/10 p-3 rounded-xl text-xs outline-none" placeholder="Bir şey sor..." />
                  <button onClick={askChatbot} className="bg-teal-500 p-3 rounded-xl hover:scale-110 shadow-lg">🚀</button>
               </div>
            </div>
          </div>

          {/* --- SAĞ KOLON --- */}
          <div className="lg:col-span-2 space-y-10">
            {studentInfo.ai_report && (
               <div className="bg-teal-600 p-10 rounded-[60px] shadow-2xl text-white relative overflow-hidden group">
                 <div className="absolute -right-10 -top-10 text-9xl opacity-10 group-hover:rotate-12 transition-transform">✨</div>
                 <h3 className="text-2xl font-black uppercase mb-4 italic tracking-tighter">Işığın Hakkında Bir Mesaj:</h3>
                 <p className="text-lg font-bold italic leading-relaxed text-teal-50">&quot;{studentInfo.ai_report}&quot;</p>
               </div>
            )}

            <h2 className="text-4xl font-black uppercase italic tracking-tighter ml-6">📚 Yeni Ödevlerim</h2>
            <div className="space-y-6">
              {assignments.length > 0 ? assignments.map((a) => (
                <div key={a.id} className="bg-white p-10 rounded-[60px] shadow-xl border-l-[20px] border-teal-500 hover:border-tegv-orange transition-all">
                  <p className="text-[10px] font-black text-teal-600 uppercase mb-4">{new Date(a.created_at).toLocaleDateString()}</p>
                  <p className="text-2xl font-bold italic mb-8">&quot;{a.content}&quot;</p>
                  {a.file_url && <a href={a.file_url} target="_blank" className="p-4 bg-teal-50 text-teal-700 rounded-[30px] inline-flex items-center gap-4 font-black uppercase text-xs">📂 Dosyayı Aç</a>}
                </div>
              )) : <div className="text-center p-10 bg-white rounded-[60px] font-bold text-gray-400">Şu an hiç ödevin yok, harikasın! 🎉</div>}
            </div>

            <div className="bg-white p-10 rounded-[60px] shadow-xl border-t-8 border-blue-400">
               <h3 className="text-xl font-black uppercase mb-6">Ders Katılım Geçmişim</h3>
               <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={myAttendance.map(l => ({ s: l.status === 'Geldi' ? 1 : 0 }))}>
                       <Bar dataKey="s" radius={[5, 5, 0, 0]}>
                          {myAttendance.map((e, i) => <Cell key={i} fill={e.status === 'Geldi' ? '#22c55e' : '#ef4444'} />)}
                       </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}