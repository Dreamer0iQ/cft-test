import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { LoginForm } from './LoginForm';
import { PixelWave } from './PixelWave';
import styles from './login.module.scss';

export const metadata = { title: 'Вход · cft.audit' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/audits');

  return (
    <div className={styles.page}>
      <div className={styles.visual}>
        <PixelWave />
        <div className={styles.visualOverlay}>
          <div className={styles.visualBrand}>
            <span className={styles.visualBrandDot} />
            <span className={styles.visualBrandText}>cft.audit</span>
          </div>

          <div className={styles.visualFooter}>
            <h1 className={styles.visualHeadline}>
              Безопасность <span className={styles.visualHeadlineAccent}>финансовых систем</span> под контролем.
            </h1>
            <p className={styles.visualSub}>
              Внутренний сервис ЦФТ для работы с результатами аудитов безопасности — от первичного просмотра L1 до экспертной оценки L3.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.formSide}>
        <LoginForm />
      </div>
    </div>
  );
}
