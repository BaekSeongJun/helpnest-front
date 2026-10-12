// @owner BSJ
import type { Metadata } from 'next';
import { Home } from './home';

export const metadata: Metadata = { title: 'HelpNest 고객센터' };

export default function HomePage() {
  return <Home />;
}
