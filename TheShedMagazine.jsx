// NOTE: In this browser-based setup, we access libraries from the global window object
// instead of using 'import'. This prevents the "Loading..." freeze.

const { useState, useEffect, useRef } = React;
const { 
  Mic, Play, Square, Circle, Settings, Music, 
  Guitar, Activity, Repeat, Volume2, Key, Sliders,
  Hand, Move, BookOpen, Menu, ArrowLeft, ChevronRight,
  Hammer, Disc, Star, List, X, Clock, ArrowRight, Shuffle
} = lucide;

// --- DATA: ORIGINAL MAGAZINE CONTENT ---
const VOLUMES = [
  {
    id: 'vol1',
    title: 'Volume I: The Masters of Self-Invention',
    subtitle: 'The Foundations: Rock, Jazz, and the Oral Tradition',
    musicians: [
      {
        id: 'clapton',
        name: 'Eric Clapton',
        archetype: 'The Disciple',
        theme: 'amber',
        quote: "I would practice blues chords for hours... noting weak spots in my performance... until the performance was perfect.",
        origin: "Clapton didn’t want to be a guitarist; he wanted to be a blues singer. Because he was shy about his voice, he forced his guitar to carry the melody.",
        lessons: [
          { id: 'clapton-1', title: 'The "Woman Tone"', theoryLabel: 'Sonic Engineering', theory: "Clapton’s Cream-era sound was thick and sustaining, mimicking a cello.", drillLabel: 'The Hack', drill: "Turn your guitar's Tone Knob all the way down to 0 on the neck pickup. Crank the amp volume to compensate.", duration: 5 },
          { id: 'clapton-2', title: 'The "Vocal" Breath', theoryLabel: 'Phrasing', theory: "Singers have to stop to breathe. Guitarists don't, which is why many sound like typewriters.", drillLabel: 'The Practice', drill: "Play a short lick. Say out loud: 'Answer me.' (Creates a mandatory rest). Play a responding lick.", duration: 10 }
        ],
        artistChallenge: { title: 'The "Tape Loop" Critic', description: 'Record yourself improvising for 2 minutes. Listen back immediately. Identify one specific weakness. Record again, fixing only that.' }
      },
      {
        id: 'hendrix',
        name: 'Jimi Hendrix',
        archetype: 'The Voodoo Child',
        theme: 'purple',
        quote: "I realized I was able to memorize the notes... I heard that 'G' on the guitar and then I was listening to the radio...",
        origin: "Hendrix was a 'hanger-on' who learned by watching. He couldn't just play chords or solos; he merged them.",
        lessons: [
          { id: 'hendrix-1', title: 'The Thumb-Over Grip', theoryLabel: 'Mechanics', theory: "Wrap your thumb over the top to fret the Root Note on Low E.", drillLabel: 'The Freedom', drill: "Leaves four fingers free to add embellishments (hammer-ons) while the chord rings.", duration: 5 },
          { id: 'hendrix-2', title: 'Double Stops', theoryLabel: 'Texture', theory: "Play two adjacent strings together (usually 4ths or 3rds).", drillLabel: 'The Riff', drill: "In A Minor Pentatonic (5th fret), flatten index finger across B and E strings. Hammer ring finger onto G string (7th).", duration: 10 }
        ],
        artistChallenge: { title: 'The "Radio" Memory', description: 'Turn on a random playlist, pause a melody, and try to find it on your instrument within three tries.' }
      }
    ]
  },
  {
    id: 'vol2',
    title: 'Volume II: The Architects of Sound',
    subtitle: 'Groove, Texture, and Physics',
    musicians: [
      {
        id: 'nile',
        name: 'Nile Rodgers',
        archetype: 'The Hitmaker',
        theme: 'pink',
        quote: "It's not about how many notes you play, it's about how many notes you don't let ring.",
        origin: "The master of funk guitar who turned rhythm playing into a lead instrument.",
        lessons: [
          { id: 'nile-1', title: 'The "Chuck"', theoryLabel: 'Muting', theory: "Constant motion creates the groove.", drillLabel: 'The Technique', drill: "Keep right hand moving in 16th notes. Squeeze chord only for accents. Relax instantly for the rest.", duration: 10 },
          { id: 'nile-2', title: 'Triad Inversions', theoryLabel: 'Voicing', theory: "Big chords clutter the mix.", drillLabel: 'The Drill', drill: "Play only top 3 strings (G, B, E). Find three different places to play a D Major triad up the neck.", duration: 10 }
        ],
        artistChallenge: { title: 'The "16th Note" Marathon', description: 'Set metronome to 100 BPM. Mute strings. Strum continuous 16th notes for 3 minutes without stopping.' }
      },
      {
        id: 'vanhalen',
        name: 'Eddie Van Halen',
        archetype: 'The Innovator',
        theme: 'rose',
        quote: "I didn't really know what scales were... I just heard it in my head.",
        origin: "A tinkerer who built his own guitars and reinvented the vocabulary of the instrument.",
        lessons: [
          { id: 'vh-1', title: 'Two-Handed Tapping', theoryLabel: 'Piano Technique', theory: "Transferring piano technique to guitar.", drillLabel: 'The Pattern', drill: "Tap note (Right Hand) -> Pull off to fretted note (Left Index) -> Hammer on (Left Ring).", duration: 15 },
          { id: 'vh-2', title: 'The "Brown Sound"', theoryLabel: 'Voltage', theory: "Voltage starvation for warmer tone.", drillLabel: 'Simulation', drill: "Lower the 'Sag' or 'Bias' on your amp modeler to simulate a dying battery effect.", duration: 5 }
        ],
        artistChallenge: { title: 'The "Hummingbird" Pick', description: 'Tremolo pick a single note as fast as physically possible for 60 seconds. Focus on relaxing the wrist.' }
      }
    ]
  },
  {
    id: 'vol3',
    title: 'Volume III: The Wind & The Keys',
    subtitle: 'Learning from Non-Guitarists',
    musicians: [
      {
        id: 'coltrane',
        name: 'John Coltrane',
        archetype: 'The High Priest',
        theme: 'emerald',
        quote: "I start in the middle of a sentence and move both directions at once.",
        origin: "The saxophonist who pushed harmony to its absolute limit.",
        lessons: [
          { id: 'coltrane-1', title: '"Sheets of Sound"', theoryLabel: 'Superimposition', theory: "Layering arpeggios over static chords.", drillLabel: 'The Drill', drill: "Over C Major, play an E Minor 7 arpeggio (E-G-B-D). Layers 9ths, 11ths, 13ths.", duration: 20 },
          { id: 'coltrane-2', title: '3-on-1 Practice', theoryLabel: 'Exhaustion', theory: "Exhausting the possibilities of a single note.", drillLabel: 'The Drill', drill: "Take one note (e.g., Root). Find every way to approach it from above/below before landing on it.", duration: 15 }
        ],
        artistChallenge: { title: 'The "Giant Steps" Cycle', description: 'Play a Major 7 arpeggio. Move it up by a Major 3rd. Play it again. Repeat until you return to start.' }
      },
      {
        id: 'davis',
        name: 'Miles Davis',
        archetype: 'The Prince of Darkness',
        theme: 'cyan',
        quote: "Don't play what's there; play what's not there.",
        origin: "The master of space and cool.",
        lessons: [
          { id: 'davis-1', title: 'The "Eggshells"', theoryLabel: 'Dynamics', theory: "Restrained power is magnetic.", drillLabel: 'The Drill', drill: "Turn amp loud, play incredibly lightly. Make the audience lean in.", duration: 10 },
          { id: 'davis-2', title: 'The "Cool" Note', theoryLabel: 'Ambiguity', theory: "Ambiguity creates mood.", drillLabel: 'The Drill', drill: "End your phrase on the 9th (e.g., in C Major, end on D). Sounds unresolved and floating.", duration: 5 }
        ],
        artistChallenge: { title: 'The "Negative Space" Solo', description: 'Play a phrase. You must then rest for a duration EQUAL to the length of that phrase before playing again.' }
      }
    ]
  }
];

