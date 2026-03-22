'use client';

import React from 'react';
import { 
  PencilLine, 
  Search, 
  Handshake, 
  CheckCircle2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

import Link from 'next/link';

interface StatusCardProps {
  label: string;
  count: number;
  icon: React.ElementType;
  colorClass: string;
  iconColorClass: string;
  href: string;
}

const StatusCard = ({ label, count, icon: Icon, colorClass, iconColorClass, href }: StatusCardProps) => (
  <Link href={href}>
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-pointer">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{count}</p>
      </div>
      <div className={cn("p-3 rounded-xl transition-colors", colorClass)}>
        <Icon className={cn("w-6 h-6", iconColorClass)} />
      </div>
    </div>
  </Link>
);

export default function UserDashboardStatus({ stats }: { stats?: any }) {
  const statCounts = [
    { label: '작성중', count: stats?.DRAFT || 0, icon: PencilLine, color: 'bg-slate-50 group-hover:bg-slate-100', iconColor: 'text-slate-400', value: 'DRAFT' },
    { label: '매칭중', count: stats?.MATCHING || 0, icon: Search, color: 'bg-blue-50 group-hover:bg-blue-100', iconColor: 'text-blue-500', value: 'MATCHING' },
    { label: '매칭완료', count: stats?.FINISHED || 0, icon: Handshake, color: 'bg-indigo-50 group-hover:bg-indigo-100', iconColor: 'text-indigo-500', value: 'FINISHED' },
    { label: '서비스완료', count: stats?.COMPLETED || 0, icon: CheckCircle2, color: 'bg-emerald-50 group-hover:bg-emerald-100', iconColor: 'text-emerald-500', value: 'COMPLETED' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCounts.map((stat) => (
        <StatusCard 
          key={stat.label}
          label={stat.label}
          count={stat.count}
          icon={stat.icon}
          colorClass={stat.color}
          iconColorClass={stat.iconColor}
          href={`/user/my-requests?status=${stat.value}`}
        />
      ))}
    </div>
  );
}
