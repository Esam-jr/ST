import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { ThemeProvider as NextThemesProvider } from "@/components/ui/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import RoleSelectionChecker from '@/components/auth/RoleSelectionChecker'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient()

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  )
} 