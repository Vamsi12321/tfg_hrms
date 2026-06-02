import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "TFG HRMS - AI-Powered Human Resource Management",
  description: "Next-generation HRMS with AI insights, smart attendance, OKR tracking, and employee wellness monitoring.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-surface-100 text-slate-800 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
