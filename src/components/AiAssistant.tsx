import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  ChevronDown,
  ArrowRight,
  Upload,
  Crown,
  Images,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { assistantApi } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  action?: {
    label: string;
    path: string;
    icon?: string;
  };
}

interface QuickFaq {
  id: string;
  question: string;
  shortLabel: string;
  icon: React.ReactNode;
  instantAnswer: string;
  action?: {
    label: string;
    path: string;
  };
}

const INSTANT_FAQS: QuickFaq[] = [
  {
    id: 'how_upload',
    question: 'Nasıl hızlı resim yükleyebilirim?',
    shortLabel: 'Resim Yükleme',
    icon: <Upload className="w-3.5 h-3.5" />,
    instantAnswer: `**📸 Resim Yükleme Adımları:**
1. Ana sayfadaki veya **Yükle** sayfasındaki alana resminizi sürükleyip bırakın.
2. Ya da **"Resim Seç"** butonuna tıklayarak cihazınızdan dosya seçin.
3. Panonuzda kopyalanmış bir resim varsa doğrudan sayfada **Ctrl + V** (veya mobilde Yapıştır) yapabilirsiniz.
4. Yükleme tamamlandığında doğrudan bağlantı (Direct URL), Forum BBCode ve HTML kodları anında hazır olur!`,
    action: {
      label: 'Hemen Resim Yükle',
      path: '/yukle',
    },
  },
  {
    id: 'limits',
    question: 'Dosya boyutu ve format limitleri nelerdir?',
    shortLabel: 'Format & Limitler',
    icon: <Zap className="w-3.5 h-3.5" />,
    instantAnswer: `**📏 Boyut ve Format Limitleri:**
- **Desteklenen Formatlar:** JPG, JPEG, PNG, WEBP, GIF, BMP, SVG.
- **Ücretsiz Plan:** Dosya başına **20 MB**, günlük **50 adet** yükleme.
- **Premium Plan:** Dosya başına **50 MB**, **sınırsız** günlük yükleme, öncelikli CDN hızı.`,
    action: {
      label: 'Planları İncele',
      path: '/premium',
    },
  },
  {
    id: 'expiry',
    question: 'Yüklenen resimler ne kadar süre saklanır?',
    shortLabel: 'Saklama Süresi',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    instantAnswer: `**⏳ Kalıcı ve Süresiz Saklama:**
- AnlıkResim'e yüklenen tüm resimler kullanım koşullarını ihlal etmediği sürece **ömür boyu süresiz** olarak saklanır.
- Resimleriniz silinmez veya zaman aşımına uğramaz. Forumlarda, web sitelerinde veya projelerinizde güvenle kullanabilirsiniz.`,
  },
  {
    id: 'direct_url',
    question: 'Direkt link (Direct URL) ve BBCode nedir?',
    shortLabel: 'Direkt Link & BBCode',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    instantAnswer: `**🔗 Paylaşım Kodları Rehberi:**
- **Direkt Link:** \`.jpg\` veya \`.png\` ile biten doğrudan resim adresidir.
- **BBCode:** XenForo, vBulletin, phpBB gibi forumlarda resmi görsel olarak göstermek için \`[IMG]...[/IMG]\` formatıdır.
- **HTML:** Web sitelerine resim eklemek için \`<img src="..." />\` etiketidir.
- **Markdown:** Discord, GitHub ve dokümanlar için \`![Görsel](url)\` formatıdır.`,
  },
  {
    id: 'premium_perks',
    question: 'Premium üyeliğin avantajları nelerdir?',
    shortLabel: 'Premium Avantajları',
    icon: <Crown className="w-3.5 h-3.5" />,
    instantAnswer: `**💎 Premium (Pro) Üyelik Avantajları:**
- **50 MB** büyük dosya yükleme desteği
- **Sınırsız** günlük yükleme kapasitesi
- Özel klasörleme ve galeri organizasyonu
- Tamamen reklamsız, temiz ve ultra hızlı deneyim
- Küresel Cloudinary CDN ile öncelikli ultra hızlı resim dağıtımı`,
    action: {
      label: "Premium'a Geç",
      path: '/premium',
    },
  },
  {
    id: 'delete_img',
    question: 'Yüklediğim resmi nasıl silebilirim?',
    shortLabel: 'Resim Silme',
    icon: <Images className="w-3.5 h-3.5" />,
    instantAnswer: `**🗑️ Resim Silme İşlemi:**
- **Üye İseniz:** **Galerim** veya **Panelim** sayfasına giderek resmin altındaki silme butonuna tıklamanız yeterlidir.
- **Kayıtsız Yükleme Yaptıysanız:** Yükleme sonrasında size sağlanan özel **Silme Bağlantısı (Delete Token)** üzerinden resmi silebilirsiniz.`,
    action: {
      label: 'Galerime Git',
      path: '/galerim',
    },
  },
];

