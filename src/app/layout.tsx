import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Footer from "@/components/Footer";

const assistantFont = Poppins({
  weight:['400','500','600','700'],
})

export const metadata: Metadata = {
  title: "CloudSAF",
  description: "A Simple AF Cloud Storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${assistantFont.className} antialiased`}
      >
        <AuthProvider>
           {children}
           <Footer/>
        </AuthProvider>
      </body>
    </html>
  );
}
