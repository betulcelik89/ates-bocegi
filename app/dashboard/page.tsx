"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardPage() {
  // --- TEMEL STATELER ---
  const [activeTab, setActiveTab] = useState('duvar');
  const [posts, setPosts] = useState<any[]>([]); 
  const [students, setStudents] = useState<any[]>([]); 
  const [assignments, setAssignments] = useState<any[]>([]); 
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]); 
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [newPost, setNewPost] = useState('');
  const [newAssignment, setNewAssignment] = useState('');
  const [tempNote, setTempNote] = useState<{ [key: number]: string }>({});

  // --- DÜZENLEME STATELERİ (POST VE ÖDEV İÇİN) ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<'post' | 'assignment' | null>(null);

  const router = useRouter();
  const ADMIN_EMAIL = "admin@tegv.org"; 

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login');
      else {
        const { data: isStudent } = await supabase.from('students').select('email').eq('email', user.email?.toLowerCase().trim()).single();
        if (isStudent) router.push('/student-dashboard');
        else { setUser(user); fetchAllData(); }
      }
    };
    checkUser();
  }, []);

  const fetchAllData = async () => {
    const { data: p } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    const { data: s } = await supabase.from('students').select('*').order('name', { ascending: true });
    const { data: a } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
    const { data: l } = await supabase.from('attendance_logs').select('*').order('created_at', { ascending: false });
    setPosts(p || []); setStudents(s || []); setAssignments(a || []); setAttendanceLogs(l || []);
  };

  const uploadFile = async (selectedFile: File) => {
    const safeName = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '-').toLowerCase()}`;
    const { error } = await supabase.storage.from('ates-bocegi-files').upload(safeName, selectedFile);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('ates-bocegi-files').getPublicUrl(safeName);
    return publicUrl;
  };

  // --- 🏠 DUVAR VE 📚 ÖDEV PAYLAŞIM ---
  const handlePostShare = async () => {
    setLoading(true);
    let fileUrl = file ? await uploadFile(file) : null;
    await supabase.from('posts').insert([{ content: newPost, author: user.email, file_url: fileUrl }]);
    setNewPost(''); setFile(null); fetchAllData(); setLoading(false);
  };

  const handleAssignmentShare = async () => {
    setLoading(true);
    let fileUrl = file ? await uploadFile(file) : null;
    await supabase.from('assignments').insert([{ content: newAssignment, author: user.email, file_url: fileUrl }]);
    setNewAssignment(''); setFile(null); fetchAllData(); setLoading(false);
    alert("Ödev yayınlandı! 📚");
  };

  // --- 🗑️ SİLME FONKSİYONLARI ---
  const deleteItem = async (id: number, table: 'posts' | 'assignments') => {
    if (confirm("Silmek istediğine emin misin?")) {
      await supabase.from(table).delete().eq('id', id);
      fetchAllData();
    }
  };

  // --- ✏️ DÜZENLEME FONKSİYONLARI ---
  const startEdit = (item: any, type: 'post' | 'assignment') => {
    setEditingId(item.id);
    setEditContent(item.content);
    setEditType(type);
  };

  const saveEdit = async () => {
    if (!editType || !editingId) return;
    const table = editType === 'post' ? 'posts' : 'assignments';
    await supabase.from(table).update({ content: editContent }).eq('id', editingId);
    setEditingId(null); setEditType(null); fetchAllData();
  };

  // --- ✅ YOKLAMA VE 🏆 ROZET ---
  const takeAttendance = async (student: any, status: string) => {
    await supabase.from('students').update({ attendance_status: status }).eq('id', student.id);
    await supabase.from('attendance_logs').insert([{ student_id: student.id, student_name: student.name, status: status }]);
    fetchAllData();
  };

  const giveBadge = async (student: any, badge: string) => {
    const currentBadges = Array.isArray(student.badges) ? student.badges : [];
    if (!currentBadges.includes(badge)) {
      await supabase.from('students').update({ badges: [...currentBadges, badge], points: (student.points || 0) + 15 }).eq('id', student.id);
      fetchAllData();
    }
  };

  // --- 🧠 AI ANALİZ ---
  const analyzeStudent = async (studentId: number, studentName: string, notes: string) => {
    if (!notes) return alert("Not yazmalısın!");
    setLoading(true);
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: "Sen bir pedagogsun. Gelişimi 2 kısa cümlede özetle." }, { role: "user", content: `${studentName}: ${notes}` }]
        })
      });
      const resData = await response.json();
      await supabase.from('students').update({ ai_report: resData.choices[0].message.content }).eq('id', studentId);
      fetchAllData();
      alert("AI Analizi Tamamlandı!");
    } catch (e) { alert("AI Hatası!"); }
    setLoading(false);
  };

  if (!user) return <div className="min-h-screen bg-tegv-navy flex items-center justify-center text-white font-black animate-pulse">YÜKLENİYOR...</div>;

  return (
    <main className="min-h-screen bg-tegv-light flex flex-col md:flex-row text-tegv-navy font-sans">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-tegv-navy p-6 flex flex-col gap-4 shadow-xl shrink-0">
        <div className="text-white text-center mb-6"><div className="text-5xl mb-2">💡</div><h1 className="text-xl font-black uppercase tracking-tighter">Ateş Böceği</h1></div>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('duvar')} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === 'duvar' ? 'bg-tegv-orange text-white shadow-lg' : 'text-white/60 hover:bg-white/10'}`}>🏠 Gönüllü Duvarı</button>
          <button onClick={() => setActiveTab('odev')} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === 'odev' ? 'bg-tegv-orange text-white shadow-lg' : 'text-white/60 hover:bg-white/10'}`}>📚 Ödev Gönder</button>
          <button onClick={() => setActiveTab('sinif')} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === 'sinif' ? 'bg-tegv-orange text-white shadow-lg' : 'text-white/60 hover:bg-white/10'}`}>🎒 Sınıf & Rozet</button>
          <button onClick={() => setActiveTab('rapor')} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === 'rapor' ? 'bg-tegv-orange text-white shadow-lg' : 'text-white/60 hover:bg-white/10'}`}>📊 Yoklama Takibi</button>
          <button onClick={() => setActiveTab('materyal')} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === 'materyal' ? 'bg-tegv-orange text-white shadow-lg' : 'text-white/60 hover:bg-white/10'}`}>📂 Materyal Arşivi</button>
        </nav>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="mt-auto text-white/30 text-[10px] font-black uppercase tracking-widest py-4 border-t border-white/10">Güvenli Çıkış 🚪</button>
      </aside>

      {/* ANA İÇERİK */}
      <section className="flex-1 p-6 md:p-12 overflow-y-auto">
        <h2 className="text-4xl font-black uppercase mb-10 italic border-b-4 border-tegv-orange inline-block leading-none">
          {activeTab === 'duvar' ? 'Gönüllü Paylaşım' : activeTab === 'odev' ? 'Ödev Merkezi' : activeTab === 'sinif' ? 'Öğrenci Yönetimi' : activeTab === 'rapor' ? 'Katılım Geçmişi' : 'Arşiv'}
        </h2>

        {/* --- 1. DUVAR --- */}
        {activeTab === 'duvar' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl border-b-[15px] border-tegv-navy/10">
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Mesaj yaz..." className="w-full h-32 bg-tegv-light rounded-[30px] p-6 font-bold outline-none mb-4 resize-none" />
              <div className="flex justify-between items-center"><input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="text-[10px] font-black" /><button onClick={handlePostShare} disabled={loading} className="bg-tegv-navy text-white px-10 py-3 rounded-full font-black text-xs uppercase shadow-xl">Paylaş 🚀</button></div>
            </div>
            {posts.map(p => (
              <div key={p.id} className="bg-white p-8 rounded-[40px] shadow-lg border-l-[15px] border-tegv-navy relative group">
                {(user.email === p.author || user.email === ADMIN_EMAIL) && (
                  <div className="absolute top-6 right-8 flex gap-2">
                    <button onClick={() => startEdit(p, 'post')} className="text-[9px] font-black bg-tegv-light px-3 py-1 rounded-full">DÜZENLE</button>
                    <button onClick={() => deleteItem(p.id, 'posts')} className="text-[9px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full">SİL</button>
                  </div>
                )}
                <p className="text-[10px] font-black text-tegv-navy/30 uppercase mb-4">{p.author.split('@')[0]}</p>
                {editingId === p.id && editType === 'post' ? (
                  <div className="space-y-2"><textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-4 bg-tegv-light rounded-2xl font-bold" /><button onClick={saveEdit} className="bg-green-500 text-white px-4 py-1 rounded-lg text-[10px] font-black uppercase">Kaydet</button></div>
                ) : <p className="text-xl font-bold italic leading-relaxed">&quot;{p.content}&quot;</p>}
                {p.file_url && <div className="mt-4 rounded-3xl overflow-hidden border-4 border-tegv-light">{p.file_url.match(/\.(jpeg|jpg|png|gif)$/) ? <img src={p.file_url} className="w-full max-h-96 object-cover" /> : <a href={p.file_url} target="_blank" className="p-4 flex bg-tegv-light font-black text-xs uppercase">📄 Belgeyi Gör</a>}</div>}
              </div>
            ))}
          </div>
        )}

        {/* --- 2. ÖDEV --- */}
        {activeTab === 'odev' && (
          <div className="space-y-6 animate-in slide-in-from-top duration-500">
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border-b-[15px] border-tegv-orange/20">
               <h3 className="text-xl font-black uppercase mb-4">Öğrencilere Ödev Yayınla 🎒</h3>
               <textarea value={newAssignment} onChange={(e) => setNewAssignment(e.target.value)} placeholder="Ödev içeriğini yaz..." className="w-full h-32 bg-tegv-light rounded-[30px] p-6 outline-none font-bold mb-4" />
               <div className="flex justify-between items-center"><input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="text-[10px] font-black" /><button onClick={handleAssignmentShare} disabled={loading} className="bg-tegv-orange text-white px-10 py-4 rounded-full font-black text-xs uppercase shadow-xl">Yayınla 📢</button></div>
            </div>
            {assignments.map(a => (
              <div key={a.id} className="bg-white p-8 rounded-[40px] shadow-lg border-l-[15px] border-tegv-orange relative group">
                {(user.email === a.author || user.email === ADMIN_EMAIL) && (
                  <div className="absolute top-6 right-8 flex gap-2">
                    <button onClick={() => startEdit(a, 'assignment')} className="text-[9px] font-black bg-tegv-light px-3 py-1 rounded-full">DÜZENLE</button>
                    <button onClick={() => deleteItem(a.id, 'assignments')} className="text-[9px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full">SİL</button>
                  </div>
                )}
                <p className="text-[10px] font-black text-tegv-orange uppercase mb-1 italic">YAYINDA</p>
                {editingId === a.id && editType === 'assignment' ? (
                  <div className="space-y-2"><textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-4 bg-tegv-light rounded-2xl font-bold" /><button onClick={saveEdit} className="bg-green-500 text-white px-4 py-1 rounded-lg text-[10px] font-black uppercase">Kaydet</button></div>
                ) : <p className="text-xl font-bold italic leading-relaxed">{a.content}</p>}
                {a.file_url && <a href={a.file_url} target="_blank" className="text-xs font-black underline text-tegv-navy uppercase italic mt-4 block">Eki Gör</a>}
              </div>
            ))}
          </div>
        )}

        {/* --- 3. SINIF & ROZET & AI --- */}
        {activeTab === 'sinif' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {students.map((s) => (
              <div key={s.id} className="bg-white p-10 rounded-[60px] shadow-xl border-t-[15px] border-tegv-orange group">
                <div className="flex justify-between items-start mb-6"><div className="text-7xl group-hover:rotate-12 transition-all">🧒</div><div className="bg-tegv-light px-4 py-2 rounded-2xl font-black text-[10px] uppercase shadow-inner">⭐ {s.points || 0} Puan</div></div>
                <h3 className="text-3xl font-black uppercase mb-8 leading-none tracking-tighter">{s.name}</h3>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <button onClick={() => takeAttendance(s, 'Geldi')} className={`py-4 rounded-3xl font-black text-[10px] uppercase transition-all ${s.attendance_status === 'Geldi' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>Geldi</button>
                  <button onClick={() => takeAttendance(s, 'Gelmedi')} className={`py-4 rounded-3xl font-black text-[10px] uppercase transition-all ${s.attendance_status === 'Gelmedi' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>Gelmedi</button>
                </div>
                <div className="bg-tegv-light p-6 rounded-[40px] mb-6 space-y-4 shadow-inner">
                  <textarea value={tempNote[s.id] !== undefined ? tempNote[s.id] : (s.notes || '')} onChange={(e) => setTempNote({...tempNote, [s.id]: e.target.value})} placeholder="Gelişim notun..." className="w-full h-20 bg-white rounded-3xl p-4 outline-none text-xs font-bold shadow-inner" />
                  <div className="grid grid-cols-2 gap-2">
                     <button onClick={async () => { await supabase.from('students').update({ notes: tempNote[s.id] }).eq('id', s.id); alert("Kaydedildi!"); fetchAllData(); }} className="bg-tegv-navy text-white py-3 rounded-2xl text-[9px] font-black uppercase">Kaydet</button>
                     <button onClick={() => analyzeStudent(s.id, s.name, tempNote[s.id] || s.notes)} className="bg-tegv-orange text-white py-3 rounded-2xl text-[9px] font-black uppercase">AI Analiz</button>
                  </div>
                </div>
                {s.ai_report && <div className="bg-orange-50 p-6 rounded-[35px] border-2 border-tegv-orange/20 mb-6 italic text-[11px] font-bold shadow-sm">✨ {s.ai_report}</div>}
                <div className="flex flex-wrap gap-2 justify-center pt-4 border-t-2 border-dashed border-gray-100">
                  {['🎨 Sanatçı', '🧬 Kaşif', '🤝 Dost', '📚 Okur'].map(r => (
                    <button key={r} onClick={() => giveBadge(s, r)} className={`text-[9px] font-black px-3 py-2 rounded-full border-2 transition-all ${Array.isArray(s.badges) && s.badges.includes(r) ? 'bg-tegv-navy text-white' : 'text-gray-400'}`}>{r}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- 4. RAPOR --- */}
        {activeTab === 'rapor' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {students.map(s => {
              const studentHistory = attendanceLogs.filter(l => l.student_id === s.id).reverse();
              const chartData = studentHistory.map(l => ({ date: new Date(l.created_at).toLocaleDateString(), status: l.status === 'Geldi' ? 1 : 0 }));
              return (
                <div key={s.id} className="bg-white p-8 rounded-[50px] shadow-2xl flex flex-col md:flex-row gap-8 items-center border-2 border-tegv-navy/5">
                  <div className="w-full md:w-1/3 text-center md:text-left border-b md:border-b-0 md:border-r-2 border-tegv-light pb-4 md:pb-0 md:pr-4">
                     <h3 className="text-xl font-black uppercase text-tegv-navy">{s.name}</h3>
                     <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Ders Katılım Oranı</p>
                     <p className="text-3xl font-black text-tegv-orange">%{studentHistory.length > 0 ? Math.round((studentHistory.filter(l => l.status === 'Geldi').length / studentHistory.length) * 100) : 0}</p>
                  </div>
                  <div className="w-full md:w-2/3 h-32">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}><Bar dataKey="status">{chartData.map((e, i) => <Cell key={i} fill={e.status === 1 ? '#22c55e' : '#ef4444'} />)}</Bar></BarChart>
                     </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- 5. MATERYAL ARŞİVİ --- */}
        {activeTab === 'materyal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
             {[...posts, ...assignments].filter(i => i.file_url).map((item, i) => (
               <div key={i} className="bg-white p-8 rounded-[40px] shadow-xl border-2 border-tegv-navy/5 flex flex-col justify-between hover:scale-105 transition-all text-center">
                  <div className="text-5xl mb-4">{item.file_url.match(/\.(jpeg|jpg|png)$/) ? '🖼️' : '📄'}</div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-6 truncate italic px-4">{item.content || "Dosya"}</p>
                  <a href={item.file_url} target="_blank" className="bg-tegv-navy text-white text-center py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg">Görüntüle</a>
               </div>
             ))}
          </div>
        )}
      </section>
    </main>
  );
}