// --- AUDIO ENGINE UTILS (Sonic Studio) ---
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FREQUENCIES = {
  'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63, 'F': 349.23,
  'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
};

const playSynthSound = (ctx, type, time, freq, duration, vol = 0.5) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + duration);
};

const playKick = (ctx, time, vol = 0.8) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.5);
};

const playSnare = (ctx, time, vol = 0.4) => {
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBuffer.length; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(time);
};

const playHiHat = (ctx, time, vol = 0.15) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(8000, time);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 7000;
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.1);
};

// --- STUDIO TOOLS (Restored from SonicStudio.jsx) ---

// 1. REAL-TIME TUNER
const Tuner = ({ isActive }) => {
  const [note, setNote] = useState('-');
  const [cents, setCents] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const rafId = useRef(null);

  const autoCorrelate = (buf, sampleRate) => {
    let SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buf[i]) < thres) { r1 = i; break; } }
    for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; } }
    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i];
    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    let T0 = maxpos;
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    return sampleRate / T0;
  };

  const updatePitch = () => {
    if (!analyserRef.current) return;
    const buf = new Float32Array(2048);
    analyserRef.current.getFloatTimeDomainData(buf);
    const ac = autoCorrelate(buf, audioCtxRef.current.sampleRate);
    if (ac !== -1) {
      const noteNum = 12 * (Math.log(ac / 440) / Math.log(2)) + 69;
      const roundedNote = Math.round(noteNum);
      const value = NOTES[roundedNote % 12];
      const centDiff = Math.floor((noteNum - roundedNote) * 100);
      setNote(value);
      setCents(centDiff);
    }
    rafId.current = requestAnimationFrame(updatePitch);
  };

  const toggleTuner = async () => {
    if (isListening) {
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioCtxRef.current) audioCtxRef.current.close();
      cancelAnimationFrame(rafId.current);
      setIsListening(false);
      setNote('-');
      setCents(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        setIsListening(true);
        updatePitch();
      } catch (err) {
        alert("Microphone access denied.");
      }
    }
  };

  useEffect(() => { return () => { if (rafId.current) cancelAnimationFrame(rafId.current); if (audioCtxRef.current) audioCtxRef.current.close(); }; }, []);
  if (!isActive) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-inner">
      <div className="mb-8 relative">
        <div className={`w-40 h-40 rounded-full border-8 flex items-center justify-center transition-colors duration-200 ${Math.abs(cents) < 5 && note !== '-' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-slate-600'}`}>
          <span className="text-6xl font-black text-white">{note}</span>
        </div>
        {isListening && <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-mono text-slate-400">{cents > 0 ? `+${cents}` : cents} ct</div>}
      </div>
      <div className="w-full max-w-xs h-2 bg-slate-700 rounded-full mb-12 relative overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10"></div>
        {isListening && note !== '-' && <div className={`absolute top-0 bottom-0 w-2 rounded-full transition-all duration-100 ${Math.abs(cents) < 5 ? 'bg-green-500' : 'bg-red-500'}`} style={{ left: `calc(50% + ${cents}px)`, transform: 'translateX(-50%)' }}></div>}
      </div>
      <button onClick={toggleTuner} className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold transition-all ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'}`}>
        <Mic className="w-5 h-5" /> {isListening ? 'Stop Mic' : 'Start Tuner'}
      </button>
    </div>
  );
};

