"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardPage() {
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

  const router = useRouter();

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
    const { data, error } = await supabase.storage.from('ates-bocegi-files').upload(safeName, selectedFile);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('ates-bocegi-files').getPublicUrl(safeName);
    return publicUrl;
  };

  // --- ÖDEV GÖNDERME ---
  const handleAssignmentShare = async () => {
    if (!newAssignment.trim()) return alert("Ödev içeriği boş olamaz!");
    setLoading(true);
    let fileUrl = file ? await uploadFile(file) : null;
    
    const { error } = await supabase.from('assignments').insert([
      { content: newAssignment, author: user.email, file_url: fileUrl }
    ]);

    if (!error) {
      alert("Ödev öğrencilere başarıyla iletildi! ✅");
      setNewAssignment(''); setFile(null); fetchAllData();
    } else {
      alert("Hata: " + error.message);
    }
    setLoading(false);
  };

  const handlePostShare = async () => {
    setLoading(true);
    let fileUrl = file ? await uploadFile(file) : null;
    await supabase.from('posts').insert([{ content: newPost, author: user.email, file_url: fileUrl }]);
    setNewPost(''); setFile(null); fetchAllData(); setLoading(false);
  };

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

  if (!user) return <div className="min-h-screen bg-tegv-navy flex items-center justify-center text-white font-black">Yükleniyor...</div>;

  return (
    <main className="min-h-screen bg-tegv-light flex flex-col md:flex-row text-tegv-navy">
      <aside className="w-full md:w-64 bg-tegv-navy p-6 flex flex-col gap-4 shadow-xl shrink-0">
        <div className="text-white text-center mb-6 text-2xl font-black italic">ATEŞ BÖCEĞİ 💡</div>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('duvar')} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === 'duvar' ? 'bg-tegv-orange text-white' : 'text-white/60 hover:bg-white/10'}`}>🏠 Duvar</button>
          <button onClick={() => setActiveTab('odev')} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === 'odev' ? 'bg-tegv-orange text-white' : 'text-white/60 hover:bg-white/10'}`}>📚 Ödev Gönder</button>
          <button onClick={() => setActiveTab('sinif')} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === 'sinif' ? 'bg-tegv-orange text-white' : 'text-white/60 hover:bg-white/10'}`}>🎒 Sınıf & Rozet</button>
          <button onClick={() => setActiveTab('rapor')} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === 'rapor' ? 'bg-tegv-orange text-white' : 'text-white/60 hover:bg-white/10'}`}>📊 Raporlar</button>
          <button onClick={() => setActiveTab('materyal')} className={`w-full text-left p-4 rounded-2xl font-black text-xs uppercase ${activeTab === 'materyal' ? 'bg-tegv-orange text-white' : 'text-white/60 hover:bg-white/10'}`}>📂 Materyaller</button>
        </nav>
      </aside>

      <section className="flex-1 p-6 md:p-12 overflow-y-auto">
        {activeTab === 'duvar' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-xl border-b-[10px] border-tegv-navy/10">
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Gönüllülere özel paylaşım..." className="w-full h-24 bg-tegv-light rounded-3xl p-4 outline-none font-bold" />
              <div className="flex justify-between items-center mt-4">
                <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="text-[10px] font-black" />
                <button onClick={handlePostShare} className="bg-tegv-navy text-white px-6 py-2 rounded-full text-xs font-black">PAYLAŞ</button>
              </div>
            </div>
            {posts.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[30px] shadow-md border-l-8 border-tegv-navy">
                <p className="text-[10px] font-black opacity-20 uppercase">{p.author.split('@')[0]}</p>
                <p className="font-bold italic mt-2">{p.content}</p>
                {p.file_url && <a href={p.file_url} target="_blank" className="text-[10px] font-black underline mt-4 block">Eki Gör 📄</a>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'odev' && (
          <div className="space-y-6">
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border-b-[15px] border-tegv-orange/20 text-center">
              <h3 className="text-xl font-black uppercase mb-4 italic">Öğrencilere Ödev Yayınla 🎒</h3>
              <textarea value={newAssignment} onChange={(e) => setNewAssignment(e.target.value)} placeholder="Öğrencilerin panelinde görünecek mesajı yaz..." className="w-full h-32 bg-tegv-light rounded-[30px] p-6 outline-none font-bold mb-4" />
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="text-[10px] font-black text-tegv-navy" />
                <button onClick={handleAssignmentShare} disabled={loading} className="bg-tegv-orange text-white px-10 py-4 rounded-full font-black uppercase text-sm shadow-xl">ÖDEVi YAYINLA 📢</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rapor' && (
          <div className="space-y-6">
            {students.map(s => {
              const studentHistory = attendanceLogs.filter(l => l.student_id === s.id).reverse();
              const chartData = studentHistory.map(l => ({ date: new Date(l.created_at).toLocaleDateString(), status: l.status === 'Geldi' ? 1 : 0 }));
              return (
                <div key={s.id} className="bg-white p-6 rounded-[40px] shadow-xl flex gap-6 items-center">
                  <div className="w-1/3"><h4 className="font-black uppercase text-sm">{s.name}</h4><p className="text-xs font-black text-tegv-orange">Katılım Oranı: %{studentHistory.length > 0 ? Math.round((studentHistory.filter(l => l.status === 'Geldi').length / studentHistory.length) * 100) : 0}</p></div>
                  <div className="w-2/3 h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}><Bar dataKey="status">{chartData.map((e, i) => <Cell key={i} fill={e.status === 1 ? '#22c55e' : '#ef4444'} />)}</Bar></BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'sinif' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {students.map(s => (
               <div key={s.id} className="bg-white p-8 rounded-[50px] shadow-xl border-t-[10px] border-tegv-orange">
                  <h3 className="font-black uppercase mb-4">{s.name}</h3>
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => takeAttendance(s, 'Geldi')} className={`flex-1 py-2 rounded-xl font-black text-[10px] ${s.attendance_status === 'Geldi' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>Geldi</button>
                    <button onClick={() => takeAttendance(s, 'Gelmedi')} className={`flex-1 py-2 rounded-xl font-black text-[10px] ${s.attendance_status === 'Gelmedi' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}>Gelmedi</button>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center border-t pt-4">
                    {['🎨 Sanatçı', '🧬 Kaşif', '🤝 Dost', '📚 Okur'].map(r => (
                      <button key={r} onClick={() => giveBadge(s, r)} className={`text-[8px] font-black px-2 py-1 rounded-full border ${Array.isArray(s.badges) && s.badges.includes(r) ? 'bg-tegv-navy text-white' : 'text-gray-400'}`}>{r}</button>
                    ))}
                  </div>
               </div>
             ))}
           </div>
        )}

        {activeTab === 'materyal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[...posts, ...assignments].filter(i => i.file_url).map((item, i) => (
               <div key={i} className="bg-white p-6 rounded-[35px] shadow-lg border-2 border-tegv-navy/5 text-center">
                  <div className="text-4xl mb-4">{item.file_url.match(/\.(jpeg|jpg|png)$/) ? '🖼️' : '📄'}</div>
                  <a href={item.file_url} target="_blank" className="bg-tegv-navy text-white text-center py-2 px-6 rounded-2xl font-black uppercase text-[10px]">Aç</a>
               </div>
             ))}
          </div>
        )}
      </section>
    </main>
  );
}