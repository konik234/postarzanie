'use client';

import { useState, useRef, useEffect, useCallback, DragEvent, ChangeEvent } from 'react';

const STAGES = [
  { threshold: 0, label: 'Analizuje twarz...' },
  { threshold: 30, label: 'Nakladam efekt starzenia...' },
  { threshold: 70, label: 'Finalizuje obraz...' },
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
      const raw = (elapsed / duration) * 90;
      const p = Math.min(raw, 92);
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

      const res = await fetch('/api/age-face', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Blad serwera: ${res.status}`);
      }

      stopProgress();
      setProgress(100);

      if (data.b64) {
        setResultSrc(`data:image/png;base64,${data.b64}`);
      } else if (data.url) {
        setResultSrc(data.url);
      }
    } catch (err) {
      stopProgress();
      setProgress(0);
      showError(err instanceof Error ? err.message : 'Nieznany blad');
    } finally {
      setLoading(false);
    }
  }

  const roundedProgress = Math.round(progress);

  return (
    <>
      <div className="header">
        <svg className="logo" width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="faceGrad" x1="20" y1="16" x2="52" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c7d2fe" />
              <stop offset="100%" stopColor="#a5b4fc" />
            </linearGradient>
          </defs>
          {/* Outer clock ring */}
          <circle cx="36" cy="36" r="33" stroke="url(#logoGrad)" strokeWidth="2.5" opacity="0.3" />
          <circle cx="36" cy="36" r="33" stroke="url(#logoGrad)" strokeWidth="2.5" strokeDasharray="52 156" strokeLinecap="round" />
          {/* Clock ticks */}
          <line x1="36" y1="5" x2="36" y2="9" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
          <line x1="36" y1="63" x2="36" y2="67" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="36" x2="9" y2="36" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
          <line x1="63" y1="36" x2="67" y2="36" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
          {/* Stylized face silhouette */}
          <ellipse cx="36" cy="32" rx="12" ry="14" stroke="url(#faceGrad)" strokeWidth="2" fill="none" />
          {/* Eyes */}
          <circle cx="31" cy="30" r="1.5" fill="url(#faceGrad)" />
          <circle cx="41" cy="30" r="1.5" fill="url(#faceGrad)" />
          {/* Subtle smile */}
          <path d="M32 36 Q36 39 40 36" stroke="url(#faceGrad)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Clock hand - hour */}
          <line x1="36" y1="36" x2="36" y2="22" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Clock hand - minute */}
          <line x1="36" y1="36" x2="46" y2="30" stroke="url(#logoGrad)" strokeWidth="1.8" strokeLinecap="round" />
          {/* Center dot */}
          <circle cx="36" cy="36" r="2" fill="url(#logoGrad)" />
          {/* AI sparkle accents */}
          <path d="M56 14 L57.5 18 L59 14 L57.5 10 Z" fill="url(#logoGrad)" opacity="0.7" />
          <path d="M14 52 L15 54.5 L16 52 L15 49.5 Z" fill="url(#logoGrad)" opacity="0.5" />
          <circle cx="58" cy="54" r="1.5" fill="url(#logoGrad)" opacity="0.4" />
        </svg>
        <h1>Face Aging AI</h1>
        <p className="tagline">Transform your appearance through time</p>
      </div>

      <div className="container">
        <div
          className={`drop-zone${file ? ' has-file' : ''}${dragOver ? ' drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="drop-zone-icon">&#128247;</div>
          <p>Przeciagnij zdjecie tutaj lub kliknij, aby wybrac</p>
          <p className="hint">JPG, PNG, WebP &bull; maks. 20 MB</p>
          {fileName && <p className="file-name">{fileName}</p>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={onFileChange}
        />

        <div className="slider-section">
          <div className="slider-header">
            <label>O ile lat postarzec?</label>
            <span className="age-value">+{age} lat</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </div>

        <button
          className="btn"
          disabled={!file || loading}
          onClick={process}
        >
          <span>{loading ? 'Przetwarzanie...' : 'Postarzej twarz'}</span>
        </button>

        {error && <div className="error-msg">{error}</div>}

        {originalSrc && (
          <div className="results">
            <div className="result-card">
              <h3>Oryginal</h3>
              <div className="img-wrap">
                <img src={originalSrc} alt="Oryginalne zdjecie" />
              </div>
            </div>
            <div className="result-card">
              <h3>Postarzone</h3>
              <div className="img-wrap">
                {loading && (
                  <div className="progress-overlay">
                    <div className="progress-spinner" />
                    <div className="progress-bar-container">
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${roundedProgress}%` }}
                        />
                      </div>
                      <div className="progress-stage">{getStageLabel(roundedProgress)}</div>
                      <div className="progress-percent">{roundedProgress}%</div>
                    </div>
                  </div>
                )}
                {resultSrc && <img src={resultSrc} alt="Postarzone zdjecie" />}
              </div>
              {resultSrc && (
                <a className="download-btn" href={resultSrc} download="aged_face.png">
                  Pobierz wynik
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
