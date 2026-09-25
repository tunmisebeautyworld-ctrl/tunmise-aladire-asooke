import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tunmise Aladire Asooke | Modern African Fashion',
  description:
    'Elevating Tradition. Embracing Modernity. Shop authentic Asooke and Adire clothing crafted with contemporary elegance.',
  keywords: 'Asooke, Adire, Nigerian fashion, African clothing, tie-dye, Tunmise Aladire',
  openGraph: {
    title: 'Tunmise Aladire Asooke',
    description: 'Modern African fashion house. Elevating Tradition. Embracing Modernity.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-brand-cream min-h-screen`}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e1b4b',
                color: '#fefce8',
                border: '1px solid #d97706',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
