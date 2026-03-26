'use client';

import { useState, useRef, useEffect, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { Upload, Clock, Sparkles, Download, Loader2, Zap, Shield, ImageIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
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
      <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 border-b border-border bg-[#09090f]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </div>
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-white/90">Face Aging AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[pulse-soft_3s_ease-in-out_infinite]" />
          <span className="text-[11px] text-muted">Online</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center w-full px-6">
        <div className="w-full max-w-[580px] pt-16 pb-24">

          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-[40px] font-bold tracking-[-0.03em] leading-[1.1] text-white mb-3">
              Face Aging
            </h1>
            <p className="text-[15px] leading-relaxed text-muted">
              Symulacja starzenia twarzy oparta na AI
            </p>
          </div>

          {/* Upload */}
          <div className="space-y-3 mb-6">
            <label className="text-[13px] font-medium text-subtle pl-0.5">Zdjęcie</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`
                group relative flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed
                min-h-[200px] py-12 px-6 cursor-pointer transition-all duration-200
                ${file
                  ? 'border-success/30 bg-success/[0.02]'
                  : dragOver
                    ? 'border-accent/40 bg-accent/[0.03]'
                    : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
                }
              `}
            >
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200
                ${file ? 'bg-success/10' : 'bg-white/[0.04] group-hover:bg-white/[0.06]'}
              `}>
                <Upload className={`w-5 h-5 ${file ? 'text-success' : 'text-muted group-hover:text-subtle'}`} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${file ? 'text-success' : 'text-subtle'}`}>
                  {file ? fileName : 'Przeciągnij zdjęcie lub kliknij'}
                </p>
                <p className="text-xs text-muted mt-1">JPG, PNG, WebP &middot; do 20 MB</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onFileChange} />
          </div>

          {/* Age */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between pl-0.5">
              <label className="text-[13px] font-medium text-subtle">Wiek</label>
              <span className="text-[13px] font-semibold text-accent tabular-nums">+{age} lat</span>
            </div>
            <div className="px-1">
              <Slider
                min={1}
                max={50}
                value={age}
                onChange={(e) => setAge(Number((e.target as HTMLInputElement).value))}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted px-1">
              <span>+1</span>
              <span>+25</span>
              <span>+50</span>
            </div>
          </div>

          {/* CTA */}
          <Button size="full" disabled={!file || loading} onClick={process} className="mb-10">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Przetwarzanie...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Postarzej twarz</>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-error/20 bg-error/[0.05] px-4 py-3 text-sm text-error mb-6">
              {error}
            </div>
          )}

          {/* Results */}
          {originalSrc && (
            <div className="grid grid-cols-2 gap-4 mb-10">
              <Card>
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-3">Oryginał</p>
                  <img src={originalSrc} alt="Original" className="w-full rounded-lg object-contain max-h-[380px] bg-black/20" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Wynik</p>
                    {resultSrc && (
                      <a href={resultSrc} download="aged_face.png" className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-hover transition-colors">
                        <Download className="w-3 h-3" />
                        Pobierz
                      </a>
                    )}
                  </div>
                  <div className="relative min-h-[200px] flex items-center justify-center rounded-lg bg-black/20">
                    {loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#09090f]/90 rounded-lg z-10">
                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                        <div className="w-full max-w-[180px] space-y-2">
                          <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-[width] duration-200 relative" style={{ width: `${pct}%` }}>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
                            </div>
                          </div>
                          <p className="text-[11px] text-accent text-center font-medium">{getStageLabel(pct)}</p>
                          <p className="text-[11px] text-muted text-center tabular-nums">{pct}%</p>
                        </div>
                      </div>
                    )}
                    {resultSrc ? (
                      <img src={resultSrc} alt="Aged" className="w-full rounded-lg object-contain max-h-[380px]" />
                    ) : !loading ? (
                      <span className="text-xs text-muted">Wynik pojawi się tutaj</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Zap, title: 'AI-Powered', desc: 'Model GPT Image' },
              { icon: Shield, title: 'Bezpieczne', desc: 'Serwer przetwarza dane' },
              { icon: ImageIcon, title: '1024px', desc: 'Wysoka rozdzielczość' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface py-5 px-3 text-center transition-colors hover:border-border-hover hover:bg-surface-hover">
                <Icon className="w-4 h-4 text-accent/70" />
                <p className="text-[13px] font-medium text-white/80">{title}</p>
                <p className="text-[11px] text-muted leading-snug">{desc}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-6 border-t border-border text-center">
            <p className="text-[11px] text-muted">
              Powered by OpenAI &middot; Face Aging AI
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
