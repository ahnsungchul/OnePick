export default function CommonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="common-layout">{children}</div>;
}
