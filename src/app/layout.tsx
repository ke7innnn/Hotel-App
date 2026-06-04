import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SHIELD PMS | Autonomous Hotel Management System',
  description: 'A state-of-the-art hotel property management system with real-time dynamic room statuses, tamper-proof audit trails, instant guest payments, and QR code check-in/out integration.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body id="shield-app-root">
        {children}
      </body>
    </html>
  );
}
