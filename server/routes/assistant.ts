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
  editor: `🎨 **Dahili Resim Editörü (Fotoğraf Düzenleme):**
- Yüklemeden önce veya resim detay sayfasından **"Resmi Düzenle"** butonuna tıklayarak doğrudan tarayıcınızda resimleri düzenleyebilirsiniz.
- **Özellikler:** Serbest veya oranlı (1:1, 4:3, 16:9) Kırpma, Sağa/Sola 90° Döndürme, Yatay Çevirme, Filtreler (Siyah-Beyaz, Sepya, Parlaklık, Kontrast, Doygunluk, Bulanıklık), Özel Metin Filigranı (Watermark) ve Yeniden Boyutlandırma.
- İstemci tarafında (HTML5 Canvas) sıfır kalite kaybıyla ve anında işlenir.`,

  security_encrypted: `🔒 **Şifreli ve Süreli Paylaşımlar:**
- **Şifre Koruması:** Resim yüklerken özel bir şifre belirleyebilirsiniz. Resmi yalnızca şifreyi bilen kişiler kilidi açarak görüntüleyebilir.
- **Süreli Saklama:** Resminizin 10 dakika, 1 saat, 24 saat veya 7 gün sonra otomatik olarak kalıcı silinmesini seçebilirsiniz.
- **🔥 Tek Seferlik Görüntüleme (Self-Destruct):** Karşı taraf resmi 1 kez açıp inceledikten sonra resim otomatik olarak sunucudan tamamen imha edilir!`,

  upload: `📸 **Resim Yükleme:**
- Ana sayfadaki veya "/yukle" sayfasındaki yükleme alanına resminizi sürükleyip bırakabilir, cihazınızdan seçebilir ya da panonuzdan (Ctrl+V) yapıştırabilirsiniz.
- Yükleme tamamlandığında doğrudan resim linki, paylaşım sayfası, BBCode (forumlar için) ve HTML kodları anında oluşturulur.`,

  limits: `📏 **Dosya & Format Limitleri:**
- **Desteklenen Formatlar:** JPG, PNG, WEBP, GIF, BMP, SVG.
- **Ücretsiz Plan:** Dosya başına 20 MB, günlük 50 adede kadar yükleme.
- **Premium Plan:** Dosya başına 50 MB, sınırsız günlük yükleme, öncelikli CDN hızı ve reklamsız deneyim.`,

  expiry: `⏳ **Saklama Süresi & Otomatik İmha:**
- Standart yüklemeler kurallarımıza aykırı olmadığı sürece **süresiz ve kalıcı** olarak saklanır.
- İsteğe bağlı olarak yükleme esnasında 10 dk, 1 saat, 24 saat, 7 gün veya "1 Görüntülemede Yok Ol" süresi seçebilirsiniz.`,

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
- Şifreli paylaşım ve tek kullanımlık kendini imha modları ile maksimum gizlilik sağlanır.`,

  railway: `🚀 **Railway & Canlı Dağıtım:**
- Sistemimiz sıfır zorunlu dış bağımlılıkla çalışacak şekilde tasarlanmıştır.
- Railway'e dağıtırken **hiçbir API Key zorunlu değildir**; yerel disk/JSON veritabanı otomatik çalışır.
- İsteğe bağlı olarak daha büyük ölçekler için \`GEMINI_API_KEY\` (gelişmiş yapay zeka yanıtları için) veya \`CLOUDINARY_URL\` (bulut CDN depolama için) Environment Variables bölümünden eklenebilir.`,
};

function getLocalFallbackAnswer(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('editör') || q.includes('düzenle') || q.includes('kırp') || q.includes('filtre') || q.includes('filigran') || q.includes('döndür') || q.includes('watermark')) {
    return KNOWLEDGE_BASE.editor;
  }
  if (q.includes('şifre') || q.includes('kilit') || q.includes('gizli') || q.includes('şifreli') || q.includes('tek sefer') || q.includes('kendini imha') || q.includes('imha')) {
    return KNOWLEDGE_BASE.security_encrypted;
  }
  if (q.includes('railway') || q.includes('deploy') || q.includes('api key') || q.includes('canlı') || q.includes('sunucu')) {
    return KNOWLEDGE_BASE.railway;
  }
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

Resim yükleme, **Dahili Fotoğraf Editörü**, **Şifreli & Kendini İmha Eden Paylaşımlar**, dosya limitleri, doğrudan bağlantı (Direct URL), BBCode/HTML kodları veya Premium üyelik hakkında aklınıza takılan her şeyi bana sorabilirsiniz.

Size nasıl yardımcı olabilirim?`;
}

router.post('/ask', async (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    if (settings.maintenance_mode) {
      return res.status(503).json({
        error: 'Sistem şu anda bakım modundadır.',
      });
    }
    if (settings.ai_assistant_enabled === false) {
      return res.status(403).json({
        error: 'AI Asistanı sistem yöneticisi tarafından geçici olarak devre dışı bırakılmıştır.',
      });
    }

    const { question, history } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Lütfen bir soru belirtin.' });
    }

    const trimmedQuestion = question.trim().slice(0, 500);

    // Fetch live plan limits for up-to-date knowledge
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
- Saklama Süresi: Yüklenen standart resimler kurallara aykırı olmadığı sürece süresiz ve kalıcı saklanır.
- Dahili Resim Editörü (YENİ): Yükleme öncesinde veya detay sayfasında resmi kırpma (1:1, 4:3, 16:9), 90° döndürme, yatay çevirme, filtreler (Siyah-Beyaz, Sepya, Parlaklık, Kontrast, Doygunluk, Bulanıklık), metin filigranı (watermark) ekleme ve boyutlandırma araçları mevcuttur.
- Şifreli ve Süreli Paylaşımlar (YENİ): Yükleme esnasında isteğe bağlı şifre belirleme, otomatik silinme süresi seçme (10 dk, 1 saat, 24 saat, 7 gün) ve 🔥 Tek Seferlik Görüntüleme (Self-Destruct / görüldükten sonra anında imha) özellikleri aktiftir.
- Link Türleri: Direkt Bağlantı (Direct URL), Paylaşım Sayfası, HTML Gömme Kodu, Forumlar için BBCode, Markdown Kodu.
- Özellikler: Sürükle-bırak yükleme, panodan (Ctrl+V) yapıştırma, çoklu yükleme, kullanıcı paneli, albüm/klasör oluşturma, favorilere ekleme, görüntülenme ve indirme sayaçları, resim şikayet etme sistemi.
- Railway & Dağıtım: Railway veya herhangi bir bulut sunucusunda çalıştırmak için zorunlu API key gerekmez; sistem yerel JSON veri tabanıyla sorunsuz çalışır. İstenirse GEMINI_API_KEY veya CLOUDINARY_URL eklenebilir.
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
        model: 'gemini-flash-latest',
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
