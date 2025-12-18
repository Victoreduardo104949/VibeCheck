
import React, { useState, useEffect, useRef } from 'react';
import { ChatData, Message, AnalysisResult, DatingAnalysisResult } from './types.ts';
import { parseWhatsAppChat } from './utils/parser.ts';
import { analyzeChat, analyzeDatingInsights } from './services/geminiService.ts';
import DropZone, { Logo } from './components/DropZone.tsx';
import ChatBubble from './components/ChatBubble.tsx';
import { 
  Search, MoreVertical, Phone, Video, Smile, Mic, Paperclip, 
  ArrowLeft, Bot, X, Heart, AlertTriangle, TrendingUp, Info, 
  CreditCard, Sparkles, Loader2, Zap, Home, LogOut, RefreshCw,
  CheckCircle2, ShieldCheck, Target, BrainCircuit, MessageSquareQuote, Quote,
  ArrowRight, Crown, Shield, Lock, ShieldAlert, Share2, FileDown,
  CreditCard as CardIcon, QrCode, ShieldCheck as SecureIcon,
  ChevronRight, LockKeyhole, BadgeCheck, ExternalLink
} from 'lucide-react';

const LOADING_MESSAGES = [
  "Iniciando escaneamento profundo...",
  "Capturando evidências textuais...",
  "Identificando padrões de interesse...",
  "Detectando subtexto em mensagens...",
  "Analisando reciprocidade emocional...",
  "Buscando por red flags ocultas...",
  "Identificando sinais de validação...",
  "Cruzando dados de iniciativa...",
  "Finalizando diagnóstico psicológico..."
];

