import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { AlertDialogProvider } from "@/components/ui/alert-dialog"

export const metadata: Metadata = {
  title: "Indomaret Inventory System",
  description: "Indomaret Asset & Loan Management System - Internal Application",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AlertDialogProvider>
          <AuthProvider>{children}</AuthProvider>
        </AlertDialogProvider>
      </body>
    </html>
  )
}
