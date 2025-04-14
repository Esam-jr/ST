import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { ThemeProvider as NextThemesProvider } from "@/components/ui/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import RoleSelectionChecker from '@/components/auth/RoleSelectionChecker'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <RoleSelectionChecker>
          <Component {...pageProps} />
          <Toaster />
        </RoleSelectionChecker>
      </NextThemesProvider>
    </SessionProvider>
  )
}
