
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  LucideStars, LucideSparkles, LucideSend, LucidePlay, LucidePause, 
  LucideCalendar, LucideX, LucideRotateCcw, LucideHistory,
  LucideChevronRight, LucideChevronLeft,
  LucideSearch, LucideDatabase,
  LucideClock, LucideExternalLink, LucideCompass, LucideZap, LucideZapOff,
  LucideVolume2, LucideVolumeX, LucideTurtle, LucideWind,
  LucidePlus, LucideMinus, LucideMaximize, LucideActivity, LucideInfo,
  LucideLayers, LucideBookOpen, LucideEye
} from 'lucide-react';
import ZodiacWheel, { ZodiacWheelRef } from './components/ZodiacWheel';
import { PLANETS, EVENT_DATE, START_DATE, END_DATE, FALLBACK_EVENTS, ZODIAC_SIGNS, SPREADSHEET_DB_URL, CelestialEvent } from './constants';
import { Planet, ZodiacSign, Aspect } from './types';
import { getCelestialInsight } from './services/gemini';

const App: React.FC = () => {
  const wheelRef = useRef<ZodiacWheelRef>(null);
  
  // Selection States
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedSign, setSelectedSign] = useState<ZodiacSign | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<Aspect | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CelestialEvent | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  // Simulation States
  const [currentTime, setCurrentTime] = useState<Date>(new Date(EVENT_DATE));
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMode, setSpeedMode] = useState<'super-slow' | 'slow' | 'standard' | 'fast'>('standard');
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  
  // Panel States
  const [activePanel, setActivePanel] = useState<'none' | 'ai' | 'events'>('none');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // AI & Data States
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [events, setEvents] = useState<CelestialEvent[]>(FALLBACK_EVENTS);

  // --- Core Calculations ---

  const getBodyPosition = useCallback((planetName: string) => {
    const planet = PLANETS.find(p => p.name === planetName);
    if (!planet || isNaN(currentTime.getTime())) return { sign: '?', degree: 0 };
    const deltaMs = currentTime.getTime() - EVENT_DATE.getTime();
    const deltaDays = deltaMs / (1000 * 60 * 60 * 24);
    const signIndex = ZODIAC_SIGNS.findIndex(s => s.name === planet.sign);
    const baseTotalDegrees = (signIndex !== -1 ? signIndex : 0) * 30 + planet.degree;
    let currentTotalDegrees = (baseTotalDegrees + (planet.dailySpeed * deltaDays)) % 360;
    if (currentTotalDegrees < 0) currentTotalDegrees += 360;
    const currentSignIdx = Math.floor(currentTotalDegrees / 30);
    const currentDeg = Math.floor(currentTotalDegrees % 30);
    const sign = ZODIAC_SIGNS[currentSignIdx] ? ZODIAC_SIGNS[currentSignIdx].name : '?';
    return { sign, degree: currentDeg };
  }, [currentTime]);

  const currentPositions = useMemo(() => {
    if (isNaN(currentTime.getTime())) return PLANETS.map(p => ({ name: p.name, deg: 0 }));
    const deltaMs = currentTime.getTime() - EVENT_DATE.getTime();
    const deltaDays = deltaMs / (1000 * 60 * 60 * 24);
    return PLANETS.map(p => {
      const signIdx = ZODIAC_SIGNS.findIndex(s => s.name === p.sign);
      const base = (signIdx !== -1 ? signIdx : 0) * 30 + p.degree;
      let deg = (base + (p.dailySpeed * deltaDays)) % 360;
      if (deg < 0) deg += 360;
      return { name: p.name, deg: isNaN(deg) ? 0 : deg };
    });
  }, [currentTime]);

  const activeAspects = useMemo(() => {
    const res: Aspect[] = [];
    for (let i = 0; i < currentPositions.length; i++) {
      for (let j = i + 1; j < currentPositions.length; j++) {
        const p1 = currentPositions[i], p2 = currentPositions[j];
        const diff = Math.abs(p1.deg - p2.deg), normDiff = Math.min(diff, 360 - diff);
        let type: 'conjunction' | 'trine' | 'square' | 'opposition' | null = null;
        let color = '#fff';
        if (normDiff < 6) { type = 'conjunction'; color = '#fbbf24'; }
        else if (Math.abs(normDiff - 120) < 5) { type = 'trine'; color = '#60a5fa'; }
        else if (Math.abs(normDiff - 90) < 4) { type = 'square'; color = '#f87171'; }
        else if (Math.abs(normDiff - 180) < 4) { type = 'opposition'; color = '#f87171'; }
        if (type) res.push({ planet1: p1.name, planet2: p2.name, type, color, meaning: `Interaction: ${p1.name} and ${p2.name}` });
      }
    }
    return res;
  }, [currentPositions]);

  const currentObservations = useMemo(() => {
    if (!events) return [];
    const windowMs = 1000 * 60 * 60 * 24 * 45; // 1.5 month window
    return events
      .filter(ev => Math.abs(ev.date.getTime() - currentTime.getTime()) < windowMs)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, currentTime]);

  const primaryNearEvent = useMemo(() => {
    if (currentObservations.length === 0) {
      if (!events || events.length === 0) return null;
      return events.reduce((prev, curr) => 
        Math.abs(curr.date.getTime() - currentTime.getTime()) < Math.abs(prev.date.getTime() - currentTime.getTime()) ? curr : prev
      );
    }
    return currentObservations.reduce((prev, curr) => 
      Math.abs(curr.date.getTime() - currentTime.getTime()) < Math.abs(prev.date.getTime() - currentTime.getTime()) ? curr : prev
    );
  }, [currentObservations, events, currentTime]);

  useEffect(() => {
    const fetchRemoteData = async () => {
      try {
        const response = await fetch(SPREADSHEET_DB_URL);
        if (response.ok) {
          const csvText = await response.text();
          const lines = csvText.split(/\r?\n/).slice(1);
          const parsed: CelestialEvent[] = lines
            .filter(l => l.trim() !== '')
            .map((line, idx) => {
              const parts = line.split(',').map(s => s.replace(/^"|"$/g, '').trim());
              const [dateStr, name, object, mag, ra, dec, notes] = parts;
              const dateVal = new Date(dateStr);
              return {
                id: `remote-${idx}`,
                name: name || 'Observation',
                date: isNaN(dateVal.getTime()) ? new Date() : dateVal,
                object: object || '',
                mag: mag || '',
                ra: ra || '',
                dec: dec || '',
                description: `A ${name} event involving ${object}.`,
                significance: notes || '',
                notes: notes || '',
                type: name || 'Celestial Interaction',
                isMajor: name?.toLowerCase().includes('alignment') || name?.toLowerCase().includes('eclipse')
              };
            });
          if (parsed.length > 0) setEvents(parsed);
        }
      } catch (err) { console.warn("Fetch failed, using fallback data."); }
    };
    fetchRemoteData();
  }, []);

  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      const interval = speedMode === 'super-slow' ? 1000 : speedMode === 'slow' ? 200 : speedMode === 'standard' ? 50 : 16;
      const hoursToAdd = speedMode === 'super-slow' ? 0.3 : speedMode === 'slow' ? 1.8 : speedMode === 'standard' ? 7.2 : 50.4;
      timer = window.setInterval(() => {
        setCurrentTime(prev => {
          const next = new Date(prev.getTime() + (hoursToAdd * 60 * 60 * 1000));
          if (next > END_DATE) return START_DATE;
          return next;
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speedMode]);

  const handleAiQuery = async () => {
    if (!query.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const res = await getCelestialInsight(query);
      setAiResponse(res);
    } catch (err) { setAiResponse("Data obscured."); }
    finally { setIsAiLoading(false); }
  };

  const handleClearSelections = useCallback(() => {
    setSelectedPlanet(null);
    setSelectedSign(null);
    setSelectedAspect(null);
    setSelectedEvent(null);
  }, []);

  const isAnySelected = selectedPlanet || selectedSign || selectedAspect || selectedEvent;

  return (
    <div className="flex h-screen w-full bg-[#020408] text-slate-200 font-inter overflow-hidden border-t border-white/5">
      
      {/* Sidebar: Registry */}
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-[#0a0f18]/95 border-r border-white/5 flex flex-col relative z-20 overflow-hidden shadow-2xl`}>
        <div className="flex-1 flex flex-col p-6 min-w-[20rem] custom-scrollbar overflow-y-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <LucideLayers className="text-amber-500" size={20} />
            </div>
            <div>
              <h1 className="text-sm font-cinzel font-bold tracking-widest text-white uppercase">Observatory</h1>
              <span className="text-[9px] text-slate-500 tracking-[0.3em] font-black uppercase">Archival Interface v3.1</span>
            </div>
          </div>

          <nav className="space-y-1 mb-10">
            <h2 className="text-[9px] uppercase tracking-[0.4em] text-slate-500 mb-4 font-black">Archive Navigation</h2>
            {[
              { id: 'events', label: 'Events', icon: LucideBookOpen, color: 'text-amber-500' },
              { id: 'ai', label: 'The Archivist', icon: LucideSparkles, color: 'text-blue-500' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActivePanel(activePanel === tab.id ? 'none' : tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wider transition-all border ${activePanel === tab.id ? 'bg-white/10 border-white/10 text-white shadow-inner' : 'hover:bg-white/5 border-transparent text-slate-400'}`}
              >
                <tab.icon size={16} className={tab.color} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="space-y-1">
             <h2 className="text-[9px] uppercase tracking-[0.4em] text-slate-500 mb-4 font-black">Celestial Bodies</h2>
             {PLANETS.map(p => {
               const pos = getBodyPosition(p.name);
               return (
                 <button key={p.name} 
                   className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${hoveredPlanet === p.name || selectedPlanet?.name === p.name ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400'} border border-transparent`}
                   onMouseEnter={() => setHoveredPlanet(p.name)}
                   onMouseLeave={() => setHoveredPlanet(null)}
                   onClick={() => { handleClearSelections(); setSelectedPlanet(p); }}
                 >
                   <div className="flex items-center gap-3">
                     <span style={{ color: p.color }} className="text-xl leading-none transition-transform group-hover:scale-110">{p.symbol}</span>
                     <span className="text-[10px] font-bold uppercase tracking-widest">{p.name}</span>
                   </div>
                   <span className="text-[9px] font-mono opacity-60">{pos.degree}° {pos.sign.substring(0,3).toUpperCase()}</span>
                 </button>
               );
             })}
          </div>
        </div>
      </aside>

      {/* Center Column: Stage */}
      <main className="flex-1 relative flex flex-col min-w-0">
        <div className="absolute top-6 left-6 z-30 flex gap-2">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/20 transition-all text-slate-400">
            {isSidebarOpen ? <LucideChevronLeft size={18} /> : <LucideChevronRight size={18} />}
          </button>
          <div className="w-px h-10 bg-white/10 mx-1" />
          <button onClick={() => wheelRef.current?.zoomIn()} className="p-3 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/20 transition-all text-slate-400"><LucidePlus size={18} /></button>
          <button onClick={() => wheelRef.current?.zoomOut()} className="p-3 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/20 transition-all text-slate-400"><LucideMinus size={18} /></button>
          <button onClick={handleClearSelections} className="p-3 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/20 transition-all text-slate-400"><LucideMaximize size={18} /></button>
        </div>

        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
          <h2 className="text-2xl font-cinzel font-bold tracking-[0.5em] text-white opacity-90 mb-1">ALIGNMENT 2026</h2>
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-1 flex items-center gap-3 shadow-2xl">
             <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest">
               {currentTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
             </span>
             <div className="w-1 h-3 bg-white/10" />
             <span className="text-[10px] font-mono font-black text-slate-400">
               {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
             </span>
          </div>
        </div>

        <ZodiacWheel 
          ref={wheelRef}
          currentTime={currentTime}
          hoveredPlanet={hoveredPlanet}
          selectedPlanet={selectedPlanet}
          selectedSign={selectedSign}
          selectedAspect={selectedAspect}
          selectedEvent={selectedEvent}
          activeAspects={activeAspects}
          onPlanetClick={(p) => { handleClearSelections(); setSelectedPlanet(p); }}
          onSignClick={(s) => { handleClearSelections(); setSelectedSign(s); }}
          onAspectClick={(a) => { handleClearSelections(); setSelectedAspect(a); }}
        />

        <footer className="h-24 bg-[#0a0f18]/90 border-t border-white/5 px-10 flex items-center gap-8 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsPlaying(!isPlaying)} className={`p-4 rounded-xl transition-all ${isPlaying ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {isPlaying ? <LucidePause size={20} /> : <LucidePlay size={20} className="ml-0.5" />}
             </button>
             <button onClick={() => setIsMusicEnabled(!isMusicEnabled)} className={`p-3 rounded-xl transition-all ${isMusicEnabled ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-inner shadow-black/40' : 'text-slate-500 hover:text-slate-300'}`}>
                {isMusicEnabled ? <LucideVolume2 size={20} /> : <LucideVolumeX size={20} />}
             </button>
          </div>
          <div className="flex-1 flex flex-col gap-3">
             <div className="flex justify-between text-[9px] font-black tracking-[0.3em] text-slate-600 uppercase">
                <span>Winter Solstice '25</span>
                <span className="text-amber-500 font-bold px-3 py-1 bg-amber-500/5 rounded-lg border border-amber-500/10">
                  {currentTime.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span>Winter Solstice '26</span>
             </div>
             <input 
               type="range" min={START_DATE.getTime()} max={END_DATE.getTime()} value={currentTime.getTime()} 
               onChange={e => { setIsPlaying(false); setCurrentTime(new Date(parseInt(e.target.value, 10))); }}
               className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none cursor-pointer accent-amber-500"
             />
          </div>
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
             {[
               { id: 'super-slow', icon: LucideTurtle },
               { id: 'standard', icon: LucideWind },
               { id: 'fast', icon: LucideZap }
             ].map(m => (
               <button 
                 key={m.id} 
                 onClick={() => setSpeedMode(m.id as any)}
                 className={`p-2.5 rounded-lg transition-all ${speedMode === m.id ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 <m.icon size={16} />
               </button>
             ))}
          </div>
        </footer>
      </main>

      {/* Right Column: Insight & Observations */}
      <aside className={`${isRightPanelOpen ? 'w-96' : 'w-0'} transition-all duration-300 bg-[#0a0f18]/95 border-l border-white/5 flex flex-col relative z-20 overflow-hidden shadow-2xl`}>
        <div className="flex flex-col h-full min-w-[24rem]">
          
          {/* Header (Sticky) */}
          <div className="flex-shrink-0 p-8 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-black">Insight Console</h2>
              <button onClick={() => setIsRightPanelOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><LucideChevronRight size={18} /></button>
            </div>
          </div>

          {/* Console Display (Sticky area) */}
          <div className="flex-shrink-0 px-8 mb-6">
            <div className="space-y-6">
              {isAnySelected ? (
                <div className="p-8 rounded-[2.5rem] border bg-white/5 border-white/10 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                  {selectedPlanet ? (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <span style={{ color: selectedPlanet.color }} className="text-6xl font-bold leading-none">{selectedPlanet.symbol}</span>
                        <div>
                          <h3 className="text-2xl font-cinzel text-white mb-2">{selectedPlanet.name}</h3>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{selectedPlanet.qualities.join(' • ')}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 italic mb-6 leading-relaxed border-l-2 border-amber-500/30 pl-4">"{selectedPlanet.description}"</p>
                      <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-[11px] text-slate-300 leading-relaxed font-medium">
                        {selectedPlanet.longDescription}
                      </div>
                    </>
                  ) : selectedEvent ? (
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${selectedEvent.isMajor ? 'bg-amber-500/10 text-amber-500 border-amber-500/40 animate-pulse' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {selectedEvent.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{selectedEvent.date.toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-2xl font-cinzel mb-4 text-white leading-tight">{selectedEvent.name}</h3>
                      
                      {(selectedEvent.mag || selectedEvent.ra) && (
                        <div className="grid grid-cols-3 gap-2 mb-6">
                          <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-center">
                            <div className="text-[8px] uppercase text-slate-500 mb-1">Mag</div>
                            <div className="text-[10px] font-mono font-bold text-amber-500">{selectedEvent.mag || 'N/A'}</div>
                          </div>
                          <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-center">
                            <div className="text-[8px] uppercase text-slate-500 mb-1">RA</div>
                            <div className="text-[10px] font-mono font-bold text-slate-300">{selectedEvent.ra || 'N/A'}</div>
                          </div>
                          <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-center">
                            <div className="text-[8px] uppercase text-slate-500 mb-1">Dec</div>
                            <div className="text-[10px] font-mono font-bold text-slate-300">{selectedEvent.dec || 'N/A'}</div>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-slate-400 italic mb-6 opacity-90 leading-relaxed">"{selectedEvent.description}"</p>
                      <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 font-black">Archival Context</div>
                      <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-[11px] text-slate-200 leading-relaxed font-medium mb-6">
                        {selectedEvent.notes || selectedEvent.significance}
                      </div>

                      <div className="flex flex-col gap-3">
                        {selectedEvent.link && (
                          <a href={selectedEvent.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 hover:text-amber-400 transition-colors py-2 border-t border-white/5">
                            <LucideExternalLink size={12} /> External Reference
                          </a>
                        )}
                      </div>
                    </>
                  ) : selectedAspect ? (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <span style={{ color: selectedAspect.color }} className="text-4xl font-bold leading-none animate-pulse">⚯</span>
                        <div>
                          <h3 className="text-2xl font-cinzel text-white mb-2 uppercase">{selectedAspect.type}</h3>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{selectedAspect.planet1} & {selectedAspect.planet2}</span>
                        </div>
                      </div>
                      <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-[11px] text-slate-300 leading-relaxed font-medium">
                        {selectedAspect.meaning}
                      </div>
                    </>
                  ) : selectedSign ? (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <span className="text-6xl font-bold leading-none text-slate-400">{selectedSign.symbol}</span>
                        <div>
                          <h3 className="text-2xl font-cinzel text-white mb-2">{selectedSign.name}</h3>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{selectedSign.element} • {selectedSign.qualities}</span>
                        </div>
                      </div>
                      <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-[11px] text-slate-300 leading-relaxed font-medium">
                        {selectedSign.deepWisdom}
                      </div>
                    </>
                  ) : null}

                  <button onClick={handleClearSelections} className="mt-8 text-[9px] uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                    <LucideRotateCcw size={12} /> Return to Rolling Commentary
                  </button>
                </div>
              ) : (
                /* Rolling Commentary (Ticker Narrative) */
                <div className="p-8 rounded-[2.5rem] border bg-amber-500/[0.03] border-amber-500/10 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
                         <LucideActivity size={14} className="text-amber-500" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Continuous Narration</span>
                   </div>
                   
                   <h3 className="text-xl font-cinzel text-amber-500/90 mb-4 leading-snug">
                     Temporal Focus: {primaryNearEvent?.name || 'Observing The Void'}
                   </h3>
                   
                   <p className="text-xs text-slate-400 leading-[1.8] italic mb-6">
                     {primaryNearEvent 
                       ? `The sky resonates with the coming influence of ${primaryNearEvent.object}. The current archival position highlights a shift in ${primaryNearEvent.type} energy.`
                       : "The simulation cruises through a period of quiet cosmic integration. No major objects are within the immediate archival window."}
                   </p>
                   
                   <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-[11px] text-slate-300 leading-[1.8]">
                      <span className="text-amber-500 font-bold uppercase tracking-widest block mb-2 text-[9px]">Archival Signal</span>
                      {primaryNearEvent?.description || "Monitoring local planetary movements and minor aspects."}
                   </div>

                   <div className="mt-8 flex flex-col gap-2">
                      <span className="text-[8px] uppercase tracking-widest text-slate-600 font-black">Active Interactions</span>
                      <div className="flex flex-wrap gap-2">
                         {activeAspects.length > 0 ? activeAspects.map((a, i) => (
                           <button 
                             key={i} 
                             onClick={(e) => { e.stopPropagation(); setSelectedAspect(a); setSelectedPlanet(null); setSelectedEvent(null); setSelectedSign(null); }}
                             className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md border border-white/5 text-[8px] text-slate-500 hover:text-amber-500 uppercase tracking-tighter transition-colors"
                           >
                             {a.planet1} {a.type} {a.planet2}
                           </button>
                         )) : (
                           <span className="text-[8px] text-slate-700 uppercase italic">No active aspects</span>
                         )}
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Observations List (Scrolling) */}
          <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[9px] uppercase tracking-[0.4em] text-slate-500 font-black">Observations</h2>
              <span className="text-[8px] px-2 py-0.5 bg-white/5 rounded text-slate-600 uppercase font-black">Rolling Window</span>
            </div>
            
            <div className="space-y-3">
              {currentObservations.length > 0 ? currentObservations.map(ev => (
                <button 
                  key={ev.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTime(new Date(ev.date));
                    setSelectedEvent(ev);
                    setSelectedPlanet(null);
                    setSelectedSign(null);
                    setSelectedAspect(null);
                  }}
                  className={`w-full p-5 rounded-2xl border text-left transition-all group ${selectedEvent?.id === ev.id ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                >
                  <div className="flex justify-between items-start text-[9px] font-black uppercase tracking-widest mb-1.5">
                    <span className={`${selectedEvent?.id === ev.id ? 'text-amber-500' : 'text-slate-300'} transition-colors`}>
                      {ev.object}: <span className="text-slate-500 font-bold">{ev.type}</span>
                    </span>
                    <span className="text-slate-600 font-mono">{ev.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                    {ev.notes || ev.description}
                  </p>
                </button>
              )) : (
                <div className="text-center py-20 opacity-20 text-[9px] uppercase tracking-widest italic">No observations in this window.</div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Events Modal */}
      {activePanel !== 'none' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-12 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="w-full max-w-4xl h-full max-h-[75vh] bg-[#0a0f18]/95 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 flex flex-col relative shadow-2xl">
             <button onClick={() => setActivePanel('none')} className="absolute top-10 right-10 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors shadow-2xl">
                <LucideX size={20} />
             </button>

             {activePanel === 'ai' ? (
               <div className="flex flex-col h-full gap-8">
                  <div className="flex items-center gap-4 text-blue-400">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 shadow-xl">
                      <LucideSparkles size={24} />
                    </div>
                    <div className="flex flex-col">
                       <h3 className="text-2xl font-cinzel font-bold tracking-widest text-white">The Archivist</h3>
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Synthetic Planetary Records</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 text-sm text-slate-300 space-y-4">
                    {isAiLoading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                         <LucideRotateCcw size={32} className="animate-spin text-blue-500/40" />
                         <span className="text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">Consulting the Ledger...</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        {aiResponse ? aiResponse.split('\n').map((l, i) => <p key={i}>{l}</p>) : <p className="opacity-40 italic text-center mt-20">Inquire regarding the historical patterns of this configuration.</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 p-1.5 bg-black/60 border border-white/10 rounded-2xl">
                     <input 
                       className="flex-1 bg-transparent border-none text-sm px-6 focus:ring-0 text-slate-200" 
                       placeholder="Consult the records of the sky..." 
                       value={query} 
                       onChange={e => setQuery(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleAiQuery()}
                     />
                     <button onClick={handleAiQuery} className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-xl flex items-center justify-center"><LucideSend size={18} /></button>
                  </div>
               </div>
             ) : (
               <div className="flex flex-col h-full gap-8">
                  <div className="flex items-center gap-4 text-amber-500">
                     <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 shadow-xl">
                       <LucideBookOpen size={24} />
                     </div>
                     <div className="flex flex-col">
                        <h3 className="text-2xl font-cinzel font-bold tracking-widest text-white">Events</h3>
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">2026 Major Celestial Intersections</span>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 pr-4 custom-scrollbar pb-10">
                     {events.map(ev => (
                       <button 
                         key={ev.id} 
                         onClick={() => {
                           setIsPlaying(false);
                           setCurrentTime(ev.date); 
                           setSelectedEvent(ev);
                           setSelectedPlanet(null);
                           setSelectedSign(null);
                           setSelectedAspect(null);
                           setActivePanel('none'); 
                         }}
                         className={`p-8 text-left transition-all rounded-[2.5rem] border group ${ev.isMajor ? 'bg-amber-500/[0.05] border-amber-500/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                       >
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4">
                             <span className={ev.isMajor ? 'text-amber-500' : ''}>{ev.type}</span>
                             <span>{ev.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <h4 className={`text-xl font-bold mb-3 transition-colors ${ev.isMajor ? 'text-amber-500 font-cinzel' : 'text-white group-hover:text-amber-200'}`}>{ev.name}</h4>
                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed italic opacity-80 group-hover:opacity-100">"{ev.description}"</p>
                       </button>
                     ))}
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {!isRightPanelOpen && (
        <button 
          onClick={() => setIsRightPanelOpen(true)}
          className="absolute right-6 top-6 z-30 p-3 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/20 transition-all text-slate-400 shadow-2xl"
        >
          <LucideChevronLeft size={18} />
        </button>
      )}

    </div>
  );
};

export default App;
