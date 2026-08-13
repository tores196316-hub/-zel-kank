import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db.js';

const router = Router();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiClient;
  } catch (err) {
    console.error('[AI Assistant] Error initializing GoogleGenAI:', err);
    return null;
  }
}

// Fallback smart knowledge base if API key is missing or offline
const KNOWLEDGE_BASE: Record<string, string> = {
  upload: `📸 **Resim Yükleme:**
- Ana sayfadaki veya "/yukle" sayfasındaki yükleme alanına resminizi sürükleyip bırakabilir, cihazınızdan seçebilir ya da panonuzdan (Ctrl+V) yapıştırabilirsiniz.
- Yükleme tamamlandığında doğrudan resim linki, paylaşım sayfası, BBCode (forumlar için) ve HTML kodları anında oluşturulur.`,

  limits: `📏 **Dosya & Format Limitleri:**
- **Desteklenen Formatlar:** JPG, PNG, WEBP, GIF, BMP, SVG.
- **Ücretsiz Plan:** Dosya başına 20 MB, günlük 50 adede kadar yükleme.
- **Premium Plan:** Dosya başına 50 MB, sınırsız günlük yükleme, öncelikli CDN hızı ve reklamsız deneyim.`,

  expiry: `⏳ **Saklama Süresi:**
- AnlıkResim üzerinde yüklenen resimler kurallarımıza aykırı olmadığı sürece **süresiz ve kalıcı** olarak saklanır. Silinme veya link kırılma riski yoktur.`,

  delete: `🗑️ **Resim Silme:**
- Üye olarak yükleme yaptıysanız **"Galerim"** veya **"Panelim"** sayfasından dilediğiniz resmi tek tıkla silebilirsiniz.
- Kayıtsız yüklemelerde yükleme sonrası verilen özel silme linkini (Delete Token) kullanabilirsiniz.`,

  direct_url: `🔗 **Direkt Link ve Kodlar:**
- **Direkt URL:** Resmin doğrudan CDN adresidir (örn. .jpg ile biter).
- **BBCode:** XenForo, vBulletin, phpBB vb. forumlarda resim göstermek için kullanılır.
- **HTML Kodu:** Web sitelerinize ve bloglarınıza resmi yerleştirmek için uygundur.
- **Markdown:** GitHub, Discord ve dokümantasyonlar için idealdir.`,

  premium: `💎 **Premium Avantajları:**
- 50 MB'a kadar büyük dosya yükleme
- Sınırsız günlük yükleme
- Özel klasörleme ve etiketleme
- Reklamsız ultra hızlı arayüz
- Öncelikli küresel Cloudinary CDN dağıtımı`,

  ctrl_v: `⚡ **Panodan Yapıştırma (Ctrl + V):**
- Ekran görüntüsü veya kopyalanmış resmi doğrudan sitede **Ctrl + V** tuşlarına basarak yükleyebilirsiniz. Dosyayı diskinize kaydetmenize gerek kalmaz!`,

  multi: `📂 **Toplu Resim Yükleme:**
- Tek seferde onlarca resmi aynı anda sürükleyip bırakabilir ya da dosya seçici ile toplu seçebilirsiniz. Tüm resimler sırayla hızlıca işlenir.`,

  security: `🔒 **Güvenlik ve Gizlilik:**
- Resimleriniz güvenli SSL protokolü ile iletilir ve yüksek güvenlikli depolama birimlerinde saklanır.
- Yalnızca paylaştığınız kişiler resimlerinizi görebilir. Dilediğiniz zaman silebilirsiniz.`,
};

function getLocalFallbackAnswer(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('ctrl') || q.includes('pano') || q.includes('yapıştır') || q.includes('paste')) {
    return KNOWLEDGE_BASE.ctrl_v;
  }
  if (q.includes('toplu') || q.includes('birden') || q.includes('çoklu') || q.includes('aynı anda')) {
    return KNOWLEDGE_BASE.multi;
  }
  if (q.includes('güven') || q.includes('gizli') || q.includes('ssl') || q.includes('kvkk')) {
    return KNOWLEDGE_BASE.security;
  }
  if (q.includes('yükle') || q.includes('upload') || q.includes('nasıl')) {
    return KNOWLEDGE_BASE.upload;
  }
  if (q.includes('limit') || q.includes('boyut') || q.includes('format') || q.includes('mb') || q.includes('kaç mb')) {
    return KNOWLEDGE_BASE.limits;
  }
  if (q.includes('silinir') || q.includes('sakla') || q.includes('süre') || q.includes('ne kadar')) {
    return KNOWLEDGE_BASE.expiry;
  }
  if (q.includes('sil') || q.includes('kaldır')) {
    return KNOWLEDGE_BASE.delete;
  }
  if (q.includes('direkt') || q.includes('bbcode') || q.includes('html') || q.includes('link') || q.includes('bağlantı')) {
    return KNOWLEDGE_BASE.direct_url;
  }
  if (q.includes('premium') || q.includes('ücret') || q.includes('fiyat') || q.includes('pro')) {
    return KNOWLEDGE_BASE.premium;
  }

  return `Merhaba! Ben **AnlıkResim AI Asistanıyım**. 

Resim yükleme, dosya limitleri, doğrudan bağlantı (Direct URL), BBCode/HTML kodları, galeri yönetimi veya Premium üyelik hakkında aklınıza takılan her şeyi bana sorabilirsiniz.

Size nasıl yardımcı olabilirim?`;
}

