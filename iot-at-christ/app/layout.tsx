import type { Metadata } from 'next'
import { Playfair_Display, Source_Serif_4, Courier_Prime } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const courierPrime = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'IoT at CHRIST',
  description: 'M.Tech CSE IoT academic platform — Christ University Bengaluru',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSerif.variable} ${courierPrime.variable}`}>
      <body>{children}</body>
    </html>
  )
}
