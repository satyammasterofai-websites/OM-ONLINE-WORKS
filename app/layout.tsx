import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'OM ONLINE WORKS | Best Jan Seva Kendra & Cyber Cafe in Saharanpur',
  description: 'Trusted Jan Seva Kendra, CSC Center & Cyber Cafe in Saharanpur. Fast income, caste, and residence certificates, Aadhaar assistance, passport applications, ITR, PF, online form filling, and banking.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} scroll-smooth`}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900 transition-colors duration-300" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
