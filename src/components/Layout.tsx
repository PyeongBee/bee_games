import Sidebar from './Sidebar';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar />
      <main className='flex-1 ml-20 p-6'>{children}</main>
    </div>
  );
}