interface AiAssistantProps {
  navigate: (path: string) => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Merhaba! 👋 Ben **AnlıkResim AI Asistanıyım**.\n\nSitemiz hakkında aklınıza takılan her şeyi sorabilir veya aşağıdaki hazır sorulardan birine tıklayarak **ışık hızında** anında bilgi alabilirsiniz.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendCustomQuestion = async (customText?: string) => {
    const textToSend = (customText || inputValue).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Format chat history for context
      const chatHistory = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-4)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await assistantApi.ask(textToSend, chatHistory);

      let action: { label: string; path: string } | undefined;
      const lower = textToSend.toLowerCase();
      if (lower.includes('yükle') || lower.includes('resim')) {
        action = { label: 'Yükleme Sayfasına Git', path: '/yukle' };
      } else if (lower.includes('premium') || lower.includes('ücret') || lower.includes('plan')) {
        action = { label: 'Premium Planları İncele', path: '/premium' };
      } else if (lower.includes('galeri') || lower.includes('resimlerim')) {
        action = { label: 'Galerime Git', path: '/galerim' };
      }

      const botMessage: Message = {
        id: 'bot_' + Date.now(),
        role: 'model',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: 'err_' + Date.now(),
        role: 'model',
        text: 'Üzgünüm, şu anda yanıt oluştururken kısa bir gecikme yaşandı. Lütfen sorunuzu tekrar iletin veya yukarıdaki hazır soruları kullanın.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickFaq = (faq: QuickFaq) => {
    // 0ms Instant response for lightspeed user experience
    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: faq.question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const botMsg: Message = {
      id: 'bot_' + (Date.now() + 1),
      role: 'model',
      text: faq.instantAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: faq.action,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'model',
        text: 'Sohbet temizlendi. ✨\n\nSize AnlıkResim özellikleri veya resim yükleme hakkında nasıl yardımcı olabilirim?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderFormattedText = (text: string) => {
    // Simple, clean markdown-like renderer for bold and linebreaks
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Process bold **text**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={idx} className="leading-relaxed">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-white">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Widget Trigger Button (Bottom-Left) */}
      <div id="ai-assistant-widget" className="fixed bottom-6 left-6 z-50">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="AI Destek Asistanını Aç"
            className="group relative flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-blue-400/30"
          >
            {/* Pulsing indicator */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-[#0B0F19]"></span>
            </span>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-xs sm:text-sm font-bold tracking-tight pr-1">Soru Sor & AI Asistan</span>
            </div>

            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-white/20 rounded-full border border-white/25">
              Hızlı Bilgi
            </span>
          </button>
        ) : null}

        {/* Chat Window Modal / Popover */}
        {isOpen && (
          <div
            className="w-[calc(100vw-2rem)] sm:w-[390px] h-[540px] max-h-[82vh] bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-600/30 border border-blue-400/30">
                  <Bot className="w-4 h-4" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0F172A]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-white leading-none">AnlıkResim AI</h3>
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/20 border border-blue-500/30 text-[9px] font-semibold text-blue-300">
                      Işık Hızı
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Platform Asistanı & Rehber</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="Sohbeti Temizle"
                  aria-label="Sohbeti Temizle"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Kapat"
                  aria-label="Kapat"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Questions Carousel / Pills */}
            <div className="px-3 py-2 bg-[#0B0F19]/90 border-b border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 whitespace-nowrap pl-1 pr-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Hazır Sorular:
              </span>
              {INSTANT_FAQS.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => handleSelectQuickFaq(faq)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-blue-600/30 hover:border-blue-500/40 border border-slate-700/60 text-[11px] font-medium text-slate-200 hover:text-white transition-all whitespace-nowrap active:scale-95"
                >
                  <span className="text-blue-400">{faq.icon}</span>
                  <span>{faq.shortLabel}</span>
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0B0F19]/40">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isUser && (
                      <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {isUser && (
                      <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className={`max-w-[82%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`p-3 rounded-2xl ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                            : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {isUser ? (
                          <p className="text-xs sm:text-[13px] leading-relaxed break-words">{msg.text}</p>
                        ) : (
                          renderFormattedText(msg.text)
                        )}
                      </div>

                      {/* Optional Action Button */}
                      {!isUser && msg.action && (
                        <button
                          onClick={() => {
                            if (msg.action?.path) {
                              navigate(msg.action.path);
                              setIsOpen(false);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition-all duration-200 active:scale-95"
                        >
                          <span>{msg.action.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      <span className={`block text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-none p-3 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span className="animate-pulse">Cevap hazırlanıyor</span>
                      <span className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCustomQuestion();
              }}
              className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Sitenizle ilgili bir soru sorun..."
                maxLength={400}
                disabled={isLoading}
                className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                aria-label="Gönder"
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 transition-all active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};