router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question, history } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Lütfen bir soru belirtin.' });
    }

    const trimmedQuestion = question.trim().slice(0, 500);

    // Fetch live system settings for up-to-date knowledge
    const settings = db.getSettings();
    const planLimits = {
      free: db.getPlanLimits('free'),
      pro: db.getPlanLimits('pro'),
    };

    const systemPrompt = `Sen AnlıkResim (Hızlı Yükle) platformunun resmi, yardımsever, cana yakın ve uzman AI Destek Asistanısın.

PLATFORM BİLGİLERİ VE KURALLARI:
- Site Başlığı: ${settings.site_title || 'AnlıkResim'}
- Site Açıklaması: ${settings.site_description || 'Işık Hızında Resim Yükleme ve Paylaşım'}
- Desteklenen formatlar: JPG, JPEG, PNG, WEBP, GIF, BMP, SVG.
- Ücretsiz Plan Limitleri: Maksimum dosya boyutu ${planLimits.free.max_file_size_mb} MB, günlük ${planLimits.free.daily_upload_limit} resim yükleme.
- Premium (Pro) Plan Limitleri: Maksimum dosya boyutu ${planLimits.pro.max_file_size_mb} MB, sınırsız günlük yükleme, özel klasörler, öncelikli CDN hızı ve reklamsız kullanım.
- Saklama Süresi: Yüklenen resimler kurallara aykırı olmadığı sürece süresiz ve kalıcı saklanır.
- Link Türleri: Direkt Bağlantı (Direct URL), Paylaşım Sayfası, HTML Gömme Kodu, Forumlar için BBCode, Markdown Kodu.
- Özellikler: Sürükle-bırak yükleme, panodan (Ctrl+V) yapıştırma, çoklu yükleme, kullanıcı paneli, albüm/klasör oluşturma, favorilere ekleme, görüntülenme ve indirme sayaçları, resim şikayet etme sistemi.
- Güvenlik: Yasalara aykırı, telif hakkı ihlali içeren veya zararlı içeriklerin yüklenmesi yasaktır.

YANITLAMA KURALLARI:
1. Yanıtlarını net, samimi, Türkçe ve iyi yapılandırılmış Markdown formatında ver.
2. Önemli terimleri kalın (bold) veya madde imleriyle vurgula.
3. Gereksiz uzun laf kalabalığından kaçın, doğrudan kullanıcıya en hızlı ve doğru çözümü sağla.
4. Gerekirse ilgili sayfalara yönlendir (Örn: "/yukle", "/galerim", "/premium", "/yardim").`;

    const client = getAiClient();

    if (!client) {
      // Return smart fallback answer when Gemini key is not configured
      const fallback = getLocalFallbackAnswer(trimmedQuestion);
      return res.json({
        answer: fallback,
        source: 'local_kb',
      });
    }

    // Format chat context if history is provided
    const contents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        if (msg.role === 'user' && typeof msg.text === 'string') {
          contents.push({ role: 'user', parts: [{ text: msg.text }] });
        } else if (msg.role === 'model' && typeof msg.text === 'string') {
          contents.push({ role: 'model', parts: [{ text: msg.text }] });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: trimmedQuestion }],
    });

    try {
      const aiResponse = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      const text = aiResponse.text || getLocalFallbackAnswer(trimmedQuestion);

      return res.json({
        answer: text,
        source: 'gemini',
      });
    } catch (apiErr) {
      console.warn('[AI Assistant] Gemini API call warning, using local KB fallback:', apiErr);
      const fallback = getLocalFallbackAnswer(trimmedQuestion);
      return res.json({
        answer: fallback,
        source: 'local_fallback',
      });
    }
  } catch (error: any) {
    console.error('[AI Assistant Router Error]:', error);
    return res.status(500).json({
      error: 'Asistan şu anda yanıt veremiyor. Lütfen biraz sonra tekrar deneyin.',
    });
  }
});

export default router;
