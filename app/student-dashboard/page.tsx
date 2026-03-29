"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis, Tooltip } from 'recharts';

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [myAttendance, setMyAttendance] = useState<any[]>([]);
  
  // --- CHATBOT STATELERİ ---
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/student-login');
      } else {
        const { data: info } = await supabase.from('students').select('*').eq('email', user.email?.toLowerCase().trim()).single();
        if (info) { 
          setUser(user); 
          setStudentInfo(info); 
          fetchStudentData(info.id); 
        } else { 
          router.push('/login'); 
        }
      }
    };
    checkUser();
  }, []);

  const fetchStudentData = async (id: number) => {
    const { data: a } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
    const { data: l } = await supabase.from('attendance_logs').select('*').eq('student_id', id).order('created_at', { ascending: true });
    setAssignments(a || []); 
    setMyAttendance(l || []);
  };

  // --- 💬 BİLGE ATEŞ BÖCEĞİ (CHATBOT) FONKSİYONU ---
  const askChatbot = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = { role: "user", content: chatInput };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { 
              role: "system", 
              content: "Sen TEGV'de çocuklara yardımcı olan nazik, neşeli 'Bilge Ateş Böceği'sin. Cevapların kısa ve öğretici olsun." 
            },
            ...newHistory
          ],
          temperature: 0.6
        })
      });
      const data = await response.json();
      const aiMsg = { role: "assistant", content: data.choices[0].message.content };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (e) {
      alert("Ateş böceği şu an dinleniyor... ✨");
    }
    setChatLoading(false);
  };

  const attendanceData = myAttendance.map(l => ({ date: new Date(l.created_at).toLocaleDateString(), status: l.status === 'Geldi' ? 1 : 0 }));

  if (!user || !studentInfo) return <div className="min-h-screen bg-tegv-orange flex items-center justify-center text-white font-black animate-pulse text-4xl">BAHÇEN HAZIRLANIYOR...</div>;

  return (
    <main className="min-h-screen bg-[#FFFBEB] p-4 md:p-10 text-tegv-navy">
      <div className="max-w-6xl mx-auto">
        
        {/* ÜST BİLGİ */}
        <header className="bg-white p-8 rounded-[60px] shadow-2xl border-b-[15px] border-tegv-orange flex flex-col md:flex-row justify-between items-center mb-10">
          <div className="flex items-center gap-6">
            <div className="text-7xl">🧒</div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Selam, {studentInfo.name}!</h1>
          </div>
          <div className="bg-tegv-navy p-6 rounded-[40px] text-white text-center shadow-xl transform -rotate-2">
            <p className="text-white/40 text-[9px] font-black uppercase">Puanın</p>
            <p className="text-4xl font-black italic">⭐ {studentInfo.points || 0}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* SOL KOLON: GRAFİK + ROZETLER + AI RAPORU */}
          <div className="lg:col-span-1 space-y-10">
            {/* YOKLAMA GRAFİĞİ */}
            <div className="bg-white p-8 rounded-[60px] shadow-2xl border-t-[10px] border-blue-400">
               <h3 className="text-center font-black uppercase mb-4 text-sm tracking-widest">Katılım Karnem</h3>
               <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData}>
                       <Bar dataKey="status">
                          {attendanceData.map((e, i) => <Cell key={i} fill={e.status === 1 ? '#22c55e' : '#ef4444'} />)}
                       </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               <p className="text-[9px] text-center font-black uppercase text-gray-300 mt-4 italic">Yeşil çubuklar katıldığın dersleri gösterir ✨</p>
            </div>

            {/* ROZETLER */}
            <div className="bg-white p-8 rounded-[60px] shadow-2xl border-t-[10px] border-tegv-navy">
              <h3 className="font-black uppercase mb-6 text-center text-sm tracking-widest">🏆 Başarıların</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.isArray(studentInfo.badges) && studentInfo.badges.length > 0 ? 
                  studentInfo.badges.map((r: string, i: number) => (<div key={i} className="bg-tegv-navy text-white px-4 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest animate-bounce">{r}</div>))
                  : <p className="text-gray-300 font-bold text-[10px] uppercase italic">Henüz rozet yok... ✨</p>}
              </div>
            </div>
            
            {/* AI RAPORU */}
            {studentInfo.ai_report && (
               <div className="bg-tegv-orange p-8 rounded-[60px] shadow-2xl text-white relative overflow-hidden">
                 <h3 className="text-xl font-black uppercase tracking-tighter mb-4">✨ Gelişim Özeti:</h3>
                 <p className="font-bold text-sm leading-relaxed italic">&quot;{studentInfo.ai_report}&quot;</p>
               </div>
            )}
          </div>

          {/* SAĞ KOLON: CHATBOT + ÖDEVLER */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* 💬 BİLGE ATEŞ BÖCEĞİ (CHATBOT) */}
            <div className="bg-tegv-navy p-8 rounded-[60px] shadow-2xl border-b-[15px] border-tegv-orange text-white">
               <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">💡 Bilge Ateş Böceği</h3>
               <div className="h-64 overflow-y-auto mb-6 space-y-4 pr-2 custom-scrollbar">
                  {chatHistory.length === 0 && <p className="text-white/40 text-xs italic">Merhaba! Merak ettiğin her şeyi sorabilirsin.</p>}
                  {chatHistory.map((chat, i) => (
                    <div key={i} className={`p-4 rounded-[25px] text-xs font-bold leading-relaxed ${chat.role === 'user' ? 'bg-white/10 ml-12 rounded-br-none' : 'bg-tegv-orange mr-12 rounded-bl-none shadow-lg'}`}>
                       {chat.content}
                    </div>
                  ))}
                  {chatLoading && <div className="text-[10px] animate-pulse text-tegv-orange font-black">Düşünüyorum... 🧠</div>}
               </div>
               <div className="flex gap-2">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && askChatbot()} placeholder="Bana bir şey sor..." className="flex-1 bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-sm outline-none focus:border-tegv-orange transition-all" />
                  <button onClick={askChatbot} disabled={chatLoading} className="bg-tegv-orange p-4 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl font-black uppercase text-xs">SOR 🚀</button>
               </div>
            </div>

            {/* ÖDEVLER */}
            <h2 className="text-4xl font-black uppercase tracking-tighter ml-4">📚 Ödevlerim</h2>
            {assignments.length === 0 && <p className="text-center py-20 opacity-30 font-black uppercase italic">Henüz ödev verilmemiş...</p>}
            {assignments.map((a) => (
              <div key={a.id} className="bg-white p-10 rounded-[60px] shadow-xl border-l-[15px] border-tegv-orange group overflow-hidden">
                <p className="text-[10px] font-black text-tegv-orange uppercase mb-4">{new Date(a.created_at).toLocaleDateString()}</p>
                <p className="text-2xl font-bold italic mb-8 leading-relaxed">&quot;{a.content}&quot;</p>
                {a.file_url && <a href={a.file_url} target="_blank" className="p-6 bg-tegv-light rounded-[30px] flex items-center gap-4 hover:bg-tegv-orange/10 transition-all shadow-inner"><span className="text-5xl">📄</span><p className="font-black text-xs uppercase underline italic">Ödev Belgesini Gör</p></a>}
              </div>
            ))}
          </div>

        </div>
      </div>
    </main>
  );
}