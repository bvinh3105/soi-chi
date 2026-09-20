import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F1EB' },
    { media: '(prefers-color-scheme: dark)', color: '#2D2D2D' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Sợi chỉ — Thêu tay thủ công',
    template: '%s | Sợi chỉ',
  },
  description: 'Thêu tay thủ công lên tranh, quần áo, túi — hoặc tự tay thêu với bộ kit DIY của Sợi chỉ',
  keywords: ['thêu tay', 'handmade', 'thêu thủ công', 'tranh thêu', 'kit DIY', 'miên man'],
  authors: [{ name: 'Sợi chỉ' }],
  creator: 'Sợi chỉ',
  metadataBase: new URL('https://soi-chi.pages.dev'),
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Sợi chỉ',
    title: 'Sợi chỉ — Thêu tay thủ công',
    description: 'Mỗi mũi thêu, một câu chuyện riêng. Thêu tay thủ công lên tranh, quần áo và túi.',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sợi chỉ',
  },
  formatDetection: {
    telephone: true,
    email: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-white text-dark font-sans">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
