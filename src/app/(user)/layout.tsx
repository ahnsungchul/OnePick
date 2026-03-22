'use client';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">


      <div className="user-layout-content">
        {children}
      </div>
    </div>
  );
}
