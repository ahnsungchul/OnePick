'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

interface ExpertDashboardLayoutProps {
  children: React.ReactNode;
}

export default function ExpertDashboardLayout({ children }: ExpertDashboardLayoutProps) {
  const { data: session } = useSession();
  
  const user = session?.user as any;
  const grade = user?.grade || 'HELPER';
  const isApproved = user?.isApproved || false;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)]">
      <main className="w-full py-12 px-4 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
