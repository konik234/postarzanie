import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'twój_klucz') {
    return NextResponse.json(
      { error: 'Brak skonfigurowanego klucza OpenAI API. Ustaw OPENAI_API_KEY w .env.local' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const years = formData.get('years') as string | null;

    if (!image) {
      return NextResponse.json({ error: 'Brak zdjęcia' }, { status: 400 });
    }
    if (!years) {
      return NextResponse.json({ error: 'Brak parametru wieku' }, { status: 400 });
    }

    const openaiForm = new FormData();
    openaiForm.append('model', 'gpt-image-1');
    openaiForm.append('image[]', image);
    openaiForm.append(
      'prompt',
      `Age this person's face by ${years} years. Keep everything else identical - same lighting, background, clothing, expression. The result should look natural and realistic.`
    );
    openaiForm.append('size', '1024x1024');
    openaiForm.append('quality', 'high');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openaiForm,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const message = err.error?.message || `OpenAI API error: ${response.status}`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;

    return NextResponse.json({ b64, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nieznany błąd serwera';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
