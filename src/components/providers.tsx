"use client";

import { ThemeProvider } from "next-themes";

import { EvenlyProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme="dark"
    >
      <EvenlyProvider>
        {children}
        <Toaster position="top-center" richColors />
      </EvenlyProvider>
    </ThemeProvider>
  );
}
