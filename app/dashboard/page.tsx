"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('duvar');
  const [user, setUser] = useState<any>(null);
  const [teacherInfo, setTeacherInfo] = useState<any>({ full_name: '', bio: '', avatar_url: '🧑‍🏫' });
  const [posts, setPosts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [newAssignment, setNewAssignment] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [tempNote, setTempNote] = useState<{ [key: number]: string }>({});
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<'post' | 'assignment' | null>(null);

  const router = useRouter();
  const avatarlar = ['🧑‍🏫', '👩‍🏫', '🎨', '🧠', '🚀', '🌟', '💡'];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login');
      else {
        const { data: isStudent } = await supabase.from('students').select('email').eq('email', user.email?.toLowerCase().trim()).single();
        if (isStudent) router.push('/student-dashboard');
        else { 
          setUser(user); 
          fetchTeacherProfile(user.id, user.email);
          fetchAllData(); 
        }
      }
    };
    checkUser();
  }, []);

  const fetchTeacherProfile = async (id: string, email: string | any) => {
    const { data } = await supabase.from('teachers').select('*').eq('id', id).maybeSingle();
    if (data) setTeacherInfo(data);
    else await supabase.from('teachers').insert([{ id, email, full_name: email.split('@')[0], avatar_url: '🧑‍🏫' }]);
  };

  const fetchAllData = async () => {
    const { data: p } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    const { data: s } = await supabase.from('students').select('*').order('name', { ascending: true });
    const { data: a } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
    const { data: l } = await supabase.from('attendance_logs').select('*').order('created_at', { ascending: false });
    setPosts(p || []); setStudents(s || []); setAssignments(a || []); setAttendanceLogs(l || []);
  };

  const handlePostShare = async () => {
    setLoading(true);
    let url = file ? await uploadFile(file) : null;
    await supabase.from('posts').insert([{ content: newPost, author: user.email, file_url: url }]);
    setNewPost(''); setFile(null); fetchAllData(); setLoading(false);
  };

  const handleAssignmentShare = async () => {
    setLoading(true);
    let url = file ? await uploadFile(file) : null;
    await supabase.from('assignments').insert([{ content: newAssignment, author: user.email, file_url: url }]);
    setNewAssignment(''); setFile(null); fetchAllData(); setLoading(false); alert("Ödev Gönderildi!");
  };

  const uploadFile = async (f: File) => {
    const name = `${Date.now()}_${f.name.replace(/\s+/g, '-').toLowerCase()}`;
    const { error } = await supabase.storage.from('ates-bocegi-files').upload(name, f);
    if (error) return null;
    return supabase.storage.from('ates-bocegi-files').getPublicUrl(name).data.publicUrl;
  };

  const deleteItem = async (id: number, table: 'posts' | 'assignments') => {
    if (confirm("Silinsin mi?")) { await supabase.from(table).delete().eq('id', id); fetchAllData(); }
  };

  const saveEdit = async () => {
    const table = editType === 'post' ? 'posts' : 'assignments';
    await supabase.from(table).update({ content: editContent }).eq('id', editingId);
    setEditingId(null); setEditType(null); fetchAllData();
  };

  const takeAttendance = async (s: any, status: string) => {
    await supabase.from('students').update({ attendance_status: status }).eq('id', s.id);
    await supabase.from('attendance_logs').insert([{ student_id: s.id, student_name: s.name, status }]);
    fetchAllData();
  };

  const giveBadge = async (s: any, b: string) => {
    const cb = Array.isArray(s.badges) ? s.badges : [];
    if (!cb.includes(b)) {
      await supabase.from('students').update({ badges: [...cb, b], points: (s.points || 0) + 15 }).eq('id', s.id);
      fetchAllData();
    }
  };

  const analyzeStudent = async (sid: number, sn: string, n: string) => {
    if (!n) return alert("Önce not yaz!");
    setLoading(true);
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: "Pedagog gibi 2 cümlede özetle." }, { role: "user", content: n }] })
      });
      const d = await r.json();
      await supabase.from('students').update({ ai_report: d.choices[0].message.content }).eq('id', sid);
      fetchAllData(); alert("AI Analizi Tamam!");
    } catch (e) { alert("AI Hatası"); }
    setLoading(false);
  };

  if (!user || !teacherInfo) return <div className="min-h-screen bg-tegv-navy flex items-center justify-center text-white font-black animate-pulse">YÜKLENİYOR...</div>;

  return (
    <main className="min-h-screen bg-tegv-light flex flex-col md:flex-row text-tegv-navy">
      <aside className="w-full md:w-64 bg-tegv-navy p-6 flex flex-col gap-4 shadow-xl shrink-0">
        <div className="text-white text-center mb-6"><div className="text-5xl mb-2">{teacherInfo.avatar_url}</div><h1 className="text-xl font-black uppercase">Ateş Böceği</h1></div>
        <nav className="flex flex-col gap-2">
          {['duvar', 'odev', 'sinif', 'rapor', 'materyal', 'profil'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === tab ? 'bg-tegv-orange text-white' : 'text-white/50 hover:bg-white/10'}`}>
              {tab === 'duvar' ? '🏠 Duvar' : tab === 'odev' ? '📚 Ödev Gönder' : tab === 'sinif' ? '🎒 Sınıf' : tab === 'rapor' ? '📊 Rapor' : tab === 'materyal' ? '📂 Arşiv' : '👤 Profil'}
            </button>
          ))}
        </nav>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="mt-auto text-white/30 text-[10px] font-black uppercase py-4">Çıkış 🚪</button>
      </aside>

      <section className="flex-1 p-6 md:p-12 overflow-y-auto">
        {/* PROFİL AYARLARI */}
        {activeTab === 'profil' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in">
            <div className="bg-white p-10 rounded-[60px] shadow-xl border-b-[15px] border-tegv-navy/10">
              <h2 className="text-3xl font-black uppercase mb-8 text-center">Profilimi Düzenle</h2>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                 {avatarlar.map(a => <button key={a} onClick={() => setTeacherInfo({...teacherInfo, avatar_url: a})} className={`text-4xl p-4 rounded-3xl transition-all ${teacherInfo.avatar_url === a ? 'bg-tegv-orange scale-110 shadow-lg' : 'bg-tegv-light hover:scale-105'}`}>{a}</button>)}
              </div>
              <div className="space-y-4">
                 <input type="text" value={teacherInfo.full_name} onChange={(e) => setTeacherInfo({...teacherInfo, full_name: e.target.value})} className="w-full bg-tegv-light p-4 rounded-3xl font-bold outline-none" placeholder="Adın Soyadın" />
                 <textarea value={teacherInfo.bio} onChange={(e) => setTeacherInfo({...teacherInfo, bio: e.target.value})} className="w-full bg-tegv-light p-4 rounded-3xl font-bold h-24 outline-none" placeholder="Biyografin..." />
                 <button onClick={async () => { await supabase.from('teachers').update(teacherInfo).eq('id', user.id); alert("Güncellendi!"); }} className="w-full bg-tegv-navy text-white py-4 rounded-full font-black uppercase text-xs">Değişiklikleri Kaydet</button>
              </div>
            </div>
            <div className="bg-white p-10 rounded-[60px] shadow-xl border-b-[15px] border-tegv-orange/10">
               <h3 className="font-black uppercase mb-4">Şifre Değiştir</h3>
               <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-tegv-light p-4 rounded-3xl mb-4" placeholder="Yeni Şifre" />
               <button onClick={async () => { await supabase.auth.updateUser({ password: newPassword }); alert("Şifre Değişti!"); setNewPassword(''); }} className="w-full bg-tegv-orange text-white py-4 rounded-full font-black text-xs uppercase">Şifreyi Güncelle</button>
            </div>
          </div>
        )}

        {/* DUVAR (SİLME VE DÜZENLEME AKTİF) */}
        {activeTab === 'duvar' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-xl border-b-[10px] border-tegv-navy/10">
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Mesaj..." className="w-full h-24 bg-tegv-light rounded-3xl p-4 font-bold outline-none mb-4" />
              <div className="flex justify-between items-center"><input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="text-[10px]" /><button onClick={handlePostShare} className="bg-tegv-navy text-white px-8 py-3 rounded-full font-black text-xs">PAYLAŞ</button></div>
            </div>
            {posts.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[30px] border-l-[12px] border-tegv-navy shadow-md relative group">
                {user.email === p.author && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => {setEditingId(p.id); setEditContent(p.content); setEditType('post');}} className="text-[9px] font-black bg-tegv-light px-3 py-1 rounded-full">DÜZENLE</button>
                    <button onClick={() => deleteItem(p.id, 'posts')} className="text-[9px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full">SİL</button>
                  </div>
                )}
                <p className="text-[10px] font-black opacity-20 uppercase mb-2">{p.author.split('@')[0]}</p>
                {editingId === p.id && editType === 'post' ? (
                  <div className="space-y-2"><textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-4 bg-tegv-light rounded-2xl font-bold" /><button onClick={saveEdit} className="bg-green-500 text-white px-4 py-1 rounded-lg text-[10px] font-black">KAYDET</button></div>
                ) : <p className="font-bold italic text-lg">&quot;{p.content}&quot;</p>}
                {p.file_url && <a href={p.file_url} target="_blank" className="mt-4 block text-[10px] font-black underline">📄 DOSYAYI AÇ</a>}
              </div>
            ))}
          </div>
        )}

        {/* ÖDEV GÖNDER (SİLME VE DÜZENLEME AKTİF) */}
        {activeTab === 'odev' && (
          <div className="space-y-6">
            <div className="bg-white p-10 rounded-[60px] shadow-2xl border-b-[15px] border-tegv-orange/20">
              <h3 className="text-xl font-black uppercase mb-4 text-center">Ödev Yayınla 🎒</h3>
              <textarea value={newAssignment} onChange={(e) => setNewAssignment(e.target.value)} className="w-full h-32 bg-tegv-light rounded-[30px] p-6 font-bold outline-none mb-4" placeholder="Ödev içeriği..." />
              <div className="flex justify-between items-center"><input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} /><button onClick={handleAssignmentShare} className="bg-tegv-orange text-white px-10 py-4 rounded-full font-black text-xs">YAYINLA 📢</button></div>
            </div>
            {assignments.map(a => (
              <div key={a.id} className="bg-white p-6 rounded-[30px] border-l-[12px] border-tegv-orange shadow-md relative group">
                {user.email === a.author && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => {setEditingId(a.id); setEditContent(a.content); setEditType('assignment');}} className="text-[9px] font-black bg-tegv-light px-3 py-1 rounded-full">DÜZENLE</button>
                    <button onClick={() => deleteItem(a.id, 'assignments')} className="text-[9px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full">SİL</button>
                  </div>
                )}
                <p className="text-[10px] font-black text-tegv-orange uppercase mb-1">YAYINDA</p>
                {editingId === a.id && editType === 'assignment' ? (
                  <div className="space-y-2"><textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-4 bg-tegv-light rounded-2xl font-bold" /><button onClick={saveEdit} className="bg-green-500 text-white px-4 py-1 rounded-lg text-[10px] font-black">KAYDET</button></div>
                ) : <p className="text-xl font-bold">{a.content}</p>}
              </div>
            ))}
          </div>
        )}

        {/* SINIF & ROZET & AI */}
        {activeTab === 'sinif' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {students.map((s) => (
              <div key={s.id} className="bg-white p-8 rounded-[60px] shadow-xl border-t-[15px] border-tegv-orange text-center">
                <div className="text-7xl mb-4">{s.avatar_url || '🧒'}</div>
                <h3 className="text-2xl font-black uppercase mb-4">{s.name}</h3>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => takeAttendance(s, 'Geldi')} className={`flex-1 py-3 rounded-2xl font-black text-[10px] ${s.attendance_status === 'Geldi' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100'}`}>Geldi</button>
                  <button onClick={() => takeAttendance(s, 'Gelmedi')} className={`flex-1 py-3 rounded-2xl font-black text-[10px] ${s.attendance_status === 'Gelmedi' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100'}`}>Gelmedi</button>
                </div>
                <div className="bg-tegv-light p-4 rounded-3xl mb-4">
                   <textarea value={tempNote[s.id] || s.notes || ''} onChange={(e) => setTempNote({...tempNote, [s.id]: e.target.value})} className="w-full bg-white rounded-2xl p-2 text-[10px] mb-2 h-16 outline-none" placeholder="Not..." />
                   <div className="flex gap-2">
                      <button onClick={async () => { await supabase.from('students').update({ notes: tempNote[s.id] }).eq('id', s.id); alert("Kaydedildi!"); fetchAllData(); }} className="flex-1 bg-tegv-navy text-white py-2 rounded-xl text-[9px] font-black uppercase">Notu Kaydet</button>
                      <button onClick={() => analyzeStudent(s.id, s.name, tempNote[s.id] || s.notes)} className="flex-1 bg-tegv-orange text-white py-2 rounded-xl text-[9px] font-black uppercase">Analiz 🤖</button>
                   </div>
                </div>
                {s.ai_report && <div className="bg-orange-50 p-4 rounded-2xl mb-4 italic text-[10px] font-bold">✨ {s.ai_report}</div>}
                <div className="flex flex-wrap gap-1 justify-center border-t pt-4">
                   {['🎨', '🧬', '🤝', '📚'].map(r => <button key={r} onClick={() => giveBadge(s, r)} className={`p-2 rounded-full border ${Array.isArray(s.badges) && s.badges.includes(r) ? 'bg-tegv-navy' : 'bg-white'}`}>{r}</button>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RAPORLAR */}
        {activeTab === 'rapor' && (
          <div className="space-y-6">
            {students.map(s => {
              const h = attendanceLogs.filter(l => l.student_id === s.id).reverse();
              const d = h.map(l => ({ n: '', s: l.status === 'Geldi' ? 1 : 0 }));
              return (
                <div key={s.id} className="bg-white p-6 rounded-[40px] shadow-xl flex gap-6 items-center">
                  <div className="w-1/3"><h4 className="font-black uppercase text-sm">{s.name}</h4><p className="text-2xl font-black text-tegv-orange">%{h.length > 0 ? Math.round((h.filter(l => l.status === 'Geldi').length / h.length) * 100) : 0}</p></div>
                  <div className="w-2/3 h-16"><ResponsiveContainer width="100%" height="100%"><BarChart data={d}><Bar dataKey="s">{d.map((e, i) => <Cell key={i} fill={e.s === 1 ? '#22c55e' : '#ef4444'} />)}</Bar></BarChart></ResponsiveContainer></div>
                </div>
              );
            })}
          </div>
        )}

        {/* ARŞİV */}
        {activeTab === 'materyal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
             {[...posts, ...assignments].filter(i => i.file_url).map((item, i) => (
               <div key={i} className="bg-white p-6 rounded-[35px] shadow-lg border-2 border-tegv-navy/5 text-center">
                  <div className="text-4xl mb-4">{item.file_url.match(/\.(jpeg|jpg|png)$/) ? '🖼️' : '📄'}</div>
                  <p className="text-[9px] font-black uppercase text-gray-400 mb-4 truncate italic px-2">{item.content || "Belge"}</p>
                  <a href={item.file_url} target="_blank" className="bg-tegv-navy text-white text-center py-2 px-6 rounded-2xl font-black uppercase text-[10px]">Aç</a>
               </div>
             ))}
          </div>
        )}
      </section>
    </main>
  );
}