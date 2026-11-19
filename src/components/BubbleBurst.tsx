import { useId } from 'react'
import styles from './WishBubble.module.css'

export const BURST_SECONDS = 1.1

// Start the rupture at the right edge. Irregular gaps leave thin bridges of film.
const rim = [0, 22, -33, 54, -61, 86, -99, 123, -132, 158, -167].map((angle, i) => {
  const radians = angle * Math.PI / 180
  const dx = Math.cos(radians)
  const dy = Math.sin(radians)
  return {
    x: 300 + 158 * dx, y: 200 + 158 * dy,
    delay: 75 + Math.abs(angle) * 2,
    drift: `${dx * (34 + i % 3 * 11)} ${dy * 38 + 18}`,
  }
})

export function BubbleBurst({ artwork }: { artwork: string }) {
  const id = useId()
  return (
    <svg className={styles.burstArt} viewBox="0 0 600 400" aria-hidden="true">
      <defs>
        <image id={id + '-skin'} href={artwork} width="600" height="400" />
        <pattern id={id + '-color'} patternUnits="userSpaceOnUse" width="600" height="400">
          <use href={'#' + id + '-skin'} />
        </pattern>
        <filter id={id + '-ripple'}>
          <feTurbulence type="fractalNoise" baseFrequency=".013" numOctaves="2" result="ripples" />
          <feDisplacementMap in="SourceGraphic" in2="ripples" xChannelSelector="R" yChannelSelector="G">
            <animate attributeName="scale" values="0;24;48" dur="0.76s" fill="freeze" />
          </feDisplacementMap>
        </filter>
        <mask id={id + '-holes'} maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="400">
          <rect width="600" height="400" fill="white" />
          {rim.map(({ x, y, delay }) => (
            <ellipse key={x + ':' + y} cx={x} cy={y} rx="101" ry="76"
              className={styles.tearHole} style={{ animationDelay: delay + 'ms' }} />
          ))}
        </mask>
      </defs>
      <g filter={`url(#${id}-ripple)`} className={styles.film}>
        <use href={'#' + id + '-skin'} mask={`url(#${id}-holes)`} />
      </g>
      {rim.map(({ x, y, delay, drift }, i) => (
        <g key={i} fill={`url(#${id}-color)`}>
          <animateTransform attributeName="transform" type="translate"
            from="0 0" to={drift}
            begin={(delay + 110) + 'ms'} dur="460ms" fill="freeze" />
          <g className={styles.droplets} style={{ animationDelay: (delay + 110) + 'ms' }}>
            <ellipse cx={x} cy={y} rx={5 + i % 4} ry="5" />
            <circle cx={x + 12} cy={y - 9} r="3" />
          </g>
        </g>
      ))}
    </svg>
  )
}
