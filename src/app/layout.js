import './globals.css';

export const metadata = {
  title: 'Guild Portal',
  description: 'Portal login dan dashboard guild',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}