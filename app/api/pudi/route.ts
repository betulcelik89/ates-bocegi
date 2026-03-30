import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const ANAHTAR = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const groq = new Groq({ apiKey: ANAHTAR });

export async function POST(req: Request) {
  try {
    // Sadece son mesajı değil, tüm 'gecmis'i (history) alıyoruz
    const { gecmis } = await req.json();

    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `Sen Pudi adında sihirli bir yavru filsin. 
          - 8 yaşındaki çocuklara seviyelerine uygun (Matematik, Türkçe, Hayat Bilgisi) sorular soruyorsun.
          - ASLA aynı soruyu üst üste sorma. 
          - Eğer çocuk doğru bilirse 'TEBRİKLER! BİR FISTIK KAZANDIN!' de ve sonra YENİ VE FARKLI bir soruya geç.
          - Eğer yanlış bilirse nazikçe ipucu ver ve aynı soruyu tekrar sor.` 
        },
        ...gecmis // Konuşma geçmişini buraya ekliyoruz ki Pudi ne konuştuğumuzu hatırlasın
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8, // Daha yaratıcı ve farklı sorular sorması için artırdık
    });

    return NextResponse.json({ cevap: completion.choices[0].message.content });
  } catch (err: any) {
    return NextResponse.json({ cevap: "Hortumum karıştı: " + err.message }, { status: 500 });
  }
}