"use client";
import React, { useState, useEffect } from "react";

export default function SweetPudiGame() {
  const [gameState, setGameState] = useState("START");
  const [pudiMesaj, setPudiMesaj] = useState("");
  const [input, setInput] = useState("");
  const [rozet, setRozet] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gecmis, setGecmis] = useState<any[]>([]);

  const oyunuBaslat = () => {
    setGameState("PLAYING");
    hamleYap([{ role: "user", content: "Merhaba Pudi! Oyun başlasın!" }]);
  };

  const hamleYap = async (yeniGecmis: any[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/pudi", {
        method: "POST",
        body: JSON.stringify({ gecmis: yeniGecmis }),
      });
      const data = await res.json();
      setPudiMesaj(data.cevap);
      setGecmis([...yeniGecmis, { role: "assistant", content: data.cevap }]);
      if (data.cevap.toLowerCase().includes("fıstık") || data.cevap.toLowerCase().includes("rozet")) {
        setRozet(prev => prev + 1);
      }
    } catch (e) {
      setPudiMesaj("Hortumum tıkandı! Tekrar deneyelim mi?");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="game-container">
      {/* 1. ARKA PLAN (Güneşli Bahçe) */}
      <div className="sky">
        <div className="sun"></div>
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
      </div>
      <div className="grass"></div>

      {/* 2. ÜST PANEL (Skor) */}
      <div className="score-badge">
        🥜 FISTIKLARIM: {rozet}
      </div>

      {/* 3. ANA OYUN ALANI */}
      <div className="main-stage">
        
        {/* PUDİ (SOLDA) */}
        <div className={`pudi-wrapper ${loading ? 'is-thinking' : 'is-idle'}`}>
          <img src="/pudi.png" alt="Fil Pudi" className="pudi-image" />
          <div className="shadow"></div>
        </div>

        {/* DİYALOG VE GİRİŞ (SAĞDA) */}
        {gameState === "START" ? (
          <div className="start-screen">
            <h1>PUDİ'NİN DÜNYASI</h1>
            <button onClick={oyunuBaslat} className="start-btn">OYUNA BAŞLA! 🐘</button>
          </div>
        ) : (
          <div className="dialogue-section">
            <div className="speech-bubble">
              <div className="bubble-label">FİL PUDİ</div>
              <p>{loading ? "Hortumumla düşünüyorum... 🐘💭" : pudiMesaj}</p>
            </div>

            <div className="input-group">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && hamleYap([...gecmis, { role: "user", content: input }])}
                placeholder="Cevabını buraya yaz..."
              />
              <button onClick={() => hamleYap([...gecmis, { role: "user", content: input }])}>GÖNDER</button>
            </div>
          </div>
        )}
      </div>

      {/* TÜM TASARIM VE ANİMASYONLAR (CSS) */}
      <style jsx>{`
        .game-container {
          position: fixed; inset: 0; overflow: hidden;
          background: linear-gradient(to bottom, #87ceeb, #e0f2fe);
          font-family: 'Arial Round', sans-serif;
        }
        
        /* GÖKYÜZÜ VE BAHÇE */
        .sky { position: absolute; width: 100%; height: 60%; }
        .sun { position: absolute; top: 40px; right: 60px; width: 80px; height: 80px; background: #ffce00; border-radius: 50%; box-shadow: 0 0 40px #ffce00; }
        .grass { position: absolute; bottom: 0; width: 100%; height: 40%; background: #52c234; border-top: 10px solid #45a02e; }
        
        .cloud { position: absolute; background: white; border-radius: 50px; opacity: 0.8; }
        .cloud-1 { width: 150px; height: 60px; top: 100px; left: 10%; animation: float 20s infinite linear; }
        .cloud-2 { width: 120px; height: 50px; top: 150px; right: 20%; animation: float 25s infinite linear reverse; }

        @keyframes float { from { transform: translateX(-100px); } to { transform: translateX(100vw); } }

        /* SKOR */
        .score-badge {
          position: absolute; top: 20px; left: 20px; z-index: 100;
          background: #ffd700; padding: 15px 30px; border-radius: 50px;
          font-weight: 900; font-size: 24px; border: 4px solid white; box-shadow: 0 8px 0 #b48200;
        }

        /* OYUN ALANI */
        .main-stage {
          position: relative; z-index: 10; height: 100%;
          display: flex; align-items: center; justify-content: space-around; padding: 0 5%;
        }

        /* PUDİ GÖRSELİ VE ANİMASYONU */
        .pudi-wrapper { display: flex; flex-direction: column; align-items: center; }
        .pudi-image { width: 400px; height: auto; z-index: 20; transition: all 0.3s; }
        .is-idle { animation: breathe 3s infinite ease-in-out; }
        .is-thinking { animation: bounce 0.5s infinite; }
        
        .shadow { width: 200px; height: 20px; background: rgba(0,0,0,0.2); border-radius: 50%; margin-top: -20px; }

        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }

        /* BAŞLA EKRANI */
        .start-screen { text-align: center; }
        .start-screen h1 { font-size: 80px; color: #ff4500; text-shadow: 4px 4px 0 white; margin-bottom: 30px; }
        .start-btn { padding: 25px 60px; font-size: 30px; font-weight: 900; background: #32cd32; color: white; border: none; border-radius: 100px; cursor: pointer; box-shadow: 0 10px 0 #228b22; }

        /* DİYALOG BÖLÜMÜ */
        .dialogue-section { width: 50%; display: flex; flex-direction: column; gap: 20px; }
        .speech-bubble {
          background: white; padding: 30px; border-radius: 40px; border: 8px solid #ffd700;
          box-shadow: 0 15px 0 rgba(0,0,0,0.1); position: relative;
        }
        .bubble-label { position: absolute; top: -30px; left: 30px; background: #ff4500; color: white; padding: 5px 20px; border-radius: 15px; font-weight: bold; }
        .speech-bubble p { font-size: 26px; font-weight: 800; color: #333; margin: 0; line-height: 1.4; }

        .input-group { display: flex; gap: 10px; }
        .input-group input { flex: 1; padding: 20px 30px; border-radius: 100px; border: 6px solid #1e90ff; font-size: 20px; font-weight: bold; outline: none; }
        .input-group button { background: #ff4500; color: white; padding: 0 40px; border-radius: 100px; border: none; font-size: 20px; font-weight: 900; cursor: pointer; border-bottom: 10px solid #b22222; }
      `}</style>
    </div>
  );
}