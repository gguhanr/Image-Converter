import { ImageConverterClient } from "@/components/image-converter-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Image as ImageIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-background p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <ImageIcon className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-headline tracking-tight">
            Image Converter
          </h1>
        </div>
        <ThemeToggle />
      </header>
      <main className="w-full flex-1 flex flex-col items-center">
        <ImageConverterClient />
      </main>
      <footer className="w-full max-w-5xl mt-8 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Image Converter. All rights reserved.</p>
      </footer>
    </div>
  );
}
