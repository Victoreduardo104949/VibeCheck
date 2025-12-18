
import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileArchive, Loader2, Heart, Sparkles, ShieldCheck, Zap, AlertCircle, MessageSquare, TrendingUp, Star, Lock, EyeOff, ShieldAlert, X, ChevronRight, Info, Smartphone, HelpCircle } from 'lucide-react';
import JSZip from 'jszip';

interface DropZoneProps {
  onFileLoaded: (text: string, attachments?: Record<string, string>) => void;
}

// Exported Logo component to be reused across the application
export const Logo = () => (
  <div className="flex items-center gap-2 group cursor-pointer">
    <div className="relative">
      <div className="bg-gradient-to-tr from-pink-600 to-rose-400 p-2 rounded-2xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
        <Heart className="text-white w-6 h-6 fill-current" />
      </div>
      <Zap className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 fill-current animate-pulse" />
    </div>
    <span className="text-2xl font-black text-white tracking-tighter">Vibe<span className="text-pink-500">Check</span><span className="text-xs ml-1 opacity-50 font-medium">AI</span></span>
  </div>
);

const DropZone: React.FC<DropZoneProps> = ({ onFileLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    setError(null);
    setLoading(true);
    const attachments: Record<string, string> = {};

    try {
        if (file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip')) {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);
            let chatText = "";
            const promises: Promise<void>[] = [];

            loadedZip.forEach((relativePath, zipEntry) => {
                if (zipEntry.dir) return;
                if (relativePath.endsWith('_chat.txt') || (!chatText && relativePath.endsWith('.txt') && !relativePath.startsWith('__MACOSX'))) {
                     promises.push(zipEntry.async('string').then(text => {
                            if (relativePath.endsWith('_chat.txt') || !chatText) chatText = text;
                     }));
                } else if (!relativePath.startsWith('__MACOSX')) {
                    promises.push(zipEntry.async('blob').then(blob => {
                            const fileName = relativePath.split('/').pop() || relativePath;
                            attachments[fileName] = URL.createObjectURL(blob);
                    }));
                }
            });

            await Promise.all(promises);
            if (chatText) onFileLoaded(chatText, attachments);
            else setError("Nenhum arquivo de texto encontrado no ZIP.");
        } else if (file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result;
                if (typeof text === 'string') onFileLoaded(text);
            };
            reader.readAsText(file);
        } else {
            setError("Formato não suportado. Use .zip ou .txt.");
        }
    } catch (e) {
        setError("Erro ao processar arquivo.");
    } finally {
        setLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const SocialProof = () => (
    <div className="flex flex-col items-center gap-4">
        <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
                <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-900" alt="user" />
            ))}
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-pink-500 border-2 border-slate-900 flex items-center justify-center text-[8px] md:text-[10px] font-black text-white">+2k</div>
        </div>
        <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Usado por +15.000 pessoas hoje</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-sans selection:bg-pink-500 selection:text-white text-slate-300">
      
      {/* Hidden File Input for trigger */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept=".zip,.txt" 
        className="hidden" 
        onChange={handleFileChange} 
      />

      {/* Loading Overlay for Mobile/Global */}
      {loading && (
          <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
              <Loader2 className="w-14 h-14 text-pink-500 animate-spin mb-4" />
              <p className="font-bold text-white text-lg animate-pulse">Decifrando sentimentos...</p>
          </div>
      )}

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-600 rounded-full blur-[100px]"></div>
      </div>

      {/* Nav */}
      <nav className="p-6 md:p-8 flex justify-between items-center max-w-7xl mx-auto w-full relative z-10">
        <Logo />
        <div className="flex gap-4 md:gap-8 text-xs md:text-sm font-semibold text-slate-400 items-center">
            <button onClick={() => setShowTutorial(true)} className="hover:text-white transition-colors flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-pink-400" />
              <span>Como Utilizar</span>
            </button>
            <button onClick={() => setShowSecurity(true)} className="hover:text-white transition-colors flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Segurança</span>
            </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-8 md:py-16 relative z-10">
        
        <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/5 text-pink-400 px-4 py-2 rounded-full text-[10px] md:text-xs font-bold mb-6 md:mb-8 border border-white/10 backdrop-blur-sm">
                <Star className="w-3 h-3 fill-current" />
                <span>RELATÓRIOS PSICOLÓGICOS EM SEGUNDOS</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-extrabold text-white leading-[0.95] mb-6 md:mb-8 tracking-tighter">
                O que as <span className="text-gradient">Conversas</span> escondem?
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-8 md:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                VibeCheck AI analisa o subtexto das suas mensagens para revelar o nível de interesse, ghosting e sinais de toxicidade. <b>Porque o amor é cego, mas os dados não.</b>
            </p>

            {/* Mobile Quick Action Section */}
            <div className="lg:hidden mb-12 space-y-8">
                {error && (
                    <div className="bg-rose-500/10 text-rose-400 text-xs p-4 rounded-2xl border border-rose-500/20 text-center font-bold">
                        {error}
                    </div>
                )}
                
                <div className="space-y-4">
                  <button 
                    onClick={triggerFileInput}
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-500 text-white py-5 rounded-3xl font-black text-lg shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
                  >
                    <FileArchive className="w-6 h-6" />
                    ANALISAR CONVERSA
                    <ChevronRight className="w-5 h-5 opacity-50" />
                  </button>
                  <button onClick={() => setShowTutorial(true)} className="flex items-center justify-center gap-2 mx-auto text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Info className="w-4 h-4" />
                    Tutorial: Como utilizar o .zip
                  </button>
                </div>

                <SocialProof />
            </div>

            <div className="hidden md:flex flex-wrap justify-center lg:justify-start gap-6 mb-12 opacity-80">
                <div className="flex items-center gap-2 text-sm"><ShieldCheck className="w-5 h-5 text-emerald-400" /> 100% Privado</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="w-5 h-5 text-pink-400" /> IA de Última Geração</div>
                <div className="flex items-center gap-2 text-sm"><Zap className="w-5 h-5 text-yellow-400" /> Insights Imediatos</div>
            </div>
        </div>

        {/* Upload Container - HIDDEN ON MOBILE */}
        <div className="hidden lg:block w-full max-w-md relative pb-12 lg:pb-0">
            <div 
                className={`
                    relative bg-slate-900/40 backdrop-blur-2xl rounded-[40px] md:rounded-[48px] shadow-2xl p-8 md:p-10 border border-white/10 transition-all duration-500
                    hover:border-pink-500/50
                `}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-pink-600 to-rose-400 rounded-[28px] md:rounded-[32px] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-2xl shadow-pink-500/20">
                        <Upload className="text-white w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 tracking-tight">Área de Upload</h3>
                    <p className="text-slate-500 text-xs md:text-sm">Arraste ou clique para selecionar o <b>.zip</b></p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 text-rose-400 text-xs p-4 rounded-2xl mb-8 border border-rose-500/20 text-center font-bold">
                        {error}
                    </div>
                )}

                <button 
                    onClick={triggerFileInput}
                    className="btn-primary w-full text-white py-5 rounded-[20px] md:rounded-[24px] font-black text-base md:text-lg shadow-2xl flex items-center justify-center gap-3 cursor-pointer select-none"
                >
                    <FileArchive className="w-6 h-6" />
                    SELECIONAR ARQUIVO
                </button>

                <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-white/5">
                    <SocialProof />
                </div>
            </div>
        </div>
      </main>

      {/* Feature Cards */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6 md:gap-8 relative z-10">
          {[
              { title: "Ghosting Score", desc: "A métrica matemática de quem está ignorando quem.", icon: <TrendingUp className="text-pink-500" /> },
              { title: "Red Flag Hunter", desc: "Identifica manipulação e passividade-agressividade.", icon: <AlertCircle className="text-orange-500" /> },
              { title: "Relatório Local", desc: "Seus dados nunca saem do seu computador.", icon: <ShieldCheck className="text-emerald-500" /> }
          ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-[32px] md:rounded-[40px] hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">{f.icon}</div>
                  <h4 className="text-lg md:text-xl font-bold text-white mb-3">{f.title}</h4>
                  <p className="text-sm md:text-slate-400 leading-relaxed font-light">{f.desc}</p>
              </div>
          ))}
      </section>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/60 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
                <button 
                    onClick={() => setShowTutorial(false)}
                    className="absolute top-6 right-6 md:top-8 md:right-8 text-slate-500 hover:text-white transition-colors p-2 z-10"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className="p-8 md:p-12 overflow-y-auto">
                    <div className="flex items-center gap-4 mb-8 text-pink-400">
                        <HelpCircle className="w-8 h-8 md:w-10 md:h-10" />
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Como Utilizar</h2>
                    </div>

                    <div className="grid gap-12">
                        {/* iOS Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-white font-black text-sm uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl w-fit">
                                <Smartphone className="w-4 h-4 text-blue-400" />
                                <span>iPhone (iOS)</span>
                            </div>
                            <ol className="grid gap-4 text-slate-400 text-sm md:text-base">
                                <li className="flex gap-4">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-white">01</span>
                                    <span>Abra a conversa e toque no <b>nome do contato/grupo</b> no topo.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-white">02</span>
                                    <span>Role até o final e toque em <b>Exportar Conversa</b>.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-white">03</span>
                                    <span>Escolha <b>Anexar Mídia</b> (se quiser ver fotos) ou <b>Sem Mídia</b>.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-white">04</span>
                                    <span>Toque em <b>Salvar em Arquivos</b> e envie esse <b>.zip</b> para aqui!</span>
                                </li>
                            </ol>
                        </div>

                        {/* Android Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-white font-black text-sm uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl w-fit">
                                <Smartphone className="w-4 h-4 text-emerald-400" />
                                <span>Android</span>
                            </div>
                            <ol className="grid gap-4 text-slate-400 text-sm md:text-base">
                                <li className="flex gap-4">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-white">01</span>
                                    <span>Abra a conversa e toque nos <b>três pontos (⋮)</b> no topo.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-white">02</span>
                                    <span>Toque em <b>Mais</b> e depois em <b>Exportar conversa</b>.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-white">03</span>
                                    <span>Selecione <b>Incluir arquivos de mídia</b> ou não.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-white">04</span>
                                    <span>Salve no seu Drive ou envie o <b>.zip</b> para o seu dispositivo.</span>
                                </li>
                            </ol>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[24px]">
                            <p className="text-amber-200 text-xs font-bold leading-relaxed">
                                💡 <b>Dica:</b> Exportar <b>Com Mídia</b> permite que nossa IA analise até o tempo que você leva para responder fotos! Além de exibir as fotos na nossa tela de chat.
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowTutorial(false)}
                        className="mt-12 w-full py-5 bg-white text-slate-950 font-black rounded-2xl md:rounded-3xl hover:bg-pink-500 hover:text-white transition-all uppercase tracking-widest text-[10px] md:text-xs"
                    >
                        Já entendi, vamos lá!
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Security Modal */}
      {showSecurity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/60 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl relative">
                <button 
                    onClick={() => setShowSecurity(false)}
                    className="absolute top-6 right-6 md:top-8 md:right-8 text-slate-500 hover:text-white transition-colors p-2"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className="p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8 md:mb-10 text-emerald-400">
                        <ShieldCheck className="w-8 h-8 md:w-10 md:h-10" />
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Segurança & Privacidade</h2>
                    </div>

                    <div className="grid gap-6 md:gap-8">
                        <div className="flex gap-4 md:gap-6">
                            <div className="bg-white/5 p-3 md:p-4 rounded-2xl h-fit">
                                <Lock className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-base md:text-lg mb-1 md:mb-2">Zero Armazenamento</h4>
                                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">Não possuímos servidores de banco de dados. O processamento do texto é feito na memória e limpo após a análise.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 md:gap-6">
                            <div className="bg-white/5 p-3 md:p-4 rounded-2xl h-fit">
                                <EyeOff className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-base md:text-lg mb-1 md:mb-2">Privacidade Total</h4>
                                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">Ninguém além de você vê os resultados. As chaves de API são isoladas e os dados não são usados para treinamento.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 md:gap-6">
                            <div className="bg-white/5 p-3 md:p-4 rounded-2xl h-fit">
                                <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-base md:text-lg mb-1 md:mb-2">Criptografia Local</h4>
                                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">A comunicação com o modelo de inteligência artificial é protegida por túneis criptografados SSL de última geração.</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowSecurity(false)}
                        className="mt-10 md:mt-12 w-full py-5 bg-white text-slate-950 font-black rounded-2xl md:rounded-3xl hover:bg-pink-500 hover:text-white transition-all uppercase tracking-widest text-[10px] md:text-xs"
                    >
                        Entendi, estou seguro
                    </button>
                </div>
            </div>
        </div>
      )}

      <footer className="py-12 md:py-20 text-center opacity-30 text-[9px] md:text-[11px] font-medium tracking-widest relative z-10">
          VIBECHECK AI &copy; 2025 • DECODING HEARTS • PRIVACY FIRST
      </footer>
    </div>
  );
};

export default DropZone;
