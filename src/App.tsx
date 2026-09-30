import React, { useState, useRef, useEffect } from 'react';
import { Upload, TrendingUp, AlertTriangle, Info, Loader2, ChevronRight, BarChart2, ShieldAlert, Activity, CheckCircle2, Calendar as CalendarIcon, Clock, AlertOctagon, Trophy, PieChart, DollarSign, CheckCircle, XCircle, Target, Compass, Zap, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('trading_auth') === 'true';
  });
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const handlePinInput = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setPinError(false);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin === '2580') {
      setIsAuthenticated(true);
      sessionStorage.setItem('trading_auth', 'true');
    } else {
      setPinError(true);
      setTimeout(() => {
        setPin('');
        setPinError(false);
      }, 800);
    }
  };

  const handleClear = () => {
    setPin('');
    setPinError(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('trading_auth');
    setPin('');
  };

  const [activeTab, setActiveTab] = useState<'analyze' | 'track' | 'calendar' | 'performance' | 'goals'>('analyze');
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [imminentEvent, setImminentEvent] = useState<any | null>(null);

  // Daily Goals & Asset Selector State
  const [targetProfit, setTargetProfit] = useState<number>(5.00);
  const [accountBalance, setAccountBalance] = useState<number>(10.00);
  const [riskTolerance, setRiskTolerance] = useState<'conservador' | 'moderado' | 'agresivo'>('moderado');

  // Performance / Trades Records State
  interface TradeRecord {
    id: string;
    timestamp: string;
    asset: string;
    result: 'TP' | 'SL';
    pnl: number;
  }
  const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>([]);

  const addTradeRecord = (asset: string, result: 'TP' | 'SL') => {
    const pnl = result === 'TP' ? 1.50 : -1.00;
    const newRecord: TradeRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      asset: asset.includes('Activo') ? asset : 'Señal Scalping',
      result,
      pnl
    };
    setTradeRecords(prev => [newRecord, ...prev]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/calendar')
        .then(res => res.json())
        .then(data => {
          if (data.events) {
            setCalendarEvents(data.events);
            const imminent = data.events.find((e: any) => e.status.includes('Próximo'));
            setImminentEvent(imminent || null);
          }
        })
        .catch(err => console.error('Error loading calendar:', err));
    }
  }, [isAuthenticated]);
  
  // Analyze State
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tracking State
  const [trackImage, setTrackImage] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const trackFileInputRef = useRef<HTMLInputElement>(null);

  // History State
  interface HistoryItem {
    id: string;
    timestamp: string;
    image: string;
    result: string;
    summary: string;
  }
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (activeTab === 'analyze') {
                setImage(reader.result as string);
                setResult(null);
                setError(null);
              } else {
                setTrackImage(reader.result as string);
                setTrackResult(null);
                setTrackError(null);
              }
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [activeTab]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'analyze' | 'track') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'analyze') {
          setImage(reader.result as string);
          setResult(null);
          setError(null);
        } else {
          setTrackImage(reader.result as string);
          setTrackResult(null);
          setTrackError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeChart = async () => {
    if (!image) return;

    setAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data.analysis);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        image,
        result: data.analysis,
        summary: data.analysis.split('\n').find((l: string) => l.includes('Activo:') || l.includes('Dirección:')) || 'Señal de Trading'
      };
      setHistory(prev => [newItem, ...prev].slice(0, 3));
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al analizar la gráfica.');
    } finally {
      setAnalyzing(false);
    }
  };

  const trackTrade = async () => {
    if (!trackImage) return;

    setTracking(true);
    setTrackError(null);
    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: trackImage, originalSignal: result }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setTrackResult(data.analysis);
    } catch (err: any) {
      setTrackError(err.message || 'Ocurrió un error al realizar el seguimiento.');
    } finally {
      setTracking(false);
    }
  };

  const renderFormattedResult = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('SEÑAL DE TRADING') || line.startsWith('SEGUIMIENTO DE OPERACIÓN')) {
        return <h2 key={i} className="text-xl font-bold text-yellow-400 mb-4 border-b border-gray-700 pb-2">{line}</h2>;
      }
      if (line.match(/^(ANÁLISIS|PLANIFICACIÓN DE ENTRADA Y GESTIÓN DE RIESGO|ESTADO DEL OPERACIÓN|RECOMENDACIÓN DE GESTIÓN|AUDITORÍA TÉCNICA DE INDICADORES):/)) {
        return <h3 key={i} className="text-lg font-semibold text-purple-400 mt-4 mb-2">{line}</h3>;
      }
      if (line.includes('COMPRA') || line.includes('LONG') || line.includes('MANTENER') || line.includes('ESPERAR TP')) {
        return <span key={i} className="text-green-400 font-bold">{line}</span>;
      }
      if (line.includes('VENTA') || line.includes('SHORT') || line.includes('CERRAR AHORA') || line.includes('CORTAR EN SL')) {
        return <span key={i} className="text-red-400 font-bold">{line}</span>;
      }
      if (line.startsWith('---')) {
        return <hr key={i} className="my-4 border-gray-700" />;
      }
      return <div key={i} className="text-gray-300 leading-relaxed">{line}</div>;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white font-sans flex items-center justify-center p-4">
        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 shadow-2xl w-full max-w-md text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-yellow-400 to-green-500" />
          
          <div className="mx-auto w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-blue-500" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-2">TradingSignal<span className="text-blue-500">Pro</span></h1>
          <p className="text-sm text-gray-400 mb-6">Acceso seguro protegido por PIN</p>

          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl font-bold transition-all
                  ${pinError ? 'border-red-500 bg-red-500/10 text-red-500 animate-shake' : 
                    pin.length > i ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-gray-800 bg-[#0d1117] text-gray-600'}`}
              >
                {pin.length > i ? '•' : ''}
              </div>
            ))}
          </div>

          {pinError && (
            <p className="text-xs text-red-500 font-semibold mb-4">PIN incorrecto. Intenta nuevamente.</p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === 'C') handleClear();
                  else if (btn === '⌫') setPin(prev => prev.slice(0, -1));
                  else handlePinInput(btn);
                }}
                className="h-14 bg-gray-900 hover:bg-gray-800 active:bg-blue-600/20 border border-gray-800 rounded-xl text-lg font-semibold transition-all flex items-center justify-center text-white shadow"
              >
                {btn}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-gray-500">Plataforma exclusiva de scalping. PIN predeterminado: 2580</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#161b22] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">TradingSignal<span className="text-blue-500">Pro</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => setActiveTab('analyze')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'analyze' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Nueva Señal
              </button>
              <button
                onClick={() => setActiveTab('track')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'track' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Seguimiento en Curso
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'calendar' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Calendario
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'performance' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Rendimiento
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'goals' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                Metas & Vehículos
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-gray-800 hover:bg-red-600/20 text-gray-300 hover:text-red-400 border border-gray-700 hover:border-red-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
              title="Bloquear sesión"
            >
              Bloquear
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 rounded-full text-xs font-medium text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              IA Online
            </div>
          </div>
        </div>
      </header>

      {imminentEvent && (
        <div className="bg-red-600/20 border-b border-red-500/30 px-4 py-3 flex items-center justify-between gap-4 text-xs font-medium text-red-300">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
            <span>
              <strong>⚠️ ALERTA DE ALTO IMPACTO EN CURSO:</strong> {imminentEvent.event} ({imminentEvent.currency}) programado a las {imminentEvent.time}. Evita abrir nuevas operaciones de scalping o protege tu posición actual.
            </span>
            <button 
              onClick={() => setActiveTab('calendar')}
              className="ml-auto underline hover:text-white font-bold shrink-0"
            >
              Ver Calendario
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'analyze' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Upload & Preview */}
              <section className="space-y-6">
                <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold">Análisis de Gráfica & Órdenes Pendientes</h2>
                  </div>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4
                      ${image ? 'border-gray-700 bg-[#0d1117]' : 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/5'}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={(e) => handleImageUpload(e, 'analyze')} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    
                    {image ? (
                      <img src={image} alt="Preview" className="max-h-[400px] w-full object-contain rounded-lg shadow-2xl" />
                    ) : (
                      <>
                        <div className="p-4 bg-gray-800 rounded-full">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-300">Haz clic para subir, arrastra o presiona <span className="text-blue-400 font-bold">Ctrl+V</span> para pegar</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG o WEBP desde el portapapeles</p>
                        </div>
                      </>
                    )}
                  </div>

                  {image && (
                    <div className="mt-6 flex gap-3">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700"
                      >
                        Cambiar imagen
                      </button>
                      <button 
                        onClick={analyzeChart}
                        disabled={analyzing}
                        className="flex-[2] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analizando plan de entrada...
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-5 h-5" />
                            Generar Señal Profesional
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Risk Warnings */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-500">Gestión para Cuentas Pequeñas (&lt;10 USD)</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Usa siempre órdenes pendientes (Limit / Stop) para evitar deslizamientos de precio. Respeta el tiempo de exposición y corta la operación si el mercado no reacciona en el tiempo estimado.
                    </p>
                  </div>
                </div>
              </section>

              {/* Right Column: Analysis Output */}
              <section className="space-y-6">
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <TrendingUp className="w-32 h-32" />
                      </div>
                      
                      <div className="relative z-10 whitespace-pre-wrap">
                        {renderFormattedResult(result)}
                      </div>
                    </motion.div>
                  ) : analyzing ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-[#161b22] border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-6 shadow-xl h-full min-h-[400px]"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <BarChart2 className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Calculando niveles profesionales...</h3>
                        <p className="text-sm text-gray-400 max-w-xs mx-auto">
                          Evaluando estructuras de precio para programar Buy/Sell Limit óptimos con gestión de riesgo estricta.
                        </p>
                      </div>
                    </motion.div>
                  ) : error ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 flex flex-col items-center text-center gap-4 shadow-xl"
                    >
                      <AlertTriangle className="w-12 h-12 text-red-500" />
                      <div>
                        <h3 className="text-lg font-bold text-white">Error de Análisis</h3>
                        <p className="text-sm text-gray-400 mt-1">{error}</p>
                      </div>
                      <button 
                        onClick={analyzeChart}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Reintentar
                      </button>
                    </motion.div>
                  ) : (
                    <div className="bg-[#161b22] border border-gray-800 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-xl h-full min-h-[400px]">
                      <div className="p-4 bg-gray-800/50 rounded-full">
                        <Info className="w-10 h-10 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-300">Esperando gráfica</h3>
                        <p className="text-sm text-gray-500 max-w-xs">
                          Sube una captura o pega con <span className="text-blue-400 font-bold">Ctrl+V</span> para generar tu plan de scalping con órdenes pendientes.
                        </p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </section>
            </div>

            {history.length > 0 && (
              <div className="mt-8 bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-md font-semibold">Historial Reciente (Últimas 3 Señales para Comparación)</h3>
                  </div>
                  <span className="text-xs text-gray-500">{history.length} / 3 guardadas</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {history.map((item, idx) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setImage(item.image);
                        setResult(item.result);
                      }}
                      className="bg-[#0d1117] border border-gray-800 hover:border-blue-500 rounded-lg p-4 cursor-pointer transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400">Señal #{history.length - idx}</span>
                        <span className="text-[10px] text-gray-500">{item.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt="Thumbnail" className="w-16 h-12 object-cover rounded border border-gray-800 group-hover:border-blue-500 transition-colors" />
                        <p className="text-xs text-gray-300 font-medium line-clamp-2">{item.summary}</p>
                      </div>
                      <button className="w-full py-1.5 bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white rounded text-xs font-medium transition-colors mb-1">
                        Restaurar / Comparar
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); addTradeRecord(item.summary, 'TP'); }}
                          className="flex-1 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded text-[11px] font-bold transition-colors"
                          title="Marcar como exitosa (TP)"
                        >
                          ✅ TP (+$1.50)
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); addTradeRecord(item.summary, 'SL'); }}
                          className="flex-1 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded text-[11px] font-bold transition-colors"
                          title="Marcar como fallida (SL)"
                        >
                          ❌ SL (-$1.00)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'track' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tracking Upload Section */}
            <section className="space-y-6">
              <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold">Seguimiento de Operación en Curso</h2>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Pega una nueva captura de pantalla de cómo va tu operación abierta para que la IA evalúe si debes cerrar, mantener, esperar TP o cortar en pérdidas.
                </p>
                
                <div 
                  onClick={() => trackFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4
                    ${trackImage ? 'border-gray-700 bg-[#0d1117]' : 'border-gray-700 hover:border-blue-500 hover:bg-blue-500/5'}`}
                >
                  <input 
                    type="file" 
                    ref={trackFileInputRef} 
                    onChange={(e) => handleImageUpload(e, 'track')} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  
                  {trackImage ? (
                    <img src={trackImage} alt="Tracking Preview" className="max-h-[400px] w-full object-contain rounded-lg shadow-2xl" />
                  ) : (
                    <>
                      <div className="p-4 bg-gray-800 rounded-full">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-300">Pega tu captura actual con <span className="text-blue-400 font-bold">Ctrl+V</span></p>
                        <p className="text-xs text-gray-500 mt-1">Evalúa el progreso de tu scalping en tiempo real</p>
                      </div>
                    </>
                  )}
                </div>

                {trackImage && (
                  <div className="mt-6 flex gap-3">
                    <button 
                      onClick={() => trackFileInputRef.current?.click()}
                      className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700"
                    >
                      Cambiar imagen
                    </button>
                    <button 
                      onClick={trackTrade}
                      disabled={tracking}
                      className="flex-[2] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                      {tracking ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Evaluando operación...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Evaluar Estado Actual
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Tracking Output Section */}
            <section className="space-y-6">
              <AnimatePresence mode="wait">
                {trackResult ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Activity className="w-32 h-32" />
                    </div>
                    
                    <div className="relative z-10 whitespace-pre-wrap">
                      {renderFormattedResult(trackResult)}
                    </div>
                  </motion.div>
                ) : tracking ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#161b22] border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-6 shadow-xl h-full min-h-[400px]"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                      <Activity className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Analizando el comportamiento del precio...</h3>
                      <p className="text-sm text-gray-400 max-w-xs mx-auto">
                        Verificando si la vela actual respeta tu zona o si es mejor cerrar y asegurar capital.
                      </p>
                    </div>
                  </motion.div>
                ) : trackError ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 flex flex-col items-center text-center gap-4 shadow-xl"
                  >
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Error de Seguimiento</h3>
                      <p className="text-sm text-gray-400 mt-1">{trackError}</p>
                    </div>
                    <button 
                      onClick={trackTrade}
                      className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Reintentar
                    </button>
                  </motion.div>
                ) : (
                  <div className="bg-[#161b22] border border-gray-800 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-xl h-full min-h-[400px]">
                    <div className="p-4 bg-gray-800/50 rounded-full">
                      <Info className="w-10 h-10 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300">Sin seguimiento activo</h3>
                      <p className="text-sm text-gray-500 max-w-xs">
                        Sube o pega una captura de tu operación en curso para recibir asesoramiento en tiempo real.
                      </p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </section>
          </div>
        ) : activeTab === 'calendar' ? (
          <div className="space-y-6">
            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Calendario Económico de Alto Impacto</h2>
                    <p className="text-xs text-gray-400">Monitoreo automático de noticias macroeconómicas para proteger tus operaciones de scalping.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs font-semibold text-gray-300">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  Sesión en Vivo
                </div>
              </div>

              {imminentEvent && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-4">
                  <AlertOctagon className="w-8 h-8 text-red-500 shrink-0 animate-bounce" />
                  <div>
                    <h4 className="text-sm font-bold text-red-400">Precaución Inminente: Evento de Alto Impacto</h4>
                    <p className="text-xs text-gray-300 mt-0.5">
                      <strong>{imminentEvent.event}</strong> ({imminentEvent.currency}) a las {imminentEvent.time}. Evita abrir operaciones o cierra posiciones existentes para prevenir deslizamientos por volatilidad extrema.
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0d1117] text-gray-400 border-b border-gray-800 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Hora</th>
                      <th className="p-3">Divisa</th>
                      <th className="p-3">Evento Macroeconómico</th>
                      <th className="p-3">Impacto</th>
                      <th className="p-3">Actual</th>
                      <th className="p-3">Previsto</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-gray-300">
                    {calendarEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-[#0d1117]/50 transition-colors">
                        <td className="p-3 font-mono text-white font-bold">{evt.time}</td>
                        <td className="p-3 font-bold text-blue-400">{evt.currency}</td>
                        <td className="p-3 font-medium text-white">{evt.event}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold border border-red-500/30">
                            {evt.impact}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{evt.actual}</td>
                        <td className="p-3 font-mono">{evt.forecast}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            evt.status.includes('Próximo') ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse' :
                            evt.status.includes('Pasado') ? 'bg-gray-800 text-gray-500' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {evt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'performance' ? (
          <div className="space-y-6">
            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-600/20 text-yellow-400 rounded-lg">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Dashboard de Rendimiento & Efectividad</h2>
                    <p className="text-xs text-gray-400">Analiza tus resultados (TP vs SL) para optimizar la precisión de tu operativa.</p>
                  </div>
                </div>
                {tradeRecords.length > 0 && (
                  <button 
                    onClick={() => setTradeRecords([])}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-red-600/20 text-gray-400 hover:text-red-400 border border-gray-700 rounded-lg text-xs font-semibold transition-all"
                  >
                    Reiniciar Historial
                  </button>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Total Operaciones</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{tradeRecords.length}</h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">% de Efectividad (Win Rate)</p>
                    <h3 className="text-2xl font-bold text-green-400 mt-1">
                      {tradeRecords.length > 0 
                        ? `${Math.round((tradeRecords.filter(r => r.result === 'TP').length / tradeRecords.length) * 100)}%` 
                        : '0%'}
                    </h3>
                  </div>
                  <div className="p-3 bg-green-500/10 text-green-400 rounded-xl">
                    <PieChart className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Ganancia / Pérdida Neta</p>
                    <h3 className={`text-2xl font-bold mt-1 ${
                      tradeRecords.reduce((acc, r) => acc + r.pnl, 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${tradeRecords.reduce((acc, r) => acc + r.pnl, 0).toFixed(2)} USD
                    </h3>
                  </div>
                  <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Aciertos (TP) / Fallos (SL)</p>
                    <h3 className="text-xl font-bold text-white mt-1">
                      <span className="text-green-400">{tradeRecords.filter(r => r.result === 'TP').length}</span> / <span className="text-red-400">{tradeRecords.filter(r => r.result === 'SL').length}</span>
                    </h3>
                  </div>
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                    <Trophy className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Trades Log Table */}
              <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-6">
                <h3 className="text-md font-semibold mb-4">Historial de Operaciones Registradas</h3>
                {tradeRecords.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    No hay operaciones registradas aún. Genera señales y marca <strong>TP</strong> o <strong>SL</strong> en el historial para registrar tu efectividad.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#161b22] text-gray-400 border-b border-gray-800 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Hora</th>
                          <th className="p-3">Activo / Señal</th>
                          <th className="p-3">Resultado</th>
                          <th className="p-3">P&L (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 text-gray-300">
                        {tradeRecords.map((trade) => (
                          <tr key={trade.id} className="hover:bg-[#161b22]/50 transition-colors">
                            <td className="p-3 font-mono text-gray-400">{trade.timestamp}</td>
                            <td className="p-3 font-medium text-white">{trade.asset}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                trade.result === 'TP' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {trade.result === 'TP' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                {trade.result === 'TP' ? 'Take Profit (+1.50)' : 'Stop Loss (-1.00)'}
                              </span>
                            </td>
                            <td className={`p-3 font-mono font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'goals' ? (
          <div className="space-y-6">
            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Metas Diarias & Selector de Vehículos Financieros</h2>
                  <p className="text-xs text-gray-400">Define tu objetivo diario de ganancia y recibe orientación experta sobre qué activo operar.</p>
                </div>
              </div>

              {/* Goal Configurator Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" /> Configuración de Meta
                  </h3>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Balance Actual de Cuenta (USD)</label>
                    <input 
                      type="number" 
                      value={accountBalance} 
                      onChange={(e) => setAccountBalance(Number(e.target.value))}
                      className="w-full bg-[#161b22] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Meta de Beneficio Diario (USD)</label>
                    <input 
                      type="number" 
                      value={targetProfit} 
                      onChange={(e) => setTargetProfit(Number(e.target.value))}
                      className="w-full bg-[#161b22] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Tolerancia al Riesgo</label>
                    <select 
                      value={riskTolerance}
                      onChange={(e: any) => setRiskTolerance(e.target.value)}
                      className="w-full bg-[#161b22] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="conservador">Conservador (Riesgo 1% por operación)</option>
                      <option value="moderado">Moderado (Riesgo 2-3% por operación)</option>
                      <option value="agresivo">Agresivo (Cuentas pequeñas / Apalancado)</option>
                    </select>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                    Porcentaje de crecimiento diario requerido: <strong>{accountBalance > 0 ? ((targetProfit / accountBalance) * 100).toFixed(1) : 0}%</strong>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-[#0d1117] border border-gray-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-yellow-400" /> Vehículos Financieros Recomendados para tu Meta
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vehicle 1 */}
                    <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-blue-400">XAU/USD (Oro)</span>
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">Alta Volatilidad</span>
                        </div>
                        <p className="text-xs text-gray-400">Ideal si buscas alcanzar tu meta en 1 o 2 operaciones rápidas debido a su gran rango diario en pips.</p>
                      </div>
                      <div className="text-[11px] text-gray-300 bg-gray-900 p-2 rounded border border-gray-800">
                        ⚡ <strong>Estrategia:</strong> Scalping en gráficos de 1m/5m utilizando órdenes Limit en soportes clave.
                      </div>
                    </div>

                    {/* Vehicle 2 */}
                    <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-green-400">EUR/USD o GBP/USD</span>
                          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">Bajo Spread (Estable)</span>
                        </div>
                        <p className="text-xs text-gray-400">Perfecto para cuentas pequeñas (&lt;$20) con spread mínimo y movimientos técnicos muy limpios.</p>
                      </div>
                      <div className="text-[11px] text-gray-300 bg-gray-900 p-2 rounded border border-gray-800">
                        ⚡ <strong>Estrategia:</strong> Operar en sesión de Londres o Nueva York buscando rupturas de rangos asiáticos.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl text-xs text-gray-300 space-y-1">
                    <p className="font-bold text-white mb-1">💡 Sugerencia del Sistema para tu Cuenta de ${accountBalance}:</p>
                    {targetProfit / accountBalance > 0.5 ? (
                      <p>⚠️ Tu meta representa un <strong>{(targetProfit / accountBalance * 100).toFixed(0)}%</strong> de tu capital. Para lograrlo sin quemar tu cuenta, utiliza <strong>XAU/USD</strong> con órdenes pendientes estrictas y no arriesgues más del 5% por trade.</p>
                    ) : (
                      <p>✅ Tu meta es sostenible. Te recomendamos operar <strong>EUR/USD</strong> con gestión de riesgo moderada, completando de 2 a 3 operaciones exitosas de +$1.50 a +$2.00 cada una.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Exit Strategy Advice Section */}
              <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-6">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" /> Consejos Profesionales: ¿Cuándo Necesito Cerrar Operaciones?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4" /> 1. Exhaustión de Vela o Mechas Largas
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Si el precio avanza rápido hacia tu objetivo pero deja una mecha muy larga de rechazo en una resistencia o soporte clave, el impulso se agotó. No esperes al último pip: asegura el beneficio actual.
                    </p>
                  </div>

                  <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4" /> 2. Límite de Tiempo (Time-Stop)
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      El scalping vive de la velocidad. Si una operación en gráfico de 5 minutos lleva más de 25-30 minutos estancada en el mismo sitio sin tocar TP ni SL, el mercado está indeciso. Cierra la posición para liberar margen.
                    </p>
                  </div>

                  <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-bold text-green-400 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4" /> 3. Regla de Breakeven Automático
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Una vez que la operación alcance el 50% o 60% de la distancia hacia tu Take Profit, mueve obligatoriamente tu Stop Loss al precio de entrada (Breakeven). Esto convierte la operación en un trade sin riesgo.
                    </p>
                  </div>

                  <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4" /> 4. Cambio Estructural Inesperado
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Si ibas en compra y de repente aparece una vela bajista envolvente con volumen institucional que rompe el último mínimo estructural, sal de inmediato. Cortar una pérdida a tiempo salva tu cuenta.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-gray-800 text-center text-gray-500">
        <p className="text-xs">© 2026 Trading Signal Pro • Powered by Gemini AI • Scalping Strategy v2.0</p>
      </footer>
    </div>
  );
}
