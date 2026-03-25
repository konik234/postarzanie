'use client';

import { useState, useRef, useEffect, useCallback, DragEvent, ChangeEvent } from 'react';

const STAGES = [
  { threshold: 0, label: 'analyzing_face...' },
  { threshold: 30, label: 'applying_aging_effect...' },
  { threshold: 70, label: 'finalizing_output...' },
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
        throw new Error(data.error || `server_error: ${res.status}`);
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
      showError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setLoading(false);
    }
  }

  const roundedProgress = Math.round(progress);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <svg className="nav-logo" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="7.5" cy="8.5" r="1" fill="currentColor" />
            <circle cx="12.5" cy="8.5" r="1" fill="currentColor" />
            <path d="M7 13 Q10 15.5 13 13" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="14" y1="4" x2="18" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="nav-title">Face Aging AI</span>
        </div>
        <ul className="nav-links">
          <li><a href="#">upload</a></li>
          <li><a href="#">process</a></li>
          <li><a href="#">export</a></li>
        </ul>
        <div className="nav-status">
          <span className="status-dot" />
          system_online
        </div>
      </nav>

      {/* Main content */}
      <main className="main">
        <div className="section-header">
          <h1><span className="prompt">&gt;</span> Face Aging Terminal</h1>
          <p className="tagline">Transform your appearance through time<span className="cursor" /></p>
        </div>

        {/* Upload card */}
        <div className="card">
          <div className="card-header">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M3.5 5.5L7 1l3.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1.5 10v1.5a1 1 0 001 1h9a1 1 0 001-1V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            input_source
          </div>
          <div className="card-body">
            <div
              className={`drop-zone${file ? ' has-file' : ''}${dragOver ? ' drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="drop-zone-icon">&#9633;</div>
              <p>drop_file_here || click_to_select</p>
              <p className="hint">formats: jpg, png, webp // max: 20mb</p>
              {fileName && <p className="file-name">&gt; {fileName}</p>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={onFileChange}
            />
          </div>
        </div>

        {/* Config card */}
        <div className="card">
          <div className="card-header">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            age_config
          </div>
          <div className="card-body">
            <div className="slider-row">
              <label>years_offset:</label>
              <input
                type="range"
                min={1}
                max={50}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
              <span className="age-value">+{age}y</span>
            </div>
          </div>
        </div>

        {/* Execute button */}
        <button
          className="btn"
          disabled={!file || loading}
          onClick={process}
        >
          {loading ? '[ processing... ]' : '[ execute_aging ]'}
        </button>

        {error && <div className="error-msg">{error}</div>}

        {/* Results */}
        {originalSrc && (
          <div className="results-section">
            <div className="results">
              <div className="result-card">
                <h3><span className="tag">[src]</span> original_input</h3>
                <div className="img-wrap">
                  <img src={originalSrc} alt="Original" />
                </div>
              </div>
              <div className="result-card">
                <h3><span className="tag">[out]</span> processed_output</h3>
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
                  {resultSrc && <img src={resultSrc} alt="Aged result" />}
                </div>
                {resultSrc && (
                  <a className="download-btn" href={resultSrc} download="aged_face.png">
                    &gt; save_output
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
