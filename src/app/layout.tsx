import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import '@/styles/markdown.css';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MystraIntellect - AI-Powered Developer Assistant",
  description: "Get expert coding help and software development advice with MystraIntellect, an AI-powered assistant for programmers.",
  keywords: "AI, developer assistant, coding help, programming, software development",
  openGraph: {
    title: "MystraIntellect - AI-Powered Developer Assistant",
    description: "Expert coding help and software development advice with AI",
    images: [{ url: "/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MystraIntellect - AI-Powered Developer Assistant",
    description: "Expert coding help and software development advice with AI",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
};

<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "MystraIntellect",
    "applicationCategory": "DeveloperApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "operatingSystem": "Web",
    "description": "AI-powered developer assistant for coding help and software development advice"
  })}
</script>
