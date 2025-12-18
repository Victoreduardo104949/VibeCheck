
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
  ArrowRight, Crown, Shield, Lock, ShieldAlert, Share2, FileDown
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
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [datingAnalysis, setDatingAnalysis] = useState<DatingAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDatingReport, setShowDatingReport] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [myAuthorName, setMyAuthorName] = useState<string>('');

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
  };

  const handleAnalysis = async () => {
    if (!chatData) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeChat(chatData.messages);
      setAnalysis(result);
      setShowAnalysis(true);
    } catch (e) {
      alert("Erro na análise básica.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShare = async () => {
    if (!datingAnalysis) return;
    
    const currentUrl = window.location.href;
    const isWebUrl = currentUrl.startsWith('http');
    
    const shareText = `🔍 *VibeCheck AI - Laudo de Relacionamento*\n\n` +
      `📌 *Conversa:* ${chatData?.title}\n` +
      `❤️ *Saúde do Relacionamento:* ${datingAnalysis.relationshipHealth}%\n` +
      `📈 *Tendência:* ${datingAnalysis.sentimentTrend}\n\n` +
      `🤖 *Veredito da IA:* "${datingAnalysis.aiAdvice}"\n\n` +
      `Analise suas conversas em: ${isWebUrl ? currentUrl : 'vibecheck-ai.com'}`;
    
    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: 'VibeCheck AI - Relatório',
          text: shareText
        };
        
        // Só adiciona a URL se ela for considerada válida pelo navegador (http/https)
        if (isWebUrl) {
          shareData.url = currentUrl;
        }

        await navigator.share(shareData);
      } catch (err) {
        // Se falhar mesmo com a validação (ex: cancelado pelo usuário), não faz nada ou tenta o fallback
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("✅ Relatório formatado e copiado para a área de transferência! Cole no WhatsApp.");
  };

  const handleExportPDF = () => {
    window.print();
  };

  const startDatingAnalysis = async () => {
    if (!chatData) return;
    setShowCheckout(false);
    setIsDatingAnalyzing(true);
    try {
      const result = await analyzeDatingInsights(chatData.messages);
      setDatingAnalysis(result);
      setShowDatingReport(true);
    } catch (e) {
      alert("Erro na análise premium.");
    } finally {
      setIsDatingAnalyzing(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatData]);

  if (!chatData) {
    return <DropZone onFileLoaded={handleFileLoaded} />;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden relative">
        <div className="absolute top-0 w-full h-32 bg-gradient-to-r from-pink-600 to-rose-500 z-0"></div>

        <div className="z-10 w-full h-full xl:w-[1600px] xl:h-[95vh] xl:my-auto xl:mx-auto bg-[#f0f2f5] flex shadow-2xl overflow-hidden relative">
            
            {/* Sidebar (Desktop Only) */}
            <div className="w-[30%] hidden md:flex flex-col border-r border-[#d1d7db] bg-white no-print">
                <div className="bg-[#f0f2f5] py-2.5 px-4 flex justify-between items-center h-[60px]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center ring-2 ring-white">
                            <Heart className="text-white w-5 h-5 fill-current" />
                        </div>
                        <button onClick={resetToHome} className="p-2 rounded-full hover:bg-black/5 text-slate-500 active:scale-90 transition-transform"><Home className="w-5 h-5" /></button>
                    </div>
                    <div className="flex gap-4 text-[#54656f]">
                        <Bot className="w-6 h-6 cursor-pointer hover:text-pink-600" onClick={handleAnalysis} />
                        <Heart className="w-6 h-6 cursor-pointer hover:text-pink-500" onClick={() => setShowCheckout(true)} />
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
                            <div className="flex justify-between mb-1">
                                <h3 className="text-[17px] text-[#111b21] font-semibold truncate">{chatData.title}</h3>
                                <span className="text-[10px] text-pink-500 font-black uppercase tracking-tighter">Ready</span>
                            </div>
                            <p className="text-[12px] text-pink-600 font-medium truncate flex items-center gap-1"><Sparkles className="w-3 h-3" /> Análise de AMOR Disponível</p>
                        </div>
                     </div>
                     
                     <div className="p-6 mt-6 mx-4 bg-slate-900 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-pink-400 font-black text-[9px] uppercase tracking-[0.2em] mb-4">
                                <Zap className="w-3 h-3 fill-current" />
                                <span>IA Premium</span>
                            </div>
                            <h4 className="font-bold text-lg mb-2 leading-tight">Veredito do Coração</h4>
                            <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">Descubra a verdade sobre o interesse nesta relação.</p>
                            <button 
                                onClick={() => setShowCheckout(true)}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[11px] font-black py-4 rounded-2xl shadow-lg uppercase tracking-[0.1em] hover:scale-105 transition-transform"
                            >
                                ANALISAR AMOR POR R$ 5,90
                            </button>
                        </div>
                     </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative bg-[#efeae2] w-full overflow-hidden no-print">
                <header className="bg-[#f0f2f5] min-h-[60px] md:h-[65px] px-4 py-2 flex items-center justify-between border-b border-[#d1d7db] z-20">
                    <div className="flex items-center min-w-0">
                        <button 
                          onClick={resetToHome}
                          className="mr-1 p-2.5 hover:bg-black/5 rounded-full shrink-0 active:scale-95 transition-all" 
                          aria-label="Voltar para o início"
                        >
                          <ArrowLeft className="text-[#54656f] w-6 h-6" />
                        </button>
                        
                        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 shrink-0 ring-1 ring-slate-200">
                            <img src={`https://picsum.photos/seed/${chatData.title}/200`} alt="Avatar" className="w-full h-full rounded-full object-cover"/>
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                            <h2 className="text-[#111b21] text-[15px] font-semibold truncate leading-tight">{chatData.title}</h2>
                            <div className="flex items-center mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mr-1.5 animate-pulse"></div>
                                <span className="text-pink-600 text-[10px] md:text-[11px] font-black uppercase tracking-widest truncate">
                                    Status: {datingAnalysis ? 'Amor Analisado' : 'Pronto para Diagnóstico'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-4 text-[#54656f] shrink-0">
                        <button onClick={handleAnalysis} className="p-2 hover:bg-black/5 rounded-full text-pink-600 transition-transform active:scale-90">
                            <Bot className="w-6 h-6" />
                        </button>
                        <button onClick={() => setShowCheckout(true)} className="p-2 hover:bg-black/5 rounded-full text-rose-500 transition-transform active:scale-90">
                            <Sparkles className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* BANNER DE ANÁLISE */}
                {!datingAnalysis && (
                  <div 
                    onClick={() => setShowCheckout(true)}
                    className="relative z-10 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 px-4 py-4 md:py-5 flex items-center justify-between shadow-lg cursor-pointer hover:brightness-110 transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                    <div className="flex items-center gap-3 md:gap-4 relative z-10">
                      <div className="bg-white/20 p-2 md:p-2.5 rounded-2xl backdrop-blur-md border border-white/30 animate-pulse">
                        <Heart className="w-5 h-5 md:w-6 md:h-6 text-white fill-current" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-black text-sm md:text-base leading-tight uppercase tracking-tight">Analisar Relacionamento</span>
                        <span className="text-pink-100 text-[10px] md:text-[11px] font-bold uppercase tracking-widest opacity-90">Diagnóstico Comportamental Especializado</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-5 relative z-10">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-white font-black text-lg md:text-xl leading-none tracking-tighter">R$ 5,90</span>
                        <span className="text-pink-200 text-[8px] font-black uppercase tracking-[0.2em]">Único</span>
                      </div>
                      <div className="bg-white text-pink-600 px-4 py-2 md:px-6 md:py-2.5 rounded-full font-black text-[11px] md:text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 group-hover:gap-4 transition-all duration-300">
                        COMEÇAR <ArrowRight className="w-4 h-4" />
                      </div>
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

                <footer className="bg-[#f0f2f5] min-h-[62px] px-4 py-2 flex items-center gap-2 md:gap-4 z-20 border-t border-slate-200">
                    <Smile className="w-6 h-6 md:w-7 md:h-7 text-[#54656f] shrink-0" />
                    <Paperclip className="hidden md:block w-6 h-6 text-[#54656f] shrink-0" />
                    <div className="flex-1 bg-white rounded-xl px-4 py-3 text-slate-400 text-[13px] md:text-sm truncate shadow-sm border border-slate-200/50">
                        Digite sua percepção aqui...
                    </div>
                    <Mic className="w-6 h-6 md:w-7 md:h-7 text-[#54656f] shrink-0" />
                </footer>
            </div>
        </div>

        {/* LOADING OVERLAY */}
        {(isAnalyzing || isDatingAnalyzing) && (
            <div className="fixed inset-0 bg-[#0f172a]/98 backdrop-blur-3xl z-[300] flex flex-col items-center justify-center p-8 no-print">
                <div className="relative mb-12">
                    <div className={`absolute inset-0 rounded-full blur-[60px] animate-pulse ${isDatingAnalyzing ? 'bg-pink-500/20' : 'bg-blue-500/10'}`}></div>
                    <div className={`w-24 h-24 border-t-2 rounded-full animate-spin ${isDatingAnalyzing ? 'border-pink-500' : 'border-blue-400'}`}></div>
                    <BrainCircuit className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 ${isDatingAnalyzing ? 'text-pink-400' : 'text-blue-300'}`} />
                </div>
                <div className="text-center space-y-6 max-w-xs">
                    <div className="space-y-1">
                      <h3 className="text-white text-3xl font-black uppercase italic tracking-tighter">
                          VibeCheck <span className={isDatingAnalyzing ? "text-pink-500" : "text-blue-400"}>{isDatingAnalyzing ? "Pro" : "Grátis"}</span>
                      </h3>
                      {!isDatingAnalyzing && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Análise Básica Ativa</p>}
                    </div>
                    <div className="h-10">
                        <p className={`text-xs font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom duration-500 ${isDatingAnalyzing ? 'text-pink-400' : 'text-slate-400'}`}>
                            {LOADING_MESSAGES[loadingStep]}
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: RESUMO SIMPLES (Grátis) */}
        {showAnalysis && analysis && (
            <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-md flex justify-center md:justify-end items-end md:items-stretch overflow-hidden no-print">
                <div className="w-full max-w-lg md:max-w-[480px] h-[85vh] md:h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-500 rounded-t-[40px] md:rounded-none overflow-hidden">
                     <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
                         <div className="flex items-center gap-3"><Bot className="w-6 h-6 text-pink-500" /><h2 className="text-lg font-black uppercase tracking-tight">VibeCheck Grátis</h2></div>
                         <button onClick={() => setShowAnalysis(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 min-h-0">
                         <div className="space-y-4">
                             <h3 className="text-pink-600 font-black text-[10px] uppercase tracking-[0.3em]">Resumo Psicológico</h3>
                             <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 text-slate-700 leading-relaxed font-medium text-base md:text-lg italic shadow-inner">
                                 "{analysis.summary}"
                             </div>
                         </div>
                         <div className="space-y-4">
                             <h3 className="text-pink-600 font-black text-[10px] uppercase tracking-[0.3em]">Status Geral</h3>
                             <div className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{analysis.sentiment}</div>
                         </div>
                         <div className="pt-6">
                            <button onClick={() => setShowCheckout(true)} className="w-full bg-pink-500 text-white py-6 rounded-[28px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-pink-500/30 hover:bg-pink-600 transition-all flex items-center justify-center gap-3">
                                <Zap className="w-5 h-5 fill-current text-yellow-300" /> Analisar AMOR (R$ 5,90)
                            </button>
                         </div>
                     </div>
                </div>
            </div>
        )}

        {/* MODAL: CHECKOUT (COMPACTO) */}
        {showCheckout && (
            <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
                <div className="bg-white w-full max-w-[420px] rounded-[32px] overflow-hidden shadow-[0_20px_80px_-15px_rgba(236,72,153,0.3)] animate-in zoom-in duration-500 flex flex-col max-h-[92vh] relative border border-white/10">
                     
                     <div className="bg-[#0f172a] p-7 text-white text-center relative shrink-0 overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-600/20 to-violet-600/20 z-0"></div>
                         
                         <button 
                            className="absolute top-5 right-5 p-1.5 text-white/50 hover:text-white transition-all z-20 bg-white/5 rounded-full" 
                            onClick={() => setShowCheckout(false)}
                         >
                            <X className="w-5 h-5" />
                         </button>

                         <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gradient-to-tr from-pink-600 to-rose-400 rounded-2xl flex items-center justify-center mb-4 shadow-xl rotate-2">
                                <Crown className="w-8 h-8 text-white fill-current" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black mb-1 tracking-tighter leading-tight">Laudo do Relacionamento</h2>
                            <p className="text-pink-300 text-[9px] font-black uppercase tracking-[0.25em]">Diagnóstico de IA Especializada</p>
                         </div>
                     </div>

                     <div className="p-6 md:p-7 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 bg-slate-50/20">
                         
                         <div className="grid grid-cols-1 gap-3">
                             {[
                                 { icon: <TrendingUp className="w-4 h-4" />, title: "Ghosting Score", desc: "Quem está mais propenso a sumir?", color: "blue" },
                                 { icon: <ShieldAlert className="w-4 h-4" />, title: "Reciprocidade", desc: "Sinais reais com provas do texto.", color: "emerald" },
                                 { icon: <ShieldAlert className="w-4 h-4" />, title: "Red Flag Hunter", desc: "Detecta desinteresse e manipulação.", color: "rose" },
                                 { icon: <Target className="w-4 h-4" />, title: "Veredito Final", desc: "Conselho sincero sobre o futuro.", color: "amber" }
                             ].map((item, i) => (
                                 <div key={i} className="flex items-center gap-3.5 bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 hover:border-pink-200 transition-all group">
                                     <div className={`bg-${item.color}-50 p-2.5 rounded-xl text-${item.color}-500 group-hover:scale-105 transition-transform`}>
                                         {item.icon}
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-slate-900 font-black text-[13px]">{item.title}</span>
                                         <span className="text-slate-500 text-[10px] leading-tight font-medium">{item.desc}</span>
                                     </div>
                                 </div>
                             ))}
                         </div>

                         <div className="bg-[#0f172a] p-5 rounded-[28px] flex flex-col items-center justify-center text-white relative overflow-hidden group shadow-lg">
                             <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             
                             <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-white/30 line-through text-[11px] font-bold">R$ 19,90</span>
                                <span className="bg-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">OFERTA</span>
                             </div>
                             <div className="flex items-baseline gap-1">
                                <span className="text-base font-bold text-pink-300">R$</span>
                                <span className="text-4xl font-black tracking-tighter">5,90</span>
                             </div>
                             <span className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em] mt-1.5">Pagamento Único • Acesso Vitalício</span>
                         </div>

                         <div className="space-y-3.5 pt-1">
                             <button 
                                onClick={startDatingAnalysis} 
                                className="relative w-full py-5 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 text-white font-black rounded-[24px] shadow-[0_15px_30px_-8px_rgba(236,72,153,0.4)] flex items-center justify-center gap-3 text-lg hover:scale-[1.01] active:scale-95 transition-all overflow-hidden group"
                             >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                <Zap className="w-5 h-5 fill-current text-yellow-300" />
                                GERAR LAUDO COMPLETO
                             </button>
                             
                             <div className="flex items-center justify-center gap-5 opacity-40 grayscale hover:grayscale-0 transition-all">
                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Shield className="w-2.5 h-2.5" /> Seguro
                                </div>
                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Lock className="w-2.5 h-2.5" /> Privado
                                </div>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        )}

        {/* RELATÓRIO PREMIUM OTIMIZADO */}
        {showDatingReport && datingAnalysis && (
            <div id="printable-report" className="fixed inset-0 z-[250] bg-white flex flex-col animate-in fade-in duration-500">
                <header className="bg-slate-900 p-4 md:px-12 text-white flex justify-between items-center shrink-0 z-30 shadow-xl no-print">
                    <button onClick={() => setShowDatingReport(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"><ArrowLeft className="w-7 h-7" /></button>
                    <div className="flex flex-col items-center">
                        <Logo />
                        <span className="text-[9px] font-black text-pink-500 tracking-[0.4em] uppercase mt-1">Relatório Premium</span>
                    </div>
                    <button onClick={resetToHome} className="p-2 text-slate-500 hover:text-white transition-colors active:scale-90"><Home className="w-6 h-6" /></button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
                    <div className="flex flex-col lg:flex-row min-h-full">
                        
                        {/* Sidebar: Status Global */}
                        <div className="w-full lg:w-[380px] bg-slate-900 p-6 md:p-10 text-white lg:h-auto lg:min-h-screen lg:sticky lg:top-0 shrink-0 z-20">
                            <div className="space-y-10">
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saúde do Relacionamento</h3>
                                        <span className="text-4xl font-black text-white tracking-tighter">{datingAnalysis.relationshipHealth}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5">
                                        <div className="bg-gradient-to-r from-pink-600 to-rose-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ width: `${datingAnalysis.relationshipHealth}%` }}></div>
                                    </div>
                                </div>

                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                                    <p className="text-[9px] font-black text-pink-500 uppercase mb-1 tracking-widest">Tendência</p>
                                    <p className="text-lg font-black tracking-tight">{datingAnalysis.sentimentTrend}</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Índice de Vácuo</h3>
                                        <Info className="w-3.5 h-3.5 text-slate-600 no-print" />
                                    </div>
                                    <div className="grid gap-6">
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
                                    <button 
                                        onClick={handleExportPDF}
                                        className="w-full py-4 rounded-xl bg-pink-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-pink-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FileDown className="w-4 h-4" /> Exportar em PDF
                                    </button>
                                    <button 
                                        onClick={handleShare}
                                        className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Share2 className="w-4 h-4" /> Compartilhar Laudo
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Conteúdo Principal */}
                        <div className="flex-1 p-4 md:p-8 lg:p-16 relative">
                            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                                
                                {/* Seção: Sinais Positivos */}
                                <section className="animate-in slide-in-from-bottom duration-700">
                                    <div className="flex items-center gap-3 mb-6 border-b border-emerald-100 pb-4">
                                        <div className="bg-emerald-100 p-2.5 rounded-xl"><CheckCircle2 className="text-emerald-500 w-5 h-5" /></div>
                                        <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter">Sinais Positivos</h2>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {datingAnalysis.greenFlags.length > 0 ? datingAnalysis.greenFlags.map((gf, i) => (
                                            <div key={i} className="p-5 rounded-3xl bg-white border border-emerald-50 shadow-sm hover:shadow-md transition-all space-y-4">
                                                <p className="text-slate-900 text-sm md:text-base font-bold leading-tight">{gf.description}</p>
                                                <div className="bg-emerald-50/40 border-l-4 border-emerald-400 p-3 rounded-r-xl">
                                                    <p className="text-emerald-950 font-serif italic text-xs leading-relaxed">"{gf.citation}"</p>
                                                </div>
                                            </div>
                                        )) : <p className="text-slate-400 text-sm italic">Nenhum sinal positivo claro.</p>}
                                    </div>
                                </section>

                                {/* Seção: Sinais de Alerta */}
                                <section className="animate-in slide-in-from-bottom duration-700 delay-200">
                                    <div className="flex items-center gap-3 mb-6 border-b border-rose-100 pb-4">
                                        <div className="bg-rose-100 p-2.5 rounded-xl"><AlertTriangle className="text-rose-500 w-5 h-5" /></div>
                                        <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter">Sinais de Alerta</h2>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {datingAnalysis.redFlags.length > 0 ? datingAnalysis.redFlags.map((rf, i) => (
                                            <div key={i} className={`p-5 rounded-3xl bg-white border shadow-sm hover:shadow-md transition-all space-y-4 ${rf.severity === 'high' ? 'border-rose-100' : 'border-orange-50'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${rf.severity === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {rf.severity === 'high' ? 'Crítico' : 'Atenção'}
                                                    </div>
                                                </div>
                                                <p className="text-slate-900 text-sm md:text-base font-bold leading-tight">{rf.description}</p>
                                                <div className={`p-3 rounded-r-xl border-l-4 ${rf.severity === 'high' ? 'bg-rose-50/50 border-rose-400' : 'bg-orange-50/50 border-orange-400'}`}>
                                                    <p className={`font-serif italic text-xs leading-relaxed ${rf.severity === 'high' ? 'text-rose-950' : 'text-orange-950'}`}>"{rf.citation}"</p>
                                                </div>
                                            </div>
                                        )) : <p className="text-slate-400 text-sm italic">Nenhum sinal de alerta detectado.</p>}
                                    </div>
                                </section>

                                {/* Seção: Veredito Final */}
                                <section className="animate-in slide-in-from-bottom duration-700 delay-400">
                                    <div className="bg-slate-900 p-8 md:p-12 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                                            <Bot className="w-32 h-32" />
                                        </div>
                                        <div className="relative z-10">
                                            <h2 className="text-[10px] font-black text-pink-500 mb-4 uppercase tracking-[0.4em]">Veredito Final da IA</h2>
                                            <p className="text-xl md:text-3xl font-light italic leading-relaxed font-serif tracking-tight text-pink-50">
                                                "{datingAnalysis.aiAdvice}"
                                            </p>
                                        </div>
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
