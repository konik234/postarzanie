import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Face Aging AI - Postarzanie Twarzy',
  description: 'Postarzanie twarzy z wykorzystaniem OpenAI GPT Image API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
