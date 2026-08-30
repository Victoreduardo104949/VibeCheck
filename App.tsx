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
  ChevronRight, LockKeyhole, BadgeCheck, ExternalLink, Copy, Check,
  Activity, Compass, Flame, UserCheck, MessageCircle, Clock, Award,
  HelpCircle, Eye
} from 'lucide-react';

const LOADING_MESSAGES = [
  "Iniciando escaneamento profundo dos diálogos...",
  "Calculando métricas estatísticas e de tempo de resposta...",
  "Mapeando estilos de apego e dinâmica de poder...",
  "Decodificando subtexto oculto nas entrelinhas...",
  "Identificando red flags e green flags com citações...",
  "Avaliando termômetros de intimidade e compatibilidade...",
  "Estruturando linha do tempo e playbook de ação...",
  "Gerando laudo psicológico executivo completo..."
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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
    if (import.meta.env.DEV) {
      startDatingAnalysis();
      return;
    }
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
    const shareText = `🔍 *VibeCheck AI - Laudo Psicológico de Relacionamento*\n\n` +
      `❤️ *Saúde da Relação:* ${datingAnalysis.relationshipHealth}%\n` +
      `📈 *Tendência:* ${datingAnalysis.sentimentTrend}\n` +
      `🔥 *Intimidade:* ${datingAnalysis.connectionThermometers.intimacyScore}%\n` +
      `🤖 *Veredito:* "${datingAnalysis.aiAdvice}"`;
    
    if (navigator.share) {
      try { await navigator.share({ title: 'VibeCheck AI - Laudo Psicológico', text: shareText }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareText);
      alert("✅ Resumo do laudo copiado para a área de transferência!");
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
            
            {/* SIDEBAR ESQUERDA */}
            <div className="w-[30%] hidden md:flex flex-col border-r border-[#d1d7db] bg-white no-print">
                <div className="bg-[#f0f2f5] py-2.5 px-4 flex justify-between items-center h-[60px]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center ring-2 ring-white shadow-md">
                            <Heart className="text-white w-5 h-5 fill-current" />
                        </div>
                        <button onClick={resetToHome} title="Início" className="p-2 rounded-full hover:bg-black/5 text-slate-500 transition-colors"><Home className="w-5 h-5" /></button>
                    </div>
                    <div className="flex gap-4 text-[#54656f]">
                        <button onClick={handleAnalysis} title="Análise Rápida Grátis" className="hover:bg-black/5 p-1 rounded-full transition-colors outline-none">
                            <Bot className="w-6 h-6 cursor-pointer" />
                        </button>
                        <button onClick={openCheckout} title="Diagnóstico Pro Completo" className="hover:bg-black/5 p-1 rounded-full transition-colors outline-none">
                            <Sparkles className="w-6 h-6 cursor-pointer text-pink-500 animate-pulse" />
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
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-pink-400">Dossiê Completo</span>
                            <h4 className="font-black text-xl mb-2 leading-tight mt-1">VibeCheck Pro</h4>
                            <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                              Decodifique apego emocional, subtexto nas entrelinhas, red flags e playbook de ação.
                            </p>
                            <button 
                                onClick={openCheckout}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[11px] font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest hover:scale-105 transition-transform"
                            >
                                GERAR LAUDO POR R$ 5,90
                            </button>
                        </div>
                     </div>
                </div>
            </div>

            {/* CHAT PRINCIPAL */}
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
                                {datingAnalysis ? 'Laudo Psicológico Gerado' : 'Aguardando Diagnóstico Pro'}
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
                        <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-white font-black text-sm md:text-base leading-tight uppercase tracking-tight">Liberar Laudo Psicológico Completo</span>
                        <span className="text-pink-100 text-[10px] md:text-[11px] font-bold uppercase tracking-widest opacity-90">Análise comportamental profunda & estratégias</span>
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
                        Conversa carregada ({chatData.messages.length} mensagens). Clique no ícone de brilho para gerar o laudo.
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
                <div className="space-y-6 max-w-sm">
                    <h3 className="text-white text-3xl font-black uppercase italic tracking-tighter">
                        VibeCheck <span className={isDatingAnalyzing ? "text-pink-500" : "text-blue-400"}>{isDatingAnalyzing ? "Pro" : "Free"}</span>
                    </h3>
                    <p className={`text-xs font-black uppercase tracking-[0.2em] animate-pulse ${isDatingAnalyzing ? 'text-pink-400' : 'text-slate-400'}`}>
                        {LOADING_MESSAGES[loadingStep]}
                    </p>
                </div>
            </div>
        )}

        {/* MODAL ANÁLISE BÁSICA (FREE) */}
        {showAnalysis && analysis && (
          <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2.5 rounded-2xl"><Bot className="w-6 h-6" /></div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Resumo Rápido</h3>
                </div>
                <button onClick={() => setShowAnalysis(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resumo</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">{analysis.summary}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sentimento Geral</h4>
                  <span className="inline-block bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded-full text-xs">{analysis.sentiment}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tópicos Principais</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.topics.map((t, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-lg font-medium">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setShowAnalysis(false); openCheckout(); }} 
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Desbloquear Laudo Psicológico Completo
              </button>
            </div>
          </div>
        )}

        {/* MODAL CHECKOUT */}
        {showCheckout && (
            <div className="fixed inset-0 z-[500] bg-[#f8fafc] flex flex-col animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
                <header className="bg-white border-b border-slate-200 p-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                         <div className="bg-pink-500 p-2 rounded-xl text-white"><Heart className="w-5 h-5 fill-current" /></div>
                         <h1 className="text-slate-900 font-black text-lg tracking-tighter uppercase">VibeCheck <span className="text-pink-500">Dossiê Pro</span></h1>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pagamento 100% Seguro</span>
                    </div>
                </header>

                <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-12 flex flex-col lg:flex-row gap-12 text-left">
                    <div className="flex-1 space-y-8">
                        <div>
                            <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest">Diagnóstico Psicológico & Comportamental</span>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 leading-tight mt-1">
                              Descubra o que está nas <span className="text-pink-600 underline underline-offset-4 decoration-4">entrelinhas</span>
                            </h2>
                            <p className="text-slate-500 font-medium leading-relaxed italic">
                              "O laudo mais completo do mercado. Mapeamento de estilos de apego, subtexto de mensagens, red flags com citações e playbook de mensagens recomendadas."
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">O QUE VOCÊ VAI RECEBER NESTE DOSSIÊ:</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { title: "Resumo Clínico Executivo", desc: "Síntese psicológica completa da relação.", icon: <BrainCircuit className="text-pink-500 w-5 h-5" /> },
                                    { title: "Perfis & Estilos de Apego", desc: "Mapeamento seguro, ansioso ou evitativo de cada um.", icon: <UserCheck className="text-purple-500 w-5 h-5" /> },
                                    { title: "Decodificador de Subtexto", desc: "O que as frases reais significam nas entrelinhas.", icon: <Eye className="text-blue-500 w-5 h-5" /> },
                                    { title: "Raio-X de Red & Green Flags", desc: "Alertas e pontos positivos com citações textuais.", icon: <ShieldAlert className="text-rose-500 w-5 h-5" /> },
                                    { title: "Termômetros de Conexão", desc: "Intimidade, ansiedade, vibe e probabilidade de futuro.", icon: <Flame className="text-amber-500 w-5 h-5" /> },
                                    { title: "Playbook com Mensagens Prontas", desc: "O que fazer, o que evitar e textos para copiar.", icon: <MessageCircle className="text-emerald-500 w-5 h-5" /> }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex gap-3 items-start p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="bg-white p-2 rounded-xl shrink-0 shadow-sm">{item.icon}</div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                                            <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{item.desc}</p>
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
                                <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Dossiê Individual</span>
                                <span className="text-3xl font-black text-pink-600 tracking-tighter">R$ 5,90</span>
                            </div>

                            <div className="space-y-6">
                                {checkoutStep === 'selection' ? (
                                    <>
                                        <p className="text-xs text-slate-500 leading-relaxed text-center">
                                            Acesso imediato e relatório completo para a conversa <b>{chatData.title}</b>.
                                        </p>
                                        <button 
                                            onClick={handleStripePayment}
                                            className="w-full py-5 bg-pink-600 text-white font-black rounded-2xl shadow-xl hover:bg-pink-700 transition-all transform active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                                        >
                                            GERAR LAUDO AGORA
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

        {/* LAUDO PSICOLÓGICO ULTRA COMPLETO (PRO) */}
        {showDatingReport && datingAnalysis && (
            <div id="printable-report" className="fixed inset-0 z-[250] bg-white flex flex-col animate-in fade-in duration-500 print:static print:block overflow-hidden">
                {/* HEADER DO LAUDO */}
                <header className="bg-slate-900 p-4 md:px-12 text-white flex justify-between items-center shrink-0 z-30 shadow-xl no-print">
                    <button onClick={() => setShowDatingReport(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90" title="Voltar"><ArrowLeft className="w-7 h-7" /></button>
                    <div className="flex flex-col items-center">
                        <Logo />
                        <span className="text-[9px] font-black text-pink-500 tracking-[0.4em] uppercase mt-1">Laudo Psicológico & Comportamental Pro</span>
                    </div>
                    <button onClick={resetToHome} className="p-2 text-slate-500 hover:text-white transition-colors active:scale-90" title="Início"><Home className="w-6 h-6" /></button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] print:overflow-visible print:bg-white text-left">
                    <div className="flex flex-col lg:flex-row min-h-full print:block">
                        
                        {/* PAINEL LATERAL DE INDICADORES (STICKY) */}
                        <div className="w-full lg:w-[380px] bg-slate-900 p-6 md:p-10 text-white lg:h-auto lg:min-h-screen lg:sticky lg:top-0 shrink-0 z-20 print:w-full print:static print:min-h-0 print:mb-8 print:rounded-3xl print:bg-slate-900">
                            <div className="space-y-8">
                                
                                {/* SAÚDE GERAL */}
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saúde da Relação</h3>
                                        <span className="text-4xl font-black text-white tracking-tighter">{datingAnalysis.relationshipHealth}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden p-0.5">
                                        <div className="bg-gradient-to-r from-pink-500 via-rose-400 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${datingAnalysis.relationshipHealth}%` }}></div>
                                    </div>
                                </div>

                                {/* TENDÊNCIA */}
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                                    <p className="text-[9px] font-black text-pink-400 uppercase mb-1 tracking-widest">Tendência do Vínculo</p>
                                    <p className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                                      <Activity className="w-4 h-4 text-pink-400" />
                                      {datingAnalysis.sentimentTrend}
                                    </p>
                                </div>

                                {/* TERMÔMETROS DE CONEXÃO */}
                                <div className="space-y-4 pt-2 border-t border-white/10">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Termômetros de Conexão</h3>
                                    
                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <div className="flex justify-between font-bold mb-1">
                                                <span className="text-slate-300">Intimidade & Conexão</span>
                                                <span className="text-pink-400">{datingAnalysis.connectionThermometers.intimacyScore}%</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-pink-500 h-full rounded-full" style={{ width: `${datingAnalysis.connectionThermometers.intimacyScore}%` }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-bold mb-1">
                                                <span className="text-slate-300">Compatibilidade de Vibe</span>
                                                <span className="text-emerald-400">{datingAnalysis.connectionThermometers.vibeCompatibility}%</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${datingAnalysis.connectionThermometers.vibeCompatibility}%` }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-bold mb-1">
                                                <span className="text-slate-300">Cobrança / Ansiedade</span>
                                                <span className="text-amber-400">{datingAnalysis.connectionThermometers.anxietyScore}%</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${datingAnalysis.connectionThermometers.anxietyScore}%` }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-bold mb-1">
                                                <span className="text-slate-300">Potencial Futuro</span>
                                                <span className="text-blue-400">{datingAnalysis.connectionThermometers.futurePotentialScore}%</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${datingAnalysis.connectionThermometers.futurePotentialScore}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RISCO DE GHOSTING / INTERESSE */}
                                <div className="space-y-4 pt-2 border-t border-white/10">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Interesse & Iniciativa</h3>
                                    <div className="grid gap-4 print:grid-cols-2">
                                        {[datingAnalysis.ghostingScore.userA, datingAnalysis.ghostingScore.userB].map((u, i) => (
                                            <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                <div className="flex justify-between text-[11px] font-black text-white mb-1.5">
                                                    <span className="truncate max-w-[140px]">{u.name}</span>
                                                    <span className="text-pink-400">{u.score}% ({u.label})</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-pink-500 h-full rounded-full" style={{ width: `${u.score}%` }}></div>
                                                </div>
                                                {u.evidence && (
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1.5">{u.evidence}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-slate-400 italic leading-relaxed">{datingAnalysis.ghostingScore.description}</p>
                                </div>
                                
                                {/* BOTÕES DE AÇÃO */}
                                <div className="space-y-3 no-print pt-4 border-t border-white/10">
                                    <button onClick={handleExportPDF} className="w-full py-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors">
                                        <FileDown className="w-4 h-4" /> Exportar / Imprimir em PDF
                                    </button>
                                    <button onClick={handleShare} className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                                        <Share2 className="w-4 h-4" /> Compartilhar Laudo
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CONTEÚDO PRINCIPAL DO LAUDO */}
                        <div className="flex-1 p-4 md:p-8 lg:p-14 relative print:p-0 print:block">
                            <div className="max-w-5xl mx-auto space-y-12 pb-24 print:space-y-8">
                                
                                {/* 1. RESUMO CLÍNICO EXECUTIVO */}
                                <section className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/80 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                        <div className="bg-pink-100 p-2.5 rounded-2xl text-pink-600"><BrainCircuit className="w-6 h-6" /></div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Resumo Clínico Executivo</h2>
                                            <p className="text-xs text-slate-500 font-medium">Diagnóstico comportamental da relação</p>
                                        </div>
                                    </div>
                                    <div className="text-slate-700 text-sm md:text-base leading-relaxed font-normal space-y-3 whitespace-pre-line">
                                        {datingAnalysis.executiveSummary}
                                    </div>
                                </section>

                                {/* 2. PERFIS COMPORTAMENTAIS & ESTILOS DE APEGO */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                                        <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-600"><UserCheck className="w-6 h-6" /></div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Perfis Psicológicos & Estilos de Apego</h2>
                                            <p className="text-xs text-slate-500 font-medium">Mapeamento individual de comunicação e dinâmica de poder</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[datingAnalysis.behavioralProfiles.userA, datingAnalysis.behavioralProfiles.userB].map((profile, i) => (
                                            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                                    <h3 className="font-black text-lg text-slate-900">{profile.name}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                        profile.attachmentStyle === 'Seguro' ? 'bg-emerald-100 text-emerald-700' :
                                                        profile.attachmentStyle === 'Ansioso' ? 'bg-amber-100 text-amber-700' :
                                                        profile.attachmentStyle === 'Evitativo' ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        Apego {profile.attachmentStyle}
                                                    </span>
                                                </div>

                                                <div className="space-y-3 text-xs">
                                                    <div>
                                                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Estilo de Comunicação</span>
                                                        <p className="text-slate-800 font-semibold mt-0.5">{profile.communicationStyle}</p>
                                                    </div>

                                                    <div>
                                                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Dinâmica de Poder</span>
                                                        <p className="text-slate-800 font-semibold mt-0.5">{profile.powerDynamic}</p>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                                                            <span>Investimento Emocional</span>
                                                            <span className="text-slate-900">{profile.emotionalInvestment}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${profile.emotionalInvestment}%` }}></div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                                                        <span className="font-bold text-purple-900 text-[11px] block">Comportamento-Chave:</span>
                                                        <p className="text-purple-950 text-xs mt-0.5">{profile.keyBehavior}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {datingAnalysis.behavioralProfiles.dynamicSummary && (
                                        <div className="p-5 bg-slate-900 text-slate-200 rounded-2xl text-xs md:text-sm leading-relaxed">
                                            <span className="font-bold text-pink-400 block mb-1 uppercase tracking-widest text-[10px]">Síntese da Dinâmica Interpessoal:</span>
                                            {datingAnalysis.behavioralProfiles.dynamicSummary}
                                        </div>
                                    )}
                                </section>

                                {/* 3. DECODIFICADOR DE SUBTEXTO */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                                        <div className="bg-blue-100 p-2.5 rounded-2xl text-blue-600"><Eye className="w-6 h-6" /></div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Decodificador de Subtexto & Mensagens Ocultas</h2>
                                            <p className="text-xs text-slate-500 font-medium">O que realmente estava sendo dito nas entrelinhas</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {datingAnalysis.subtextDecoders.map((item, idx) => (
                                            <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                                <div className="bg-slate-50 border-l-4 border-blue-500 p-3.5 rounded-r-2xl">
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Trecho Real da Conversa:</span>
                                                    <p className="font-serif italic text-slate-900 text-sm md:text-base">"{item.quote}"</p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">O que parecia na superfície:</span>
                                                        <p className="text-slate-700 leading-relaxed">{item.apparentMeaning}</p>
                                                    </div>
                                                    <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl">
                                                        <span className="font-bold text-blue-800 uppercase tracking-wider text-[10px] block mb-1">O significado oculto real (Subtexto):</span>
                                                        <p className="text-blue-950 font-medium leading-relaxed">{item.hiddenMeaning}</p>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-slate-500 pt-1">
                                                    <span className="font-bold text-slate-700">💡 Insight Psicológico:</span> {item.psychologicalInsight}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* 4. RAIO-X DE SINAIS (GREEN & RED FLAGS) */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* GREEN FLAGS */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
                                            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Green Flags</h2>
                                        </div>
                                        <div className="space-y-4">
                                            {datingAnalysis.greenFlags.map((gf, i) => (
                                                <div key={i} className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-sm space-y-3">
                                                    <p className="text-slate-900 text-sm font-bold leading-snug">{gf.description}</p>
                                                    <div className="bg-emerald-50/50 border-l-4 border-emerald-400 p-3 rounded-r-xl">
                                                        <p className="text-emerald-950 font-serif italic text-xs leading-relaxed">"{gf.citation}"</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* RED FLAGS */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3 border-b border-rose-100 pb-3">
                                            <div className="bg-rose-100 p-2 rounded-xl text-rose-600"><AlertTriangle className="w-5 h-5" /></div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Sinais de Alerta (Red Flags)</h2>
                                        </div>
                                        <div className="space-y-4">
                                            {datingAnalysis.redFlags.map((rf, i) => (
                                                <div key={i} className={`p-5 rounded-3xl bg-white border shadow-sm space-y-3 ${rf.severity === 'high' ? 'border-rose-200' : 'border-orange-100'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                            rf.severity === 'high' ? 'bg-rose-100 text-rose-700' :
                                                            rf.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            Severidade {rf.severity === 'high' ? 'Alta' : rf.severity === 'medium' ? 'Média' : 'Baixa'}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-900 text-sm font-bold leading-snug">{rf.description}</p>
                                                    <div className={`p-3 rounded-r-xl border-l-4 ${rf.severity === 'high' ? 'bg-rose-50 border-rose-400 text-rose-950' : 'bg-orange-50 border-orange-400 text-orange-950'}`}>
                                                        <p className="font-serif italic text-xs leading-relaxed">"{rf.citation}"</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* 5. LINHA DO TEMPO DA DINÂMICA */}
                                <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                        <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600"><Clock className="w-6 h-6" /></div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Linha do Tempo da Dinâmica</h2>
                                            <p className="text-xs text-slate-500 font-medium">Evolução temporal das fases da conversa</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {datingAnalysis.relationshipTimeline.map((item, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{item.phase}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                        item.sentiment === 'Positivo' ? 'bg-emerald-100 text-emerald-700' :
                                                        item.sentiment === 'Tenso' ? 'bg-amber-100 text-amber-700' :
                                                        item.sentiment === 'Frio' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                                                    }`}>
                                                        {item.sentiment}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-700 leading-relaxed">{item.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* 6. PLAYBOOK ESTRATÉGICO DE AÇÃO */}
                                <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                        <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-600"><Target className="w-6 h-6" /></div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Playbook Estratégico de Ação</h2>
                                            <p className="text-xs text-slate-500 font-medium">O que fazer, o que evitar e mensagens recomendadas</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* O QUE FAZER */}
                                        <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-2xl space-y-3">
                                            <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> O que Fazer Agora
                                            </h3>
                                            <ul className="space-y-2 text-xs text-emerald-950">
                                                {datingAnalysis.actionPlaybook.whatToDo.map((todo, i) => (
                                                    <li key={i} className="flex gap-2 items-start">
                                                        <span className="text-emerald-600 font-bold">•</span>
                                                        <span>{todo}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* O QUE EVITAR */}
                                        <div className="bg-rose-50/40 border border-rose-100 p-5 rounded-2xl space-y-3">
                                            <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-rose-600" /> O que Evitar a Todo Custo
                                            </h3>
                                            <ul className="space-y-2 text-xs text-rose-950">
                                                {datingAnalysis.actionPlaybook.whatToAvoid.map((avoid, i) => (
                                                    <li key={i} className="flex gap-2 items-start">
                                                        <span className="text-rose-600 font-bold">•</span>
                                                        <span>{avoid}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* MENSAGENS SUGERIDAS */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4 text-blue-500" /> Mensagens Sugeridas Prontas para Enviar
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {datingAnalysis.actionPlaybook.suggestedMessages.map((msgItem, i) => (
                                                <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{msgItem.context}</span>
                                                            <span className="text-[10px] font-medium text-slate-500">{msgItem.objective}</span>
                                                        </div>
                                                        <p className="bg-white p-3 rounded-xl text-xs font-medium text-slate-800 border border-slate-200/60 leading-relaxed font-mono">
                                                            "{msgItem.draft}"
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleCopyMessage(msgItem.draft, i)}
                                                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm"
                                                    >
                                                        {copiedIndex === i ? (
                                                            <>
                                                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado com sucesso!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3.5 h-3.5 text-slate-500" /> Copiar Mensagem
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* 7. VEREDITO FINAL VIBECHECK */}
                                <section className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden print:bg-slate-950 shadow-2xl">
                                    <div className="relative z-10 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Bot className="text-pink-500 w-8 h-8" />
                                            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Veredito Clínico Final</h2>
                                        </div>
                                        <p className="text-lg md:text-xl font-light italic leading-relaxed text-slate-200 whitespace-pre-line">
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
