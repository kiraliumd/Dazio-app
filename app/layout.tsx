import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dazio - Gestão de Locações",
  description: "Sistema completo de gestão para locação de equipamentos. Controle de orçamentos, locações, clientes e equipamentos em uma plataforma integrada.",
  keywords: ["locação", "equipamentos", "gestão", "ERP", "orçamentos", "clientes", "controle"],
  robots: "index, follow",
  icons: {
    icon: '/favicon-dazio.png',
    shortcut: '/favicon-dazio.png',
    apple: '/favicon-dazio.png',
  },
  openGraph: {
    title: "Dazio - Gestão de Locações",
    description: "Sistema completo de gestão para locação de equipamentos",
    type: "website",
    locale: "pt_BR",
    siteName: "Dazio - Gestão de Locações",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dazio - Gestão de Locações",
    description: "Sistema completo de gestão para locação de equipamentos",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}