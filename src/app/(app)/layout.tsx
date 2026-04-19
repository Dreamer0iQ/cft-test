import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import styles from './layout.module.scss';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = {
    name: session.user.name ?? session.user.email ?? 'Пользователь',
    email: session.user.email ?? '',
    role: session.user.role,
  };

  return (
    <div className={styles.shell}>
      <Sidebar role={user.role} />
      <div className={styles.main}>
        <Header user={user} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
