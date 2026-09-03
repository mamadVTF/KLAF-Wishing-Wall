import styles from './Logo.module.css'

export function Logo() {
  return (
    <div className={styles.logoRow}>
      <span className={`${styles.word} ${styles.left}`}>Nak</span>
        <img src="/images/logo.png" alt="Maggi" />
      <span className={`${styles.word} ${styles.right}`}>Apa?</span>
    </div>
  )
}