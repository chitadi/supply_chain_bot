import type { Metadata } from 'next'
import './globals.css'
import localFont from 'next/font/local'
import { Inter } from 'next/font/google'

// Load Proxima Nova font
const proximaNova = localFont({
  src: [
    {
      path: '../public/fonts/ProximaNova-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/ProximaNova-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-proxima-nova',
})

// Load Inter font as a fallback for Proxima Nova
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Supply Chain Management Assistant',
  description: 'AI-powered supply chain management assistant',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* You would need to add Proxima Nova here via a <link> tag if you have the license */}
      </head>
      <body className={`${proximaNova.variable} ${inter.variable} font-proxima-nova font-sans`}>{children}</body>
    </html>
  )
}
