import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import "./globals.css";
import { UserProvider } from './contexts/UserContext'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventory management system (IMS)",
  description: "Manage your inventory, shipments, and warehouse operations",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              success: {
                style: {
                  background: '#4CAF50',
                  color: 'white',
                },
              },
              error: {
                style: {
                  background: '#F44336',
                  color: 'white',
                },
              },
            }}
          />
        </UserProvider>
      </body>
    </html>
  )
}