export default function App() {
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDatingAnalyzing, setIsDatingAnalyzing] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'waiting_payment' | 'verifying'>('selection');
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [datingAnalysis, setDatingAnalysis] = useState<DatingAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDatingReport, setShowDatingReport] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [myAuthorName, setMyAuthorName] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId && chatData && !datingAnalysis && !isDatingAnalyzing) {
      const verifyPayment = async () => {
        setIsDatingAnalyzing(true);
        try {
          const response = await fetch(`/api/verify?session_id=${sessionId}`);
          const data = await response.json();
          
          if (data.paid) {
            startDatingAnalysis();
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          } else {
            alert("Pagamento ainda não processado. Por favor, aguarde a confirmação.");
            setIsDatingAnalyzing(false);
          }
        } catch (e) {
          console.error("Erro na verificação", e);
          setIsDatingAnalyzing(false);
        }
      };
      verifyPayment();
    }
  }, [chatData]);

  useEffect(() => {
    let interval: number;
    if (isAnalyzing || isDatingAnalyzing) {
      interval = window.setInterval(() => {
        setLoadingStep(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, isDatingAnalyzing]);

  const handleFileLoaded = (text: string, attachments: Record<string, string> = {}) => {
    const data = parseWhatsAppChat(text, attachments);
    setChatData(data);
    if (data.participants.length > 0) {
      setMyAuthorName(data.participants[1] || data.participants[0]); 
    }
  };

  const resetToHome = () => {
    setChatData(null);
    setAnalysis(null);
    setDatingAnalysis(null);
    setShowAnalysis(false);
    setShowCheckout(false);
    setShowDatingReport(false);
    setIsAnalyzing(false);
    setIsDatingAnalyzing(false);
    setIsCreatingSession(false);
    setIsRedirectingToCheckout(false);
    setCheckoutStep('selection');
  };

  const handleAnalysis = async () => {
    if (!chatData) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeChat(chatData.messages);
      setAnalysis(result);
      setShowAnalysis(true);
    } catch (e: any) {
      alert("Erro na análise: " + (e.message || "Tente novamente mais tarde."));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openCheckout = () => {
    setIsRedirectingToCheckout(true);
    setTimeout(() => {
      setIsRedirectingToCheckout(false);
      setShowCheckout(true);
      setCheckoutStep('selection');
    }, 800);
  };

  const handleStripePayment = async () => {
    if (!chatData) return;
    setIsCreatingSession(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatTitle: chatData.title })
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        // Mostra o erro detalhado vindo do Stripe
        throw new Error(data.details || data.error || "Erro ao gerar link de pagamento.");
      }
    } catch (e: any) {
      alert("⚠️ ERRO DE TRANSAÇÃO: " + e.message);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const startDatingAnalysis = async () => {
    if (!chatData) return;
    setIsDatingAnalyzing(true);
    try {
      const result = await analyzeDatingInsights(chatData.messages);
      if (result) {
          setDatingAnalysis(result);
          setShowDatingReport(true);
      } else {
          throw new Error("Relatório não disponível.");
      }
    } catch (e: any) {
      alert("Erro no processamento: " + (e.message || "Tente novamente."));
    } finally {
      setIsDatingAnalyzing(false);
    }
  };

  const handleShare = async () => {
    if (!datingAnalysis) return;
    const shareText = `🔍 *VibeCheck AI - Laudo de Relacionamento*\n\n` +
      `❤️ *Saúde:* ${datingAnalysis.relationshipHealth}%\n` +
      `🤖 *Veredito:* "${datingAnalysis.aiAdvice}"`;
    
    if (navigator.share) {
      try { await navigator.share({ title: 'VibeCheck AI', text: shareText }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareText);
      alert("✅ Link copiado!");
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatData]);

  if (!chatData) return <DropZone onFileLoaded={handleFileLoaded} />;

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden relative selection:bg-pink-500 selection:text-white">
        <div className="absolute top-0 w-full h-32 bg-gradient-to-r from-pink-600 to-rose-500 z-0 opacity-50"></div>

        <div className="z-10 w-full h-full xl:w-[1600px] xl:h-[95vh] xl:my-auto xl:mx-auto bg-[#f0f2f5] flex shadow-2xl overflow-hidden relative">
            
            <div className="w-[30%] hidden md:flex flex-col border-r border-[#d1d7db] bg-white no-print">
                <div className="bg-[#f0f2f5] py-2.5 px-4 flex justify-between items-center h-[60px]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center ring-2 ring-white">
                            <Heart className="text-white w-5 h-5 fill-current" />
                        </div>
                        <button onClick={resetToHome} className="p-2 rounded-full hover:bg-black/5 text-slate-500"><Home className="w-5 h-5" /></button>
                    </div>
                    <div className="flex gap-4 text-[#54656f]">
                        <button onClick={handleAnalysis} title="Análise Grátis" className="hover:bg-black/5 p-1 rounded-full transition-colors outline-none">
                            <Bot className="w-6 h-6 cursor-pointer" />
                        </button>
                        <button onClick={openCheckout} title="Diagnóstico Pro" className="hover:bg-black/5 p-1 rounded-full transition-colors outline-none">
                            <Sparkles className="w-6 h-6 cursor-pointer text-pink-500" />
                        </button>
                    </div>
                </div>

                <div className="bg-white p-2 border-b border-[#f0f2f5]">
                    <div className="bg-[#f0f2f5] rounded-lg flex items-center px-4 py-2">
                        <Search className="w-5 h-5 text-[#54656f] mr-4" />
                        <input type="text" placeholder="Pesquisar..." className="bg-transparent w-full focus:outline-none text-sm" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                     <div className="flex items-center p-3 bg-pink-50/50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-slate-200 mr-4 shrink-0 overflow-hidden ring-2 ring-pink-100">
                           <img src={`https://picsum.photos/seed/${chatData.title}/200`} className="w-full h-full object-cover" alt="Avatar" />
                        </div>
                        <div className="flex-1 border-b border-[#f0f2f5] pb-3">
                            <div className="flex justify-between mb-1 text-left">
                                <h3 className="text-[17px] text-[#111b21] font-semibold truncate">{chatData.title}</h3>
                                <span className="text-[10px] text-pink-500 font-black">PRO</span>
                            </div>
                            <p className="text-[12px] text-pink-600 font-medium truncate flex items-center gap-1"><Sparkles className="w-3 h-3" /> Análise Disponível</p>
                        </div>
                     </div>
                     
                     <div className="p-6 mt-6 mx-4 bg-slate-900 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10 text-left">
                            <h4 className="font-bold text-lg mb-2 leading-tight">VibeCheck Pro</h4>
                            <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">Analise o subtexto desta conversa específica agora.</p>
                            <button 
                                onClick={openCheckout}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[11px] font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest hover:scale-105 transition-transform"
                            >
                                ANALISAR POR R$ 5,90
                            </button>
                        </div>
                     </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col relative bg-[#efeae2] w-full overflow-hidden no-print">
                <header className="bg-[#f0f2f5] min-h-[60px] md:h-[65px] px-4 py-2 flex items-center justify-between border-b border-[#d1d7db] z-20">
                    <div className="flex items-center min-w-0">
                        <button onClick={resetToHome} className="mr-1 p-2.5 hover:bg-black/5 rounded-full shrink-0">
                          <ArrowLeft className="text-[#54656f] w-6 h-6" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 shrink-0">
                            <img src={`https://picsum.photos/seed/${chatData.title}/200`} alt="Avatar" className="w-full h-full rounded-full object-cover"/>
                        </div>
                        <div className="flex flex-col justify-center min-w-0 text-left">
                            <h2 className="text-[#111b21] text-[15px] font-semibold truncate leading-tight">{chatData.title}</h2>
                            <span className="text-pink-600 text-[10px] md:text-[11px] font-black uppercase tracking-widest truncate">
                                {datingAnalysis ? 'Análise Premium Concluída' : 'Aguardando Upgrade Individual'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-4 text-[#54656f] shrink-0">
                        <button onClick={handleAnalysis} title="Análise Rápida" className="hover:bg-black/5 p-1 rounded-full transition-colors outline-none">
                            <Bot className="w-6 h-6 cursor-pointer" />
                        </button>
                        <button onClick={openCheckout} title="Diagnóstico Premium" className="hover:bg-black/5 p-1 rounded-full transition-colors outline-none">
                            <Sparkles className="w-6 h-6 cursor-pointer text-pink-500" />
                        </button>
                    </div>
                </header>

                {!datingAnalysis && (
                  <div 
                    onClick={openCheckout}
                    className="relative z-10 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 px-4 py-4 md:py-5 flex items-center justify-between shadow-lg cursor-pointer hover:brightness-110 transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                    <div className="flex items-center gap-3 md:gap-4 relative z-10">
                      <div className="bg-white/20 p-2 md:p-2.5 rounded-2xl backdrop-blur-md border border-white/30 animate-pulse">
                        <Heart className="w-5 h-5 md:w-6 md:h-6 text-white fill-current" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-white font-black text-sm md:text-base leading-tight uppercase tracking-tight">Liberar Diagnóstico Individual</span>
                        <span className="text-pink-100 text-[10px] md:text-[11px] font-bold uppercase tracking-widest opacity-90">Análise profunda desta conversa</span>
                      </div>
                    </div>
                    <div className="bg-white text-pink-600 px-4 py-2 md:px-6 md:py-2.5 rounded-full font-black text-[11px] md:text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 relative z-10">
                        LIBERAR <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto relative custom-scrollbar" ref={scrollRef}>
                    <div className="chat-bg-layer"></div>
                    <div className="relative z-10 p-4 md:px-[12%] flex flex-col gap-1 pb-24">
                        {chatData.messages.map((msg, index) => (
                            <ChatBubble 
                                key={msg.id} 
                                message={msg} 
                                isMe={msg.author === myAuthorName} 
                                showTail={index === 0 || chatData.messages[index-1].author !== msg.author} 
                            />
                        ))}
                    </div>
                </div>

                <footer className="bg-[#f0f2f5] min-h-[62px] px-4 py-2 flex items-center gap-2 md:gap-4 z-20 border-t border-slate-200 no-print">
                    <Smile className="w-6 h-6 md:w-7 md:h-7 text-[#54656f] shrink-0" />
                    <div className="flex-1 bg-white rounded-xl px-4 py-3 text-slate-400 text-[13px] md:text-sm truncate shadow-sm border border-slate-200/50">
                        Conversa carregada. Clique no ícone de IA para analisar.
                    </div>
                    <Mic className="w-6 h-6 md:w-7 md:h-7 text-[#54656f] shrink-0" />
                </footer>
            </div>
        </div>

        {/* LOADING OVERLAY */}
        {(isAnalyzing || isDatingAnalyzing) && (
            <div className="fixed inset-0 bg-[#0f172a]/98 backdrop-blur-3xl z-[300] flex flex-col items-center justify-center p-8 no-print text-center">
                <div className="relative mb-12">
                    <div className={`absolute inset-0 rounded-full blur-[60px] animate-pulse ${isDatingAnalyzing ? 'bg-pink-500/20' : 'bg-blue-500/10'}`}></div>
                    <div className={`w-24 h-24 border-t-2 rounded-full animate-spin ${isDatingAnalyzing ? 'border-pink-500' : 'border-blue-400'}`}></div>
                    <BrainCircuit className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 ${isDatingAnalyzing ? 'text-pink-400' : 'text-blue-300'}`} />
                </div>
                <div className="space-y-6 max-w-xs">
                    <h3 className="text-white text-3xl font-black uppercase italic tracking-tighter">
                        VibeCheck <span className={isDatingAnalyzing ? "text-pink-500" : "text-blue-400"}>{isDatingAnalyzing ? "Pro" : "Free"}</span>
                    </h3>
                    <p className={`text-xs font-black uppercase tracking-[0.2em] animate-pulse ${isDatingAnalyzing ? 'text-pink-400' : 'text-slate-400'}`}>
                        {LOADING_MESSAGES[loadingStep]}
                    </p>
                </div>
            </div>
        )}

        {/* MODAL CHECKOUT */}
        {showCheckout && (
            <div className="fixed inset-0 z-[500] bg-[#f8fafc] flex flex-col animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
                <header className="bg-white border-b border-slate-200 p-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                         <div className="bg-pink-500 p-2 rounded-xl text-white"><Heart className="w-5 h-5 fill-current" /></div>
                         <h1 className="text-slate-900 font-black text-lg tracking-tighter uppercase">VibeCheck <span className="text-pink-500">Upgrade</span></h1>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pagamento 100% Seguro</span>
                    </div>
                </header>

                <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-12 flex flex-col lg:flex-row gap-12 text-left">
                    <div className="flex-1 space-y-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">Desbloqueie este <span className="text-pink-600 underline underline-offset-4 decoration-4">Diagnóstico Único</span></h2>
                            <p className="text-slate-500 font-medium leading-relaxed italic">"A análise mais profunda do mercado. Descubra segundas intenções e sinais de ghosting nesta conversa específica."</p>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">O QUE VOCÊ VAI RECEBER NESTA ANÁLISE:</h3>
                            <ul className="space-y-4">
                                {[
                                    { title: "Ghosting Score", desc: "Quem está mais interessado? Métrica de tempo e iniciativa.", icon: <TrendingUp className="text-blue-500" /> },
                                    { title: "Red Flag Hunter", desc: "Identifica narcisismo e sinais de alerta tóxicos.", icon: <ShieldAlert className="text-rose-500" /> },
                                    { title: "Green Flag Finder", desc: "Confirmação de reciprocidade genuína.", icon: <CheckCircle2 className="text-emerald-500" /> },
                                    { title: "Veredito da IA", desc: "Conselho final decisivo baseado nos dados.", icon: <Target className="text-amber-500" /> }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex gap-4 items-start">
                                        <div className="bg-slate-50 p-2.5 rounded-xl shrink-0">{item.icon}</div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                                            <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px] shrink-0">
                        <div className="bg-white rounded-3xl border-2 border-slate-900 p-8 shadow-2xl space-y-8 relative overflow-hidden">
                            
                            {(checkoutStep === 'verifying' || isCreatingSession) && (
                                <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                                    <div className="w-16 h-16 border-4 border-slate-100 border-t-pink-500 rounded-full animate-spin mb-6"></div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                                        {isCreatingSession ? "Iniciando Transação" : "Validando Acesso"}
                                    </h3>
                                    <p className="text-slate-500 text-xs font-medium">Não feche esta página...</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Análise Individual</span>
                                <span className="text-3xl font-black text-pink-600 tracking-tighter">R$ 5,90</span>
                            </div>

                            <div className="space-y-6">
                                {checkoutStep === 'selection' ? (
                                    <>
                                        <p className="text-xs text-slate-500 leading-relaxed text-center">
                                            A liberação é imediata e válida apenas para a conversa <b>{chatData.title}</b>.
                                        </p>
                                        <button 
                                            onClick={handleStripePayment}
                                            className="w-full py-5 bg-pink-600 text-white font-black rounded-2xl shadow-xl hover:bg-pink-700 transition-all transform active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                                        >
                                            ANALISAR AGORA (PIX/CARTÃO)
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">
                                        <p className="text-blue-800 text-xs font-bold leading-relaxed">
                                            Aguardando a confirmação do pagamento...
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex flex-col items-center gap-4 border-t border-slate-100">
                                <div className="flex items-center justify-center gap-6 opacity-60">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                                        <QrCode className="w-4 h-4 text-emerald-500" /> PIX
                                    </div>
                                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                                        <CardIcon className="w-4 h-4 text-blue-500" /> CARTÃO
                                    </div>
                                </div>
                                <div className="text-[10px] font-black text-emerald-500 italic flex items-center gap-2 uppercase tracking-widest">
                                    <ShieldCheck className="w-3 h-3" /> Transação Protegida por SSL
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setShowCheckout(false)} className="mt-6 w-full text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:text-slate-600 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para a Conversa
                        </button>
                    </div>
                </main>
            </div>
        )}

        {showDatingReport && datingAnalysis && (
            <div id="printable-report" className="fixed inset-0 z-[250] bg-white flex flex-col animate-in fade-in duration-500 print:static print:block overflow-hidden">
                <header className="bg-slate-900 p-4 md:px-12 text-white flex justify-between items-center shrink-0 z-30 shadow-xl no-print">
                    <button onClick={() => setShowDatingReport(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"><ArrowLeft className="w-7 h-7" /></button>
                    <div className="flex flex-col items-center">
                        <Logo />
                        <span className="text-[9px] font-black text-pink-500 tracking-[0.4em] uppercase mt-1">Laudo Premium Individual</span>
                    </div>
                    <button onClick={resetToHome} className="p-2 text-slate-500 hover:text-white transition-colors active:scale-90"><Home className="w-6 h-6" /></button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] print:overflow-visible print:bg-white text-left">
                    <div className="flex flex-col lg:flex-row min-h-full print:block">
                        <div className="w-full lg:w-[380px] bg-slate-900 p-6 md:p-10 text-white lg:h-auto lg:min-h-screen lg:sticky lg:top-0 shrink-0 z-20 print:w-full print:static print:min-h-0 print:mb-8 print:rounded-b-3xl">
                            <div className="space-y-8 md:space-y-10">
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saúde da Relação</h3>
                                        <span className="text-4xl font-black text-white tracking-tighter">{datingAnalysis.relationshipHealth}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5">
                                        <div className="bg-gradient-to-r from-pink-600 to-rose-400 h-full rounded-full transition-all duration-1000" style={{ width: `${datingAnalysis.relationshipHealth}%` }}></div>
                                    </div>
                                </div>

                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                                    <p className="text-[9px] font-black text-pink-500 uppercase mb-1 tracking-widest">Tendência</p>
                                    <p className="text-lg font-black tracking-tight">{datingAnalysis.sentimentTrend}</p>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Interesse Individual</h3>
                                    <div className="grid gap-6 print:grid-cols-2">
                                        {[datingAnalysis.ghostingScore.userA, datingAnalysis.ghostingScore.userB].map((u, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-[11px] font-black text-white mb-2">
                                                    <span className="truncate max-w-[120px]">{u.name}</span>
                                                    <span className="text-pink-500">{u.score}%</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-pink-500 h-full rounded-full transition-all duration-1000" style={{ width: `${u.score}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-3 no-print pt-6">
                                    <button onClick={handleExportPDF} className="w-full py-4 rounded-xl bg-pink-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                        <FileDown className="w-4 h-4" /> Exportar em PDF
                                    </button>
                                    <button onClick={handleShare} className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Share2 className="w-4 h-4" /> Compartilhar Laudo
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-4 md:p-8 lg:p-16 relative print:p-0 print:block">
                            <div className="max-w-5xl mx-auto space-y-12 pb-20 print:space-y-8">
                                <section>
                                    <div className="flex items-center gap-3 mb-6 border-b border-emerald-100 pb-4">
                                        <div className="bg-emerald-100 p-2.5 rounded-xl"><CheckCircle2 className="text-emerald-500 w-5 h-5" /></div>
                                        <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter">Green Flags Detectadas</h2>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {datingAnalysis.greenFlags.map((gf, i) => (
                                            <div key={i} className="p-5 rounded-3xl bg-white border border-emerald-50 shadow-sm space-y-4">
                                                <p className="text-slate-900 text-sm md:text-base font-bold leading-tight">{gf.description}</p>
                                                <div className="bg-emerald-50/40 border-l-4 border-emerald-400 p-3 rounded-r-xl">
                                                    <p className="text-emerald-950 font-serif italic text-xs leading-relaxed">"{gf.citation}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center gap-3 mb-6 border-b border-rose-100 pb-4">
                                        <div className="bg-rose-100 p-2.5 rounded-xl"><AlertTriangle className="text-rose-500 w-5 h-5" /></div>
                                        <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter">Sinais de Alerta (Red Flags)</h2>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {datingAnalysis.redFlags.map((rf, i) => (
                                            <div key={i} className={`p-5 rounded-3xl bg-white border shadow-sm space-y-4 ${rf.severity === 'high' ? 'border-rose-100' : 'border-orange-50'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${rf.severity === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {rf.severity === 'high' ? 'Severo' : 'Atenção'}
                                                    </div>
                                                </div>
                                                <p className="text-slate-900 text-sm md:text-base font-bold leading-tight">{rf.description}</p>
                                                <div className={`p-3 rounded-r-xl border-l-4 ${rf.severity === 'high' ? 'bg-rose-50/50 border-rose-400' : 'bg-orange-50/50 border-orange-400'}`}>
                                                    <p className={`font-serif italic text-xs leading-relaxed ${rf.severity === 'high' ? 'text-rose-950' : 'text-orange-950'}`}>"{rf.citation}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden print:bg-slate-950">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Bot className="text-pink-500 w-8 h-8" />
                                            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Veredito VibeCheck</h2>
                                        </div>
                                        <p className="text-xl md:text-2xl font-light italic leading-relaxed text-slate-300">
                                            "{datingAnalysis.aiAdvice}"
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
