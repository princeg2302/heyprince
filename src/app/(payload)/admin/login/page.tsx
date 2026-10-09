import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/admin-db';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Admin Login — HeyPrince Executive Portal',
  description: 'Sign in to access the HeyPrince administration command center.',
};

export default async function LoginPage() {
  const user = await getCurrentAdmin();
  if (user) {
    redirect('/admin');
  }

  return (
    <main
      className="ad-login-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 51, 102, 0.08) 0%, #07070a 70%)',
        fontFamily: 'var(--ad-font)',
      }}
    >
      <LoginForm />
    </main>
  );
}
