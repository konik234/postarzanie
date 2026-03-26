'use client';

import { useState, useRef, useEffect, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { Upload, Sparkles, Download, Loader2, Zap, Shield, ImageIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Slider } from '@/app/components/ui/slider';

const STAGES = [
  { threshold: 0, label: 'Analizuję twarz...' },
  { threshold: 30, label: 'Nakładam efekt starzenia...' },
  { threshold: 70, label: 'Finalizuję obraz...' },
];

function getStageLabel(pct: number) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (pct >= STAGES[i].threshold) return STAGES[i].label;
  }
  return STAGES[0].label;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [originalSrc, setOriginalSrc] = useState('');
  const [resultSrc, setResultSrc] = useState('');
  const [age, setAge] = useState(20);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopProgress = useCallback(() => {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  }, []);

  const startProgress = useCallback(() => {
    setProgress(0);
    stopProgress();
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const p = Math.min(((Date.now() - start) / 15000) * 90, 92);
      setProgress(p);
      if (p >= 92) stopProgress();
    }, 80);
  }, [stopProgress]);

  useEffect(() => stopProgress, [stopProgress]);

  function handleFile(f: File) {
    setFile(f);
    setFileName(f.name);
    setResultSrc('');
    const reader = new FileReader();
    reader.onload = (e) => setOriginalSrc(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) handleFile(f);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  }

  async function process() {
    if (!file) return;
    setLoading(true);
    setResultSrc('');
    setError('');
    startProgress();
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('years', String(age));
      const res = await fetch('/api/age-face', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      stopProgress();
      setProgress(100);
      if (data.b64) setResultSrc(`data:image/png;base64,${data.b64}`);
      else if (data.url) setResultSrc(data.url);
    } catch (err) {
      stopProgress();
      setProgress(0);
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
      setTimeout(() => setError(''), 6000);
    } finally {
      setLoading(false);
    }
  }

  const pct = Math.round(progress);

  return (
    <div className="min-h-screen flex items-start justify-center px-6">
      <div className="w-full max-w-xl py-24 flex flex-col gap-6">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#7c6bf5] to-[#4f8cff] bg-clip-text text-transparent">
            Face Aging AI
          </h1>
          <p className="mt-3 text-sm text-white/40">
            Symulacja starzenia twarzy z&nbsp;użyciem sztucznej inteligencji
          </p>
        </div>

        {/* Upload */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`
            group flex flex-col items-center justify-center gap-4 rounded-2xl
            min-h-[200px] py-12 px-6 cursor-pointer transition-all duration-200
            border-2 border-dashed
            ${file
              ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
              : dragOver
                ? 'border-[#7c6bf5]/50 bg-[#7c6bf5]/[0.06]'
                : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }
          `}
        >
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200
            ${file
              ? 'bg-emerald-500/10'
              : 'bg-white/[0.05] group-hover:bg-white/[0.08]'
            }
          `}>
            <Upload className={`w-5 h-5 ${file ? 'text-emerald-400' : 'text-white/30 group-hover:text-white/50'}`} />
          </div>
          <div className="text-center space-y-1">
            <p className={`text-sm font-medium ${file ? 'text-emerald-400' : 'text-white/60'}`}>
              {file ? fileName : 'Przeciągnij zdjęcie lub kliknij'}
            </p>
            <p className="text-xs text-white/25">JPG, PNG, WebP &middot; do 20 MB</p>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onFileChange} />

        {/* Age slider */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-white/50">Wiek</span>
            <span className="text-sm font-semibold text-[#7c6bf5] tabular-nums">+{age} lat</span>
          </div>
          <Slider
            min={1}
            max={50}
            value={age}
            onChange={(e) => setAge(Number((e.target as HTMLInputElement).value))}
          />
          <div className="flex justify-between text-[11px] text-white/20 mt-3">
            <span>1</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>

        {/* Button */}
        <Button size="full" disabled={!file || loading} onClick={process}>
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Przetwarzanie...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Postarzej twarz</>
          )}
        </Button>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/15 bg-red-500/[0.05] px-5 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {originalSrc && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Oryginał</span>
              </div>
              <div className="px-4 pb-4">
                <img src={originalSrc} alt="Original" className="w-full rounded-xl object-contain max-h-[340px]" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Wynik</span>
                {resultSrc && (
                  <a href={resultSrc} download="aged_face.png" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7c6bf5] hover:text-[#9b8af8] transition-colors">
                    <Download className="w-3 h-3" /> Pobierz
                  </a>
                )}
              </div>
              <div className="px-4 pb-4">
                <div className="relative min-h-[140px] flex items-center justify-center rounded-xl bg-white/[0.02]">
                  {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a]/90 rounded-xl z-10">
                      <Loader2 className="w-6 h-6 text-[#7c6bf5] animate-spin" />
                      <div className="w-full max-w-[140px] space-y-2">
                        <div className="h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full bg-[#7c6bf5] rounded-full transition-[width] duration-200 relative" style={{ width: `${pct}%` }}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
                          </div>
                        </div>
                        <p className="text-[11px] text-[#7c6bf5]/80 text-center">{getStageLabel(pct)}</p>
                        <p className="text-[11px] text-white/20 text-center tabular-nums">{pct}%</p>
                      </div>
                    </div>
                  )}
                  {resultSrc ? (
                    <img src={resultSrc} alt="Aged" className="w-full rounded-xl object-contain max-h-[340px]" />
                  ) : !loading ? (
                    <span className="text-xs text-white/15">Wynik pojawi się tutaj</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature cards */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          {[
            { icon: Zap, title: 'AI-Powered', desc: 'Model GPT Image' },
            { icon: Shield, title: 'Bezpieczne', desc: 'Dane usuwane po użyciu' },
            { icon: ImageIcon, title: 'HD Quality', desc: 'Rozdzielczość 1024px' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-center hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200">
              <div className="w-9 h-9 rounded-lg bg-[#7c6bf5]/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#7c6bf5]/70" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/80">{title}</p>
                <p className="text-[11px] text-white/30 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
