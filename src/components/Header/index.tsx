import styles from './header.module.scss';
import Link from 'next/link';

interface HeaderProps {
  post?: boolean;
}
export default function Header({ post }: HeaderProps) {
  // TODO
  return (
    <Link
      href={{
        pathname: '/',
      }}
    >
      <header className={post ? styles.headerPost : styles.headerContainer}>
        <div className={post ? styles.headerContentPost : styles.headerContent}>
          <img src="/images/logo.svg" alt="logo" />
        </div>
      </header>
    </Link>
  );
}
