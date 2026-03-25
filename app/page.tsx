'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [originalSrc, setOriginalSrc] = useState('');
  const [resultSrc, setResultSrc] = useState('');
  const [age, setAge] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        throw new Error(data.error || `Błąd serwera: ${res.status}`);
      }

      if (data.b64) {
        setResultSrc(`data:image/png;base64,${data.b64}`);
      } else if (data.url) {
        setResultSrc(data.url);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>Face Aging AI</h1>
      <p className="subtitle">Postarzanie twarzy z wykorzystaniem OpenAI GPT Image API</p>

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
          {loading ? 'Przetwarzanie...' : 'Postarzej twarz'}
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
                  <div className="spinner-overlay">
                    <div className="spinner" />
                    <span className="spinner-text">Generowanie... moze to zajac do 60s</span>
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