// 2. TAPE LOOPER
const TapeLooper = ({ isActive }) => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setRecording(true);
      setAudioUrl(null);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-inner relative overflow-hidden">
      <div className="absolute top-4 right-4 opacity-20"><Repeat className="w-16 h-16" /></div>
      <div className="flex items-center justify-center gap-8 mb-12">
         <div className={`w-32 h-32 rounded-full border-8 border-slate-700 bg-slate-900 flex items-center justify-center relative ${recording || (audioUrl && !audioRef.current?.paused) ? 'animate-spin-slow' : ''}`}>
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600"></div>
            <div className="absolute w-full h-1 bg-transparent border-t-2 border-slate-600 top-1/2 -translate-y-1/2"></div>
         </div>
         <div className={`w-32 h-32 rounded-full border-8 border-slate-700 bg-slate-900 flex items-center justify-center relative ${recording || (audioUrl && !audioRef.current?.paused) ? 'animate-spin-slow' : ''}`}>
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600"></div>
            <div className="absolute w-full h-1 bg-transparent border-t-2 border-slate-600 top-1/2 -translate-y-1/2"></div>
         </div>
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} loop controls className="w-full max-w-md mb-8" />}
      <div className="flex gap-4">
        {!recording ? (
          <button onClick={startRecording} className="bg-red-500 hover:bg-red-400 text-white px-8 py-4 rounded-full flex items-center gap-2 font-bold shadow-lg active:scale-95"><Circle className="w-4 h-4 fill-current" /> REC</button>
        ) : (
          <button onClick={stopRecording} className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-full flex items-center gap-2 font-bold animate-pulse"><Square className="w-4 h-4 fill-current" /> STOP</button>
        )}
        <button onClick={() => setAudioUrl(null)} disabled={!audioUrl} className="bg-slate-900 border border-slate-600 text-slate-300 px-8 py-4 rounded-full font-bold disabled:opacity-50">Clear Tape</button>
      </div>
    </div>
  );
};

