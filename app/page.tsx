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
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7c6bf5]/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#7c6bf5]" />
          </div>
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-white/90">Face Aging AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[pulse-soft_3s_ease-in-out_infinite]" />
          <span className="text-[11px] text-white/35">Online</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center w-full px-6">
        <div className="w-full max-w-[540px] pt-20 pb-16">

          {/* Hero */}
          <div className="text-center mb-14">
            <h1 className="text-[42px] font-bold tracking-[-0.035em] leading-[1.05] text-white mb-3">
              Face Aging
            </h1>
            <p className="text-[15px] leading-relaxed text-white/40">
              Symulacja starzenia twarzy oparta na AI
            </p>
          </div>

          {/* Upload */}
          <div className="mb-8">
            <label className="block text-[13px] font-medium text-white/50 mb-3 pl-0.5">Zdjęcie</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`
                group relative flex flex-col items-center justify-center gap-4 rounded-xl
                min-h-[220px] py-14 px-6 cursor-pointer transition-all duration-200
                ${file
                  ? 'border border-emerald-500/25 bg-emerald-500/[0.04]'
                  : dragOver
                    ? 'border border-[#7c6bf5]/40 bg-[#7c6bf5]/[0.04]'
                    : 'border border-white/[0.08] hover:border-white/[0.14] hover:bg-white/[0.02]'
                }
              `}
            >
              <div className={`
                w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200
                ${file
                  ? 'bg-emerald-500/10'
                  : 'bg-white/[0.04] group-hover:bg-white/[0.07] border border-white/[0.06] group-hover:border-white/[0.1]'
                }
              `}>
                <Upload className={`w-6 h-6 transition-colors duration-200 ${file ? 'text-emerald-400' : 'text-white/25 group-hover:text-white/40'}`} />
              </div>
              <div className="text-center space-y-1.5">
                <p className={`text-[14px] font-medium ${file ? 'text-emerald-400' : 'text-white/60'}`}>
                  {file ? fileName : 'Przeciągnij zdjęcie lub kliknij'}
                </p>
                <p className="text-[12px] text-white/25">JPG, PNG, WebP &middot; do 20 MB</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onFileChange} />
          </div>

          {/* Age */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 pl-0.5 pr-0.5">
              <label className="text-[13px] font-medium text-white/50">Wiek</label>
              <span className="text-[14px] font-semibold text-[#7c6bf5] tabular-nums">+{age} lat</span>
            </div>
            <div className="px-0.5">
              <Slider
                min={1}
                max={50}
                value={age}
                onChange={(e) => setAge(Number((e.target as HTMLInputElement).value))}
              />
            </div>
            <div className="flex justify-between text-[11px] text-white/20 mt-2.5 px-0.5">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* CTA */}
          <Button size="full" disabled={!file || loading} onClick={process}>
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Przetwarzanie...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Postarzej twarz</>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/15 bg-red-500/[0.05] px-4 py-3 text-[13px] text-red-400">
              {error}
            </div>
          )}

          {/* Results */}
          {originalSrc && (
            <div className="grid grid-cols-2 gap-3 mt-8">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Oryginał</span>
                </div>
                <div className="px-3 pb-3">
                  <img src={originalSrc} alt="Original" className="w-full rounded-lg object-contain max-h-[360px]" />
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Wynik</span>
                  {resultSrc && (
                    <a href={resultSrc} download="aged_face.png" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7c6bf5] hover:text-[#9b8af8] transition-colors">
                      <Download className="w-3 h-3" /> Pobierz
                    </a>
                  )}
                </div>
                <div className="px-3 pb-3">
                  <div className="relative min-h-[180px] flex items-center justify-center rounded-lg bg-white/[0.01]">
                    {loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#09090f]/92 rounded-lg z-10">
                        <Loader2 className="w-7 h-7 text-[#7c6bf5] animate-spin" />
                        <div className="w-full max-w-[160px] space-y-2">
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
                      <img src={resultSrc} alt="Aged" className="w-full rounded-lg object-contain max-h-[360px]" />
                    ) : !loading ? (
                      <span className="text-[12px] text-white/15">Wynik pojawi się tutaj</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="my-12 h-px bg-white/[0.06]" />

          {/* Features */}
          <div className="grid grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
            {[
              { icon: Zap, title: 'AI-Powered', desc: 'GPT Image model' },
              { icon: Shield, title: 'Bezpieczne', desc: 'Przetwarzanie na serwerze' },
              { icon: ImageIcon, title: 'HD', desc: 'Rozdzielczość 1024px' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#09090f] flex flex-col items-center gap-2.5 py-6 px-4 text-center">
                <Icon className="w-4 h-4 text-white/20" />
                <p className="text-[13px] font-medium text-white/70">{title}</p>
                <p className="text-[11px] text-white/25 leading-snug">{desc}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-white/15 mt-10">
            Powered by OpenAI
          </p>
        </div>
      </main>
    </div>
  );
}
