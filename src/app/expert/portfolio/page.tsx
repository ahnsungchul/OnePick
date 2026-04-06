import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ExpertDashboardLayout from '@/components/layout/ExpertDashboardLayout';
import Link from 'next/link';
import PortfolioClientLayout from './PortfolioClientLayout';

import { prisma } from '@/lib/prisma';
import type { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
  { searchParams }: { searchParams: { [key: string]: string | string[] | undefined } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const paramPortfolioId = searchParams.portfolioId;
  let portfolioId = Number(Array.isArray(paramPortfolioId) ? paramPortfolioId[0] : paramPortfolioId);

  const paramUserId = searchParams.userId;
  let targetUserId = Number(Array.isArray(paramUserId) ? paramUserId[0] : paramUserId);
  
  let baseTitle = '전문가 블로그 - OnePick';
  let baseDesc = '원픽 전문가 블로그입니다.';
  let ogImage = '/images/og-image.jpg';

  if (!isNaN(targetUserId)) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId }, select: { name: true } });
    if (user) {
      baseTitle = `${user.name} 전문가 블로그 - OnePick`;
      baseDesc = `${user.name} 전문가님의 작업 내역과 블로그를 확인해보세요.`;
    }
  }

  if (!isNaN(portfolioId)) {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId }
    });
    
    if (portfolio) {
      // Strip html tags for plain text description
      const plainContent = portfolio.content
        ? portfolio.content.replace(/<[^>]+>/g, ' ').substring(0, 160).trim()
        : baseDesc;
        
      return {
        title: `${portfolio.title} | ${baseTitle.split(' - ')[0]}`,
        description: plainContent,
        keywords: portfolio.seoTags ? portfolio.seoTags.split(',').map(t => t.trim()) : [],
        openGraph: {
          title: portfolio.title,
          description: plainContent,
          type: 'article',
          images: portfolio.thumbnailUrl ? [portfolio.thumbnailUrl] : [ogImage],
        },
        robots: {
          index: true,
          follow: true,
        }
      };
    }
  }

  return {
    title: baseTitle,
    description: baseDesc,
    openGraph: {
      title: baseTitle,
      description: baseDesc,
      type: 'website',
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    }
  };
}

export default async function ExpertPortfolioPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  const paramUserId = searchParams.userId;
  
  if (!paramUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-800">잘못된 접근입니다</h2>
          <p className="text-slate-500 font-medium">유효하지 않은 페이지 요청입니다.</p>
        </div>
        <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
          원픽 메인으로 이동
        </Link>
      </div>
    );
  }

  let targetUserId = Number(Array.isArray(paramUserId) ? paramUserId[0] : paramUserId);
  if (isNaN(targetUserId)) {
    targetUserId = 0;
  }
  
  const isOwner = session?.user?.id ? Number(session.user.id) === targetUserId : false;

  return (
    <ExpertDashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">블로그</h1>
          <p className="text-slate-500 mt-1 font-medium">전문가의 작업 내역과 블로그를 확인해보세요.</p>
        </div>
        <PortfolioClientLayout targetUserId={targetUserId} isOwner={isOwner} />
      </div>
    </ExpertDashboardLayout>
  );
}
