'use client';

import { useState, useRef, useEffect, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { Upload, Clock, Sparkles, Download, Loader2, Camera, Zap, Shield, Image } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Slider } from '@/app/components/ui/slider';

const STAGES = [
  { threshold: 0, label: 'Analizuję twarz...' },
  { threshold: 30, label: 'Nakładam efekt starzenia...' },
  { threshold: 70, label: 'Finalizuję obraz...' },
];

function getStageLabel(percent: number): string {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (percent >= STAGES[i].threshold) return STAGES[i].label;
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
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    setProgress(0);
    stopProgress();
    const start = Date.now();
    const duration = 15000;
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / duration) * 90, 92);
      setProgress(p);
      if (p >= 92) stopProgress();
    }, 100);
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

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(''), 8000);
  }

  async function process() {
    if (!file) return;
    setLoading(true);
    setResultSrc('');
    setError('');
    startProgress();

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('years', String(age));

      const res = await fetch('/api/age-face', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Error: ${res.status}`);

      stopProgress();
      setProgress(100);

      if (data.b64) setResultSrc(`data:image/png;base64,${data.b64}`);
      else if (data.url) setResultSrc(data.url);
    } catch (err) {
      stopProgress();
      setProgress(0);
      showError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const pct = Math.round(progress);

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between h-16 px-8 border-b border-[rgba(99,102,241,0.1)] bg-[#0f0f1a]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Face Aging AI</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
          <span className="w-2 h-2 rounded-full bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-[float_3s_ease-in-out_infinite]" />
          Online
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center w-full px-6 pt-14 pb-20">
        <div className="w-full max-w-3xl">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-[#818cf8] via-[#a78bfa] to-[#c084fc] bg-clip-text text-transparent leading-tight pb-2">
              Face Aging
            </h1>
            <p className="text-base text-[#9ca3af] mx-auto leading-relaxed text-center">
              Przekształć swój wygląd dzięki symulacji starzenia opartej na AI
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {/* Upload */}
            <Card className="p-7">
              <CardHeader className="px-0 pt-1 pb-5">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#818cf8]" />
                  Wgraj zdjęcie
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div
                  className={`
                    relative flex flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed min-h-52 py-14 px-8 cursor-pointer transition-all duration-300
                    ${file
                      ? 'border-[#4ade80]/40 bg-[#4ade80]/[0.03]'
                      : dragOver
                        ? 'border-[#6366f1]/50 bg-[#6366f1]/[0.04]'
                        : 'border-[rgba(99,102,241,0.2)] hover:border-[rgba(99,102,241,0.4)] hover:bg-[rgba(99,102,241,0.03)]'
                    }
                  `}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <div className={`rounded-2xl p-5 ${file ? 'bg-[#4ade80]/10' : 'bg-[#252545]'}`}>
                    <Camera className={`w-10 h-10 ${file ? 'text-[#4ade80]' : 'text-[#818cf8]'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-[#d1d5db]">
                      {file ? fileName : 'Przeciągnij zdjęcie tutaj lub kliknij'}
                    </p>
                    <p className="text-sm text-[#6b7280] mt-2">JPG, PNG, WebP &bull; maks. 20 MB</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={onFileChange}
                />
              </CardContent>
            </Card>

            {/* Age Config */}
            <Card className="p-7">
              <CardHeader className="px-0 pt-1 pb-5">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#818cf8]" />
                  Ustawienia wieku
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="flex items-center gap-6 py-2">
                  <label className="text-base text-[#d1d5db] shrink-0 font-medium">O ile lat postarzeć?</label>
                  <div className="flex-1 px-3">
                    <Slider
                      min={1}
                      max={50}
                      value={age}
                      onChange={(e) => setAge(Number((e.target as HTMLInputElement).value))}
                    />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent tabular-nums min-w-[75px] text-right mr-1">
                    +{age} lat
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Execute */}
            <Button
              size="full"
              disabled={!file || loading}
              onClick={process}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Postarzej twarz
                </>
              )}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-5">
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#1e1e34] border border-[rgba(99,102,241,0.18)] py-8 px-7 text-center transition-all duration-300 hover:border-[rgba(99,102,241,0.35)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.1)]">
                <div className="rounded-xl bg-[#6366f1]/15 p-3">
                  <Zap className="w-6 h-6 text-[#818cf8]" />
                </div>
                <p className="text-base font-semibold text-[#e2e8f0]">AI-Powered</p>
                <p className="text-sm text-[#9ca3af] leading-relaxed">Model GPT Image do realistycznych wyników</p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#1e1e34] border border-[rgba(99,102,241,0.18)] py-8 px-7 text-center transition-all duration-300 hover:border-[rgba(99,102,241,0.35)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.1)]">
                <div className="rounded-xl bg-[#6366f1]/15 p-3">
                  <Shield className="w-6 h-6 text-[#818cf8]" />
                </div>
                <p className="text-base font-semibold text-[#e2e8f0]">Bezpieczeństwo</p>
                <p className="text-sm text-[#9ca3af] leading-relaxed">Zdjęcia przetwarzane bezpiecznie na serwerze</p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#1e1e34] border border-[rgba(99,102,241,0.18)] py-8 px-7 text-center transition-all duration-300 hover:border-[rgba(99,102,241,0.35)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.1)]">
                <div className="rounded-xl bg-[#6366f1]/15 p-3">
                  <Image className="w-6 h-6 text-[#818cf8]" />
                </div>
                <p className="text-base font-semibold text-[#e2e8f0]">Wysoka jakość</p>
                <p className="text-sm text-[#9ca3af] leading-relaxed">Rozdzielczość wyjściowa 1024x1024</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-[#f87171]/20 bg-[#f87171]/[0.06] px-5 py-4 text-base text-[#f87171] font-medium">
                {error}
              </div>
            )}

            {/* Results */}
            {originalSrc && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-2">
                <Card className="p-6">
                  <CardHeader className="px-0 pt-1 pb-5">
                    <CardTitle>Oryginał</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <img
                      src={originalSrc}
                      alt="Original"
                      className="w-full rounded-xl object-contain max-h-[450px]"
                    />
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardHeader className="flex flex-row items-center justify-between px-0 pt-1 pb-5">
                    <CardTitle>Wynik</CardTitle>
                    {resultSrc && (
                      <a
                        href={resultSrc}
                        download="aged_face.png"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Pobierz
                      </a>
                    )}
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="relative min-h-[240px] flex items-center justify-center">
                      {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#1a1a2e]/95 rounded-xl z-10">
                          <Loader2 className="w-10 h-10 text-[#818cf8] animate-spin" />
                          <div className="w-full max-w-[240px] flex flex-col gap-3">
                            <div className="h-1.5 w-full rounded-full bg-[#0f0f1a] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full transition-[width] duration-300 relative"
                                style={{ width: `${pct}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
                              </div>
                            </div>
                            <p className="text-sm text-[#a5b4fc] text-center font-medium">{getStageLabel(pct)}</p>
                            <p className="text-sm text-[#6b7280] text-center tabular-nums">{pct}%</p>
                          </div>
                        </div>
                      )}
                      {resultSrc ? (
                        <img
                          src={resultSrc}
                          alt="Aged result"
                          className="w-full rounded-xl object-contain max-h-[450px]"
                        />
                      ) : !loading ? (
                        <p className="text-base text-[#6b7280]">Wynik pojawi się tutaj</p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
