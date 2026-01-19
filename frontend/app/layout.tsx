import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'

export const metadata = {
  title: 'IPETRO AI-Powered RBI Planner',
  description: 'Next.js frontend with Flask backend',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}