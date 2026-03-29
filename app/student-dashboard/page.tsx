"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

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

  const avatarlar = ['🦁', '🦊', '🐼', '🐨', '🦒', '🦋', '🐘', '🐧','⚡', '🔥', '❄️', '🌈', '🧙‍♂️', '🧜‍♀️', '🦕', '🐉', '👾'];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/student-login');
      else {
        const { data: info } = await supabase.from('students').select('*').eq('email', user.email?.toLowerCase().trim()).single();
        if (info) { setUser(user); setStudentInfo(info); setNewName(info.name); fetchStudentData(info.id); }
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
    <main className="min-h-screen bg-[#FFFBEB] p-4 md:p-10 text-tegv-navy">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white p-10 rounded-[60px] shadow-2xl border-b-[15px] border-tegv-orange flex justify-between items-center mb-10">
          <div className="flex items-center gap-6">
            <div className="text-7xl bg-tegv-light p-4 rounded-full">{studentInfo.avatar_url || '🧒'}</div>
            <div>
              <h1 className="text-4xl font-black uppercase">{studentInfo.name}!</h1>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="text-[10px] font-black uppercase text-tegv-orange underline">👤 Profilimi Düzenle</button>
            </div>
          </div>
          <div className="bg-tegv-navy p-6 rounded-[40px] text-white text-center transform -rotate-2">
            <p className="text-4xl font-black">⭐ {studentInfo.points || 0}</p>
          </div>
        </header>

        {isProfileOpen && (
          <div className="bg-white p-10 rounded-[60px] shadow-2xl mb-10 border-4 border-tegv-orange animate-in slide-in-from-top duration-500">
             <h2 className="text-2xl font-black uppercase mb-6 text-center">Profilimi Düzenle</h2>
             <div className="flex flex-wrap justify-center gap-4 mb-10">
                {avatarlar.map(a => <button key={a} onClick={() => updateAvatar(a)} className={`text-5xl p-4 rounded-3xl transition-all ${studentInfo.avatar_url === a ? 'bg-tegv-orange scale-110' : 'bg-tegv-light hover:scale-105'}`}>{a}</button>)}
             </div>
             <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <p className="font-black uppercase text-xs opacity-40">Adımı Değiştir</p>
                   <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-tegv-light p-4 rounded-3xl font-bold outline-none" />
                   <button onClick={async () => { await supabase.from('students').update({ name: newName }).eq('id', studentInfo.id); alert("İsim değişti!"); window.location.reload(); }} className="bg-tegv-navy text-white px-8 py-3 rounded-full font-black uppercase text-xs">Güncelle</button>
                </div>
                <div className="space-y-4">
                   <p className="font-black uppercase text-xs opacity-40">Şifremi Değiştir</p>
                   <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full bg-tegv-light p-4 rounded-3xl font-bold outline-none" />
                   <button onClick={async () => { await supabase.auth.updateUser({ password: newPass }); alert("Şifre değişti!"); setNewPass(''); }} className="bg-tegv-orange text-white px-8 py-3 rounded-full font-black uppercase text-xs">Şifreyi Değiştir</button>
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-10">
            <div className="bg-white p-8 rounded-[60px] shadow-xl border-t-8 border-blue-400 text-center">
               <h3 className="font-black uppercase mb-4 text-xs">Yoklama Karnem</h3>
               <div className="h-20"><ResponsiveContainer width="100%" height="100%"><BarChart data={myAttendance.map(l => ({ s: l.status === 'Geldi' ? 1 : 0 }))}><Bar dataKey="s">{myAttendance.map((e, i) => <Cell key={i} fill={e.status === 'Geldi' ? '#22c55e' : '#ef4444'} />)}</Bar></BarChart></ResponsiveContainer></div>
            </div>
            <div className="bg-white p-8 rounded-[60px] shadow-2xl border-t-10 border-tegv-orange text-center">
               <h3 className="font-black uppercase mb-4 text-xs">🏆 Rozetlerin</h3>
               <div className="flex flex-wrap gap-2 justify-center">
                  {Array.isArray(studentInfo.badges) && studentInfo.badges.map((r: string, i: number) => <div key={i} className="bg-tegv-navy text-white px-3 py-1 rounded-xl font-black text-[9px] uppercase">{r}</div>)}
               </div>
            </div>
            <div className="bg-tegv-navy p-8 rounded-[50px] shadow-2xl text-white">
               <h3 className="font-black uppercase mb-4">💡 Bilge Ateş Böceği</h3>
               <div className="h-40 overflow-y-auto mb-4 space-y-2 text-[11px] pr-2">
                  {chatHistory.map((c, i) => <div key={i} className={`p-2 rounded-xl ${c.role === 'user' ? 'bg-white/10 ml-4' : 'bg-tegv-orange mr-4'}`}>{c.content}</div>)}
               </div>
               <div className="flex gap-1"><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-white/10 p-2 rounded-lg text-xs outline-none" placeholder="Soru sor..." /><button onClick={askChatbot} className="bg-tegv-orange p-2 rounded-lg text-xs">🚀</button></div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-black uppercase italic">📚 Yeni Ödevlerim</h2>
            {assignments.map((a) => (
              <div key={a.id} className="bg-white p-10 rounded-[60px] shadow-lg border-l-[15px] border-tegv-orange">
                <p className="text-[10px] font-black text-tegv-orange uppercase mb-2">{new Date(a.created_at).toLocaleDateString()}</p>
                <p className="text-xl font-bold italic mb-4 leading-relaxed">&quot;{a.content}&quot;</p>
                {a.file_url && <a href={a.file_url} target="_blank" className="p-3 bg-tegv-light rounded-2xl inline-flex font-black text-[10px] uppercase underline italic">Ödev Belgesini Gör</a>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}