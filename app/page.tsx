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
        <div className="badge">
          <span className="badge-dot" />
          Powered by OpenAI
        </div>
        <h1>Face Aging AI</h1>
        <p className="subtitle">Postarzanie twarzy z wykorzystaniem GPT Image API</p>
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
