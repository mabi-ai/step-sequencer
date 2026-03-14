import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import {
  Play,
  Square,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
  Music,
  Download
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(128);
  const [volume, setVolume] = useState(80);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 32 steps (2 measures of 16th notes)
  const TOTAL_STEPS = 32;

  const [kickSteps, setKickSteps] = useState(Array(TOTAL_STEPS).fill(false));
  const [snareSteps, setSnareSteps] = useState(Array(TOTAL_STEPS).fill(false));
  const [hihatSteps, setHihatSteps] = useState(Array(TOTAL_STEPS).fill(false));

  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const synthRef = useRef<{
    kick: Tone.MembraneSynth;
    snare: Tone.NoiseSynth;
    hihat: Tone.MetalSynth;
    masterVol: Tone.Volume;
  } | null>(null);

  // Use refs to keep track of current steps in the Tone.js loop
  const kickStepsRef = useRef(kickSteps);
  const snareStepsRef = useRef(snareSteps);
  const hihatStepsRef = useRef(hihatSteps);

  useEffect(() => {
    kickStepsRef.current = kickSteps;
    snareStepsRef.current = snareSteps;
    hihatStepsRef.current = hihatSteps;
  }, [kickSteps, snareSteps, hihatSteps]);

  useEffect(() => {
    // Setup Tone.js instruments
    const masterVol = new Tone.Volume(Tone.gainToDb(volume / 100)).toDestination();

    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).connect(masterVol);

    const snare = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 }
    }).connect(masterVol);

    const hihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).connect(masterVol);

    synthRef.current = { kick, snare, hihat, masterVol };

    Tone.Transport.bpm.value = bpm;

    sequenceRef.current = new Tone.Sequence(
      (time, step) => {
        // Schedule UI update slightly ahead
        Tone.Draw.schedule(() => {
          setCurrentStep(step);
        }, time);

        // Access the current state from ref to avoid stale closures
        if (kickStepsRef.current[step]) {
          kick.triggerAttackRelease('C1', '8n', time);
        }
        if (snareStepsRef.current[step]) {
          snare.triggerAttackRelease('16n', time);
        }
        if (hihatStepsRef.current[step]) {
          hihat.triggerAttackRelease('32n', time);
        }
      },
      Array.from({ length: TOTAL_STEPS }, (_, i) => i),
      '16n'
    );

    return () => {
      sequenceRef.current?.dispose();
      kick.dispose();
      snare.dispose();
      hihat.dispose();
      masterVol.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.masterVol.volume.value = Tone.gainToDb(volume / 100);
    }
  }, [volume]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const togglePlay = async () => {
    await Tone.start();

    if (isPlaying) {
      Tone.Transport.stop();
      sequenceRef.current?.stop();
      setCurrentStep(0);
    } else {
      Tone.Transport.start();
      sequenceRef.current?.start(0);
    }
    setIsPlaying(!isPlaying);
  };

  const stop = () => {
    Tone.Transport.stop();
    sequenceRef.current?.stop();
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const clearSteps = () => {
    setKickSteps(Array(TOTAL_STEPS).fill(false));
    setSnareSteps(Array(TOTAL_STEPS).fill(false));
    setHihatSteps(Array(TOTAL_STEPS).fill(false));
  };

  const toggleStep = (type: 'kick' | 'snare' | 'hihat', index: number) => {
    if (type === 'kick') {
      const newSteps = [...kickSteps];
      newSteps[index] = !newSteps[index];
      setKickSteps(newSteps);
    } else if (type === 'snare') {
      const newSteps = [...snareSteps];
      newSteps[index] = !newSteps[index];
      setSnareSteps(newSteps);
    } else if (type === 'hihat') {
      const newSteps = [...hihatSteps];
      newSteps[index] = !newSteps[index];
      setHihatSteps(newSteps);
    }
  };

  const handleExport = async () => {
    try {
      const buffer = await Tone.Offline(async () => {
        const masterVol = new Tone.Volume(Tone.gainToDb(volume / 100)).toDestination();
        const kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 } }).connect(masterVol);
        const snare = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 } }).connect(masterVol);
        const hihat = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(masterVol);

        Tone.Transport.bpm.value = bpm;

        const seq = new Tone.Sequence(
          (time, step) => {
            if (kickSteps[step]) kick.triggerAttackRelease('C1', '8n', time);
            if (snareSteps[step]) snare.triggerAttackRelease('16n', time);
            if (hihatSteps[step]) hihat.triggerAttackRelease('32n', time);
          },
          Array.from({ length: TOTAL_STEPS }, (_, i) => i),
          '16n'
        );

        seq.start(0);
        Tone.Transport.start(0);
      }, (60 / bpm) * 4 * 2); // Export exactly 2 measures

      // Convert buffer to WAV
      const audioBuffer = buffer.get();
      if (!audioBuffer) return;

      const interleaved = new Float32Array(audioBuffer.length * audioBuffer.numberOfChannels);
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < audioBuffer.length; i++) {
          interleaved[i * audioBuffer.numberOfChannels + channel] = channelData[i];
        }
      }

      const wavBytes = getWavBytes(interleaved.buffer, {
        isFloat: true,
        numChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate,
      });

      const blob = new Blob([wavBytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sequence-${bpm}bpm.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper function to create WAV file
  function getWavBytes(buffer: ArrayBufferLike, options: { isFloat: boolean, numChannels: number, sampleRate: number }) {
    const type = options.isFloat ? Float32Array : Uint16Array;

    const headerBytes = 44;
    const wavBytes = new Uint8Array(headerBytes + buffer.byteLength);
    const view = new DataView(wavBytes.buffer);

    view.setUint32(0, 1380533830, false); // "RIFF"
    view.setUint32(4, 36 + buffer.byteLength, true);
    view.setUint32(8, 1463899717, false); // "WAVE"
    view.setUint32(12, 1718449184, false); // "fmt "
    view.setUint32(16, 16, true); // length of fmt data
    view.setUint16(20, options.isFloat ? 3 : 1, true); // format
    view.setUint16(22, options.numChannels, true);
    view.setUint32(24, options.sampleRate, true);
    view.setUint32(28, options.sampleRate * options.numChannels * type.BYTES_PER_ELEMENT, true); // byte rate
    view.setUint16(32, options.numChannels * type.BYTES_PER_ELEMENT, true); // block align
    view.setUint16(34, type.BYTES_PER_ELEMENT * 8, true); // bits per sample
    view.setUint32(36, 1684108385, false); // "data"
    view.setUint32(40, buffer.byteLength, true);

    wavBytes.set(new Uint8Array(buffer), headerBytes);
    return wavBytes;
  }

  const renderGrid = (type: 'kick' | 'snare' | 'hihat', steps: boolean[]) => {
    const activeClassMap = {
      kick: 'bg-kick-active ring-kick-active',
      snare: 'bg-snare-active ring-snare-active',
      hihat: 'bg-hihat-active ring-hihat-active'
    };
    const activeColor = activeClassMap[type];

    return (
      <div className="step-grid">
        {steps.map((isActive, i) => {
          const isDownbeat = i % 4 === 0;
          const isAltGroup = Math.floor(i / 4) % 2 === 1;
          const isPlayhead = i === currentStep;

          return (
            <button
              key={i}
              onClick={() => toggleStep(type, i)}
              className={twMerge(
                clsx(
                  'step-pad rounded-sm ring-1 ring-slate-300 dark:ring-white/10 transition-colors',
                  isActive ? activeColor : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700',
                  isAltGroup && 'beat-group-alt',
                  isDownbeat && 'downbeat',
                  isPlayhead && 'playhead-active'
                )
              )}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-4 bg-white dark:bg-transparent transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center overflow-hidden">
            <Music className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            MabiBeat <span className="text-slate-500 font-light">Studio</span>
          </h1>
        </div>

        {/* Transport Controls */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-6 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors w-full xl:w-auto justify-center">

          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={clsx(
                "p-3 rounded-full transition-colors",
                isPlaying ? "bg-green-600 hover:bg-green-500 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
              )}
              title={isPlaying ? "Pause" : "Play"}
            >
              <Play className="h-5 w-5 fill-current" />
            </button>
            <button
              onClick={stop}
              className="p-3 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-full transition-colors"
              title="Stop"
            >
              <Square className="h-5 w-5 fill-current" />
            </button>
            <button
              onClick={clearSteps}
              className="px-4 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 text-slate-700 dark:text-slate-300 rounded-full transition-all flex items-center gap-2 font-bold uppercase text-[10px]"
              title="Clear All Steps"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>

          <div className="flex flex-col border-l border-slate-300 dark:border-slate-800 pl-4 lg:pl-6">
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Tempo</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-16 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-md text-xl font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 p-1 text-center text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-500">BPM</span>
            </div>
          </div>

          <div className="flex flex-col w-24 md:w-32 border-l border-slate-300 dark:border-slate-800 pl-4 lg:pl-6">
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Master Vol</label>
            <div className="flex items-center gap-2 h-8">
              <VolumeX className="w-4 h-4 text-slate-500" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full"
              />
              <Volume2 className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-800 pl-4 lg:pl-6">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              title="Export .WAV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xl:inline">Export .WAV</span>
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-300"
              title="Toggle Theme"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sequencer Workspace */}
      <main className="flex-grow p-4 md:p-8 overflow-hidden flex flex-col bg-slate-50 dark:bg-dark-bg transition-colors">
        <div className="max-w-7xl mx-auto w-full space-y-8">
          <div className="space-y-6">

            {/* Kick Track */}
            <section className="grid grid-cols-1 lg:grid-cols-[48px_1fr] items-center gap-4">
              <div className="flex items-center justify-between lg:justify-end pr-4">
                <span className="font-bold text-sm tracking-widest text-kick-active">K</span>
              </div>
              <div className="sequencer-scroll overflow-x-auto pb-2">
                {renderGrid('kick', kickSteps)}
              </div>
            </section>

            {/* Snare Track */}
            <section className="grid grid-cols-1 lg:grid-cols-[48px_1fr] items-center gap-4">
              <div className="flex items-center justify-between lg:justify-end pr-4">
                <span className="font-bold text-sm tracking-widest text-snare-active">S</span>
              </div>
              <div className="sequencer-scroll overflow-x-auto pb-2">
                {renderGrid('snare', snareSteps)}
              </div>
            </section>

            {/* Hi-Hat Track */}
            <section className="grid grid-cols-1 lg:grid-cols-[48px_1fr] items-center gap-4">
              <div className="flex items-center justify-between lg:justify-end pr-4">
                <span className="font-bold text-sm tracking-widest text-hihat-active">H</span>
              </div>
              <div className="sequencer-scroll overflow-x-auto pb-2">
                {renderGrid('hihat', hihatSteps)}
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 text-xs flex justify-between items-center transition-colors">
        <div className="flex gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Audio Engine Ready
          </span>
          <span className="hidden md:inline">Sample Rate: {Tone.context.sampleRate}Hz</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
