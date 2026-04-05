import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Providers will be added in auth.ts to avoid Edge issues with DB
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.grade = (user as any).grade;
        token.image = user.image;
      }
      if (trigger === "update" && session) {
        if (session.image !== undefined) token.image = session.image;
        if (session.name !== undefined) token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).grade = token.grade;
        if (token.image) session.user.image = token.image as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isUserPage = nextUrl.pathname.startsWith('/user');
      const isExpertPage = nextUrl.pathname.startsWith('/expert');
      const isExpertDashboard = nextUrl.pathname === '/expert/dashboard';
      const isExpertPortfolio = nextUrl.pathname.startsWith('/expert/portfolio');
      
      // 로그아웃 상태에서 마이페이지 관련(/user/*) 접근 시 홈으로 리다이렉트
      if (isUserPage && !isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // 전문가 전용 권한 체크 (대시보드와 포트폴리오는 예외로 전체 공개)
      if (isExpertPage && !isExpertDashboard && !isExpertPortfolio) {
        if (!isLoggedIn) {
          // 비로그인 상태에서 전문가 하위 페이지 접근 시 전문가 홈으로 리다이렉트
          return Response.redirect(new URL(`/expert/dashboard${nextUrl.search}`, nextUrl));
        }

        const role = (auth.user as any).role;
        if (role === 'EXPERT' || role === 'BOTH') {
          return true;
        }
        
        // 로그인했지만 전문가가 아닌 일반 사용자의 경우 홈으로 리다이렉트
        return Response.redirect(new URL(`/expert/dashboard${nextUrl.search}`, nextUrl));
      }
      return true;
    },
  },
  secret: process.env.AUTH_SECRET || "local-dev-secret-key-12345",
  pages: {
    signIn: '/login',
  }
} satisfies NextAuthConfig;
