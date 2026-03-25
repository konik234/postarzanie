'use client';

import { useState, useRef, useEffect, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { Upload, Clock, Sparkles, Download, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Slider } from '@/app/components/ui/slider';

const STAGES = [
  { threshold: 0, label: 'Analyzing face structure...' },
  { threshold: 30, label: 'Applying aging transformation...' },
  { threshold: 70, label: 'Finalizing output...' },
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
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between h-14 px-6 border-b border-border bg-[oklch(0.09_0.01_260)]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold tracking-tight">Face Aging AI</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Ready
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[880px] mx-auto px-5 pt-10 pb-16">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight mb-1.5">
            Face Aging
          </h1>
          <p className="text-sm text-muted">
            Transform your appearance through time using AI-powered aging simulation.
          </p>
        </div>

        <div className="grid gap-4">
          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-accent" />
                Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`
                  relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 cursor-pointer transition-all
                  ${file
                    ? 'border-success/40 bg-success/[0.02]'
                    : dragOver
                      ? 'border-accent/40 bg-accent/[0.02]'
                      : 'border-border hover:border-border-hover hover:bg-surface-hover'
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <div className={`rounded-full p-3 ${file ? 'bg-success/10' : 'bg-surface-hover'}`}>
                  <Upload className={`w-5 h-5 ${file ? 'text-success' : 'text-muted'}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-[oklch(0.75_0.01_260)]">
                    {file ? fileName : 'Drop your image here or click to browse'}
                  </p>
                  <p className="text-xs text-muted mt-1">JPG, PNG, WebP up to 20MB</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-accent" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <label className="text-sm text-[oklch(0.65_0.01_260)] shrink-0">Age offset</label>
                <Slider
                  min={1}
                  max={50}
                  value={age}
                  onChange={(e) => setAge(Number((e.target as HTMLInputElement).value))}
                />
                <span className="text-sm font-semibold text-accent tabular-nums min-w-[52px] text-right">
                  +{age} yrs
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
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate aged face
              </>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-error/20 bg-error/[0.05] px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* Results */}
          {originalSrc && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle>Original</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={originalSrc}
                    alt="Original"
                    className="w-full rounded-lg object-contain max-h-[420px]"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Result</CardTitle>
                  {resultSrc && (
                    <a
                      href={resultSrc}
                      download="aged_face.png"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors -mt-1"
                    >
                      <Download className="w-3 h-3" />
                      Save
                    </a>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="relative min-h-[200px] flex items-center justify-center">
                    {loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface/90 rounded-lg z-10">
                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                        <div className="w-full max-w-[200px] flex flex-col gap-2">
                          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-[width] duration-300 relative"
                              style={{ width: `${pct}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
                            </div>
                          </div>
                          <p className="text-xs text-accent text-center">{getStageLabel(pct)}</p>
                          <p className="text-xs text-muted text-center tabular-nums">{pct}%</p>
                        </div>
                      </div>
                    )}
                    {resultSrc ? (
                      <img
                        src={resultSrc}
                        alt="Aged result"
                        className="w-full rounded-lg object-contain max-h-[420px]"
                      />
                    ) : !loading ? (
                      <p className="text-xs text-muted">Output will appear here</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
