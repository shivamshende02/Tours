// pages/_app.tsx
import type { AppProps } from "next/app"
import { Work_Sans, Open_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { ThemeProvider } from "D:\\Tours\\group-tours-frontend\\components\\theme-provider"
import { Suspense } from "react"
import "../styles/globals.css"

// ✅ Load Google Fonts instead of Geist
const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
})

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Suspense fallback={null}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <main
          className={`font-sans ${workSans.variable} ${openSans.variable} antialiased`}
        >
          <Component {...pageProps} />
          <Analytics />
        </main>
      </ThemeProvider>
    </Suspense>
  )
}
