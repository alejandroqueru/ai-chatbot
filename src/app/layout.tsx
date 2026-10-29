import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Alba — Un espacio para hablar del acoso',
  description:
    'Habla sobre el acoso escolar o laboral con Alba, una IA de orientación. Comparte lo que te preocupa, sin juicios y a tu ritmo.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