// 3. VISUALIZER
const Visualizer = ({ isActive, rootKey, scaleType }) => {
  const [viewMode, setViewMode] = useState('guitar');
  const getScaleNotes = () => {
    const rootIdx = NOTES.indexOf(rootKey);
    let intervals = [];
    if (scaleType === 'major') intervals = [0, 2, 4, 5, 7, 9, 11];
    else if (scaleType === 'minor') intervals = [0, 2, 3, 5, 7, 8, 10];
    else if (scaleType === 'pentatonic_maj') intervals = [0, 2, 4, 7, 9];
    else if (scaleType === 'pentatonic_min') intervals = [0, 3, 5, 7, 10];
    return intervals.map(i => NOTES[(rootIdx + i) % 12]);
  };
  const scaleNotes = getScaleNotes();
  const isNoteInScale = (note) => scaleNotes.includes(note);
  const isRoot = (note) => note === rootKey;

  const renderGuitarString = (startNote, stringIdx) => {
    const startIdx = NOTES.indexOf(startNote);
    let frets = [];
    for (let i = 0; i < 13; i++) {
      const currentNote = NOTES[(startIdx + i) % 12];
      const inScale = isNoteInScale(currentNote);
      const root = isRoot(currentNote);
      frets.push(
        <div key={i} className="flex-1 border-r border-slate-600 relative h-8 flex items-center justify-center">
          <div className="absolute w-full h-[1px] bg-slate-500 z-0 top-1/2"></div>
          {inScale && <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm transition-all ${root ? 'bg-cyan-500 text-slate-900 scale-125' : 'bg-slate-700 text-slate-200 border border-slate-500'}`}>{currentNote}</div>}
        </div>
      );
    }
    return <div key={stringIdx} className="flex border-b border-slate-700/50 last:border-0"><div className="w-10 border-r-4 border-slate-400 bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold z-20">{startNote}</div>{frets}</div>;
  };

  const renderPiano = () => {
    let keys = [];
    const startOctave = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const fullRange = [...startOctave, ...startOctave.slice(0, 5)];
    return (
      <div className="flex justify-center relative h-40 pt-4">
        {fullRange.map((note, idx) => {
          const isBlack = note.includes('#');
          const inScale = isNoteInScale(note);
          const root = isRoot(note);
          if (isBlack) return null;
          const nextIsBlack = fullRange[idx + 1] && fullRange[idx + 1].includes('#');
          return (
            <div key={idx} className="relative group">
              <div className={`w-12 h-40 border border-slate-300 rounded-b-lg flex flex-col justify-end items-center pb-2 transition-colors ${inScale ? (root ? 'bg-cyan-100' : 'bg-white') : 'bg-slate-200 opacity-50'}`}>
                {inScale && <span className={`text-xs font-bold ${root ? 'text-cyan-600' : 'text-slate-400'}`}>{note}</span>}
              </div>
              {nextIsBlack && <div className={`absolute top-0 -right-4 w-8 h-24 z-10 rounded-b border border-slate-900 ${isNoteInScale(fullRange[idx + 1]) ? (isRoot(fullRange[idx + 1]) ? 'bg-cyan-600' : 'bg-slate-800') : 'bg-slate-900 opacity-50'}`}></div>}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isActive) return null;
  return (
    <div className="h-full flex flex-col bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-inner">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Scale Visualizer</h3>
        <div className="bg-slate-900 p-1 rounded-lg flex gap-1">
           <button onClick={() => setViewMode('guitar')} className={`p-2 rounded transition-all ${viewMode === 'guitar' ? 'bg-slate-700 text-cyan-300' : 'text-slate-500'}`}><Guitar className="w-4 h-4" /></button>
           <button onClick={() => setViewMode('piano')} className={`p-2 rounded transition-all ${viewMode === 'piano' ? 'bg-slate-700 text-cyan-300' : 'text-slate-500'}`}><Key className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 p-4 overflow-x-auto shadow-inner flex items-center justify-center">
         {viewMode === 'guitar' ? <div className="w-full min-w-[300px]">{renderGuitarString('E', 0)}{renderGuitarString('B', 1)}{renderGuitarString('G', 2)}{renderGuitarString('D', 3)}{renderGuitarString('A', 4)}{renderGuitarString('E', 5)}<div className="flex pl-10 pt-1">{[0,1,2,3,4,5,6,7,8,9,10,11,12].map(n => <div key={n} className="flex-1 text-center text-[8px] text-slate-600">{n}</div>)}</div></div> : renderPiano()}
      </div>
      <div className="mt-4 text-center text-sm text-slate-500 font-mono">Showing: <span className="text-cyan-400">{rootKey} {scaleType.replace('_', ' ')}</span></div>
    </div>
  );
};

// --- SONIC STUDIO MAIN WRAPPER ---

const SonicStudio = ({ onExit }) => {
  const [bpm, setBpm] = useState(110);
  const [rootKey, setRootKey] = useState('E');
  const [scaleType, setScaleType] = useState('minor');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeModule, setActiveModule] = useState('jamstation');
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volumes, setVolumes] = useState({ kick: 0.8, snare: 0.4, hihat: 0.15, bass: 0.5 });
  
  const jamCtxRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef(null);
  const beatCountRef = useRef(0);
  const volumesRef = useRef(volumes);

  useEffect(() => { volumesRef.current = volumes; }, [volumes]);

  const scheduleNote = (beatNumber, time) => {
    const ctx = jamCtxRef.current;
    if (!ctx) return;
    
    setTimeout(() => setCurrentBeat(beatNumber % 4), Math.max(0, (time - ctx.currentTime) * 1000));
    
    const vol = volumesRef.current;
    if (beatNumber % 4 === 0 && vol.kick > 0) playKick(ctx, time, vol.kick);
    if (beatNumber % 4 === 2 && vol.snare > 0) playSnare(ctx, time, vol.snare);
    if (vol.hihat > 0) { playHiHat(ctx, time, vol.hihat); playHiHat(ctx, time + (60 / bpm) / 2, vol.hihat); }
    const freq = FREQUENCIES[rootKey] / 4; 
    if (beatNumber % 4 === 0 && vol.bass > 0) playSynthSound(ctx, 'sawtooth', time, freq, 0.2, vol.bass);
  };

  const scheduler = () => {
    while (nextNoteTimeRef.current < jamCtxRef.current.currentTime + 0.1) {
        scheduleNote(beatCountRef.current, nextNoteTimeRef.current);
        nextNoteTimeRef.current += 60.0 / bpm;
        beatCountRef.current++;
    }
    timerIDRef.current = setTimeout(scheduler, 25);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      setIsPlaying(false);
      beatCountRef.current = 0;
    } else {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      jamCtxRef.current = new AudioContext();
      nextNoteTimeRef.current = jamCtxRef.current.currentTime + 0.1;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => { return () => { if (timerIDRef.current) clearTimeout(timerIDRef.current); if (jamCtxRef.current) jamCtxRef.current.close(); }; }, []);

  return (
    <div className="bg-slate-950 text-slate-200 min-h-screen font-sans">
      {/* Studio Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
           <button onClick={onExit} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
           </button>
           <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">SONIC STUDIO</h1>
        </div>
        <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-xl border border-slate-700">
           <button onClick={togglePlay} className={`p-3 rounded-full transition-all ${isPlaying ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-green-500'}`}>
              {isPlaying ? <Square className="fill-current w-4 h-4"/> : <Play className="fill-current w-4 h-4"/>}
           </button>
           <div className="flex flex-col">
             <span className="text-[10px] text-slate-400 font-bold uppercase">Tempo</span>
             <div className="flex items-center gap-2">
               <span className="font-mono text-cyan-300 w-8">{bpm}</span>
               <input type="range" min="40" max="220" value={bpm} onChange={e=>setBpm(Number(e.target.value))} className="w-20 accent-cyan-500 h-1 bg-slate-700 rounded-lg appearance-none"/>
             </div>
           </div>
           <div className="h-8 w-px bg-slate-700 mx-1"></div>
           <div className="flex flex-col">
             <span className="text-[10px] text-slate-400 font-bold uppercase">Key</span>
             <select value={rootKey} onChange={e=>setRootKey(e.target.value)} className="bg-transparent text-cyan-300 font-bold text-sm outline-none">
                {NOTES.map(n=><option key={n} value={n}>{n}</option>)}
             </select>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] text-slate-400 font-bold uppercase">Scale</span>
             <select value={scaleType} onChange={e=>setScaleType(e.target.value)} className="bg-transparent text-cyan-300 font-bold text-sm outline-none">
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="pentatonic_maj">Pent Maj</option>
                <option value="pentatonic_min">Pent Min</option>
             </select>
           </div>
        </div>
      </div>

      <main className="p-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Module Nav */}
         <div className="bg-slate-900 rounded-2xl p-4 h-fit border border-slate-800 shadow-lg">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Modules</h3>
            <div className="flex flex-col gap-2">
               {['jamstation','tuner','looper', 'visualizer'].map(m => (
                 <button key={m} onClick={()=>setActiveModule(m)} className={`text-left p-3 rounded-xl font-medium capitalize flex items-center gap-3 transition-all ${activeModule===m ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'hover:bg-slate-800 text-slate-400'}`}>
                    {m === 'jamstation' && <Music className="w-4 h-4"/>}
                    {m === 'tuner' && <Mic className="w-4 h-4"/>}
                    {m === 'looper' && <Repeat className="w-4 h-4"/>}
                    {m === 'visualizer' && <Sliders className="w-4 h-4"/>}
                    {m === 'jamstation' ? 'Jam Mixer' : m}
                 </button>
               ))}
            </div>
            
            <div className="mt-8 p-4 bg-slate-800/50 rounded-xl text-xs text-slate-500 leading-relaxed border border-slate-800">
               <strong className="text-slate-400 block mb-2 uppercase">Status</strong>
               <div className="flex justify-between mb-1"><span>BPM:</span> <span className="text-cyan-400">{bpm}</span></div>
               <div className="flex justify-between"><span>Key:</span> <span className="text-cyan-400">{rootKey} {scaleType}</span></div>
            </div>
         </div>

         {/* Active Module */}
         <div className="md:col-span-3 min-h-[500px]">
             {activeModule === 'jamstation' && (
               <div className="h-full flex flex-col bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl relative overflow-hidden">
                 <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-bold text-white">Jam Station Mixer</h2>
                   <div className="flex gap-2">
                      {[0,1,2,3].map(b => <div key={b} className={`w-3 h-3 rounded-full ${currentBeat === b && isPlaying ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]' : 'bg-slate-700'}`}></div>)}
                   </div>
                 </div>
                 <div className="grid grid-cols-4 gap-4 flex-1">
                    {Object.entries(volumes).map(([inst, vol]) => (
                      <div key={inst} className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center gap-4 border border-slate-800">
                         <div className="h-32 w-8 bg-slate-800 rounded-full relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-cyan-500 transition-all" style={{height: `${vol*100}%`}}></div>
                            <input type="range" min="0" max="1" step="0.1" value={vol} onChange={e=>setVolumes(p=>({...p, [inst]: parseFloat(e.target.value)}))} 
                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -rotate-90"/>
                         </div>
                         <span className="font-bold uppercase text-xs text-slate-400">{inst}</span>
                      </div>
                    ))}
                 </div>
                 <div className="mt-6 text-center text-xs text-slate-500">Bass synth automatically tunes to <strong className="text-cyan-400">{rootKey}</strong></div>
               </div>
             )}

             {activeModule === 'tuner' && <Tuner isActive={true} />}
             
             {activeModule === 'looper' && <TapeLooper isActive={true} />}
             
             {activeModule === 'visualizer' && <Visualizer isActive={true} rootKey={rootKey} scaleType={scaleType} />}
         </div>
      </main>
    </div>
  );
}

// --- MAIN MAGAZINE COMPONENTS ---

const Cover = ({ onOpen, onRead }) => (
  <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center p-4 md:p-8 font-serif relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
    <div className="max-w-5xl w-full bg-white shadow-2xl relative z-10 border-4 border-stone-900">
      
      {/* Header */}
      <div className="border-b-4 border-stone-900 p-8 flex justify-between items-end">
         <div>
            <h1 className="text-8xl font-black tracking-tighter leading-none text-stone-900">THE SHED</h1>
            <p className="text-xl font-bold tracking-widest text-orange-600 mt-2">THE MUSICIAN'S WORKSTATION</p>
         </div>
         <div className="text-right hidden md:block">
            <div className="text-lg font-bold">VOL. IV</div>
            <div className="text-stone-500">JAN 2026</div>
         </div>
      </div>

      {/* Hero */}
      <div className="grid md:grid-cols-2 min-h-[500px]">
         <div className="p-12 flex flex-col justify-center bg-stone-900 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <span className="bg-cyan-500 text-stone-900 px-3 py-1 text-sm font-bold uppercase tracking-wider mb-4 inline-block">Interactive Feature</span>
              <h2 className="text-6xl font-bold mb-6 leading-none group-hover:text-cyan-400 transition-colors">SONIC<br/>STUDIO</h2>
              <p className="text-stone-400 text-lg mb-8 max-w-sm">
                 The 10x Musician's toolkit. Tuner, Looper, and Jam Station—embedded right in your browser.
              </p>
              <button onClick={onOpen} className="bg-white text-stone-900 px-8 py-4 font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors flex items-center gap-2">
                 Launch Studio <ArrowRight className="w-5 h-5"/>
              </button>
            </div>
            <Activity className="absolute -bottom-12 -right-12 w-64 h-64 text-stone-800 group-hover:text-stone-700 transition-colors" />
         </div>

         <div className="p-12 bg-white flex flex-col justify-center">
             <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">In This Issue</h3>
             <ul className="space-y-6">
                {VOLUMES.map((v, i) => (
                   <li key={v.id} className="group cursor-pointer" onClick={onRead}>
                      <span className="text-orange-600 font-bold text-sm block mb-1">{v.title.split(':')[0]}</span>
                      <h4 className="text-2xl font-bold leading-tight group-hover:underline decoration-4 decoration-orange-500 underline-offset-4">{v.subtitle}</h4>
                   </li>
                ))}
             </ul>
             <button onClick={onRead} className="mt-12 text-stone-900 font-bold border-b-2 border-stone-900 w-max hover:text-orange-600 hover:border-orange-600 transition-colors">
                Read All Articles &rarr;
             </button>
         </div>
      </div>
    </div>
  </div>
);

const TOC = ({ onViewMusician, onBack, onOpenStudio }) => (
  <div className="min-h-screen bg-[#f8fafc] font-serif">
     <nav className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center z-20">
        <button onClick={onBack} className="text-2xl font-black tracking-tighter hover:text-orange-600">THE SHED</button>
        <button onClick={onOpenStudio} className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-600">
           <Activity className="w-4 h-4" /> Sonic Studio
        </button>
     </nav>

     <div className="max-w-4xl mx-auto p-8 md:p-16">
        <h1 className="text-5xl font-black mb-16 text-center">Table of Contents</h1>
        
        <div className="grid gap-12">
           {VOLUMES.map(vol => (
             <div key={vol.id} className="border-t-4 border-stone-900 pt-8">
                <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-8">
                   <h2 className="text-3xl font-bold">{vol.title}</h2>
                   <span className="text-stone-500 italic text-lg mt-2 md:mt-0">{vol.subtitle}</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                   {vol.musicians.map(m => (
                     <div key={m.id} onClick={() => onViewMusician(m)} 
                          className={`bg-white p-8 border border-stone-200 hover:border-${m.theme}-500 cursor-pointer group transition-all hover:shadow-xl`}>
                        <div className={`text-xs font-bold uppercase tracking-widest mb-2 text-${m.theme}-600`}>{m.archetype}</div>
                        <h3 className="text-2xl font-black mb-4 group-hover:text-stone-600">{m.name}</h3>
                        <p className="text-stone-600 line-clamp-2 mb-6 font-sans text-sm">{m.origin}</p>
                        <span className="text-sm font-bold underline decoration-2 underline-offset-4 decoration-stone-200 group-hover:decoration-orange-500">View Lessons &rarr;</span>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
     </div>
  </div>
);

const MusicianProfile = ({ musician, onBack }) => {
   const [saved, setSaved] = useState(false);
   
   return (
     <div className="min-h-screen bg-white font-serif">
        <button onClick={onBack} className="fixed top-6 left-6 z-30 bg-white/90 backdrop-blur p-3 rounded-full border border-stone-200 hover:bg-stone-100 shadow-lg">
           <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="max-w-3xl mx-auto px-6 pt-24 pb-24">
           {/* Header */}
           <div className="text-center mb-16">
              <span className={`inline-block px-3 py-1 rounded-full bg-${musician.theme}-100 text-${musician.theme}-800 text-xs font-bold uppercase tracking-widest mb-6`}>
                 {musician.archetype}
              </span>
              <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-none">{musician.name}</h1>
              <div className="border-l-4 border-orange-500 pl-6 py-2 text-left mx-auto max-w-2xl">
                 <p className="text-2xl italic text-stone-600">"{musician.quote}"</p>
              </div>
           </div>

           <div className="prose prose-lg prose-stone mx-auto mb-20">
              <p className="lead first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:mt-[-8px]">
                 {musician.origin}
              </p>
           </div>

           {/* Lessons */}
           <h2 className="text-3xl font-black mb-8 border-b-2 border-stone-100 pb-4">Key Techniques</h2>
           <div className="space-y-12">
              {musician.lessons.map(lesson => (
                 <div key={lesson.id} className="bg-stone-50 p-8 rounded-2xl border border-stone-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-stone-300">{lesson.id.split('-')[1]}</div>
                    
                    <div className="relative z-10">
                       <h3 className="text-2xl font-bold mb-2">{lesson.title}</h3>
                       <div className="flex gap-4 mb-6 text-xs font-bold uppercase tracking-wider text-stone-500">
                          <span>{lesson.theoryLabel}</span>
                          <span>•</span>
                          <span>{lesson.duration} Min</span>
                       </div>
                       
                       <div className="grid md:grid-cols-2 gap-8">
                          <div>
                             <h4 className="font-bold text-stone-900 mb-2">The Theory</h4>
                             <p className="text-stone-600 text-sm leading-relaxed">{lesson.theory}</p>
                          </div>
                          <div className="bg-white p-6 rounded-xl border-l-4 border-orange-500 shadow-sm">
                             <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2">
                                <Hammer className="w-4 h-4 text-orange-500"/> The Drill
                             </h4>
                             <p className="text-stone-800 font-medium">{lesson.drill}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>

           {/* Challenge */}
           {musician.artistChallenge && (
             <div className="mt-16 bg-stone-900 text-white p-10 rounded-3xl text-center relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="relative z-10">
                   <h3 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-4">Artist Challenge</h3>
                   <h2 className="text-3xl font-bold mb-4">{musician.artistChallenge.title}</h2>
                   <p className="text-stone-300 text-lg leading-relaxed max-w-xl mx-auto">{musician.artistChallenge.description}</p>
                </div>
                <div className={`absolute top-0 right-0 w-64 h-64 bg-${musician.theme}-500 opacity-20 rounded-full blur-3xl -mr-16 -mt-16`}></div>
             </div>
           )}
        </div>
     </div>
   );
};

const TheShedMagazine = () => {
  const [view, setView] = useState('cover'); // cover, toc, musician, studio
  const [selectedMusician, setSelectedMusician] = useState(null);

  const goHome = () => {
     window.scrollTo(0,0);
     setView('cover');
  };

  const openMusician = (m) => {
     setSelectedMusician(m);
     window.scrollTo(0,0);
     setView('musician');
  };

  return (
    <div>
      {view === 'cover' && <Cover onOpen={() => setView('studio')} onRead={() => setView('toc')} />}
      
      {view === 'toc' && <TOC 
         onViewMusician={openMusician} 
         onBack={goHome} 
         onOpenStudio={() => setView('studio')} 
      />}
      
      {view === 'musician' && selectedMusician && <MusicianProfile 
         musician={selectedMusician} 
         onBack={() => setView('toc')} 
      />}
      
      {view === 'studio' && <SonicStudio onExit={() => setView('cover')} />}
    </div>
  );
};

// AUTO-MOUNTING LOGIC (BROWSER FRIENDLY)
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<TheShedMagazine />);
}