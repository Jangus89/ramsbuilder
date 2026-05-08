export const metadata = {
  title: 'SafeFlow RAMS Builder',
  description: 'Generate RAMS documents from site photos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
