// @owner BSJ
// 공용 레이아웃 CM-06 (docs/08 §4, 09 §2.1). 권한 확인은 각 화면의 AuthGuard 가 한다
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';

export default function MainLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <Header />
      <div className="flex flex-1">
        <aside className="bg-sidebar hidden w-60 shrink-0 border-r md:block">
          <div className="sticky top-14">
            <SidebarNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
      <Footer />
    </>
  );
}
