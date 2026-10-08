// @owner BSJ
// 공용 레이아웃 CM-06 (docs/08 §4, 09 §2.1). 권한 확인은 각 화면의 AuthGuard 가 한다
import { MainShell } from '@/components/layout/main-shell';

export default function MainLayout({ children }: LayoutProps<'/'>) {
  return <MainShell>{children}</MainShell>;
}
