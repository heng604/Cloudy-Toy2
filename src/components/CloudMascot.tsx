/** The little white cloud character (round, fluffy, blushing) used in the footer and the Products banner. */
export default function CloudMascot({ className = "h-14 w-14" }: { className?: string }) {
  const puffs: [number, number, number][] = [[60, 50, 32], [36, 58, 21], [84, 58, 21], [60, 72, 24], [43, 36, 17], [77, 36, 17]];
  return (<svg viewBox="0 0 120 100" className={className} aria-hidden="true">
    <g fill="#fff" stroke="#CFE3F8" strokeWidth="4">{puffs.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g>
    <g fill="#fff">{puffs.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g>
    <ellipse cx="30" cy="82" rx="11" ry="8" fill="#fff" stroke="#CFE3F8" strokeWidth="3" /><ellipse cx="90" cy="82" rx="11" ry="8" fill="#fff" stroke="#CFE3F8" strokeWidth="3" />
    <ellipse cx="47" cy="55" rx="4.2" ry="5" fill="#1d1d2e" /><ellipse cx="73" cy="55" rx="4.2" ry="5" fill="#1d1d2e" />
    <circle cx="45.800" cy="53" r="1.400" fill="#fff" /><circle cx="71.800" cy="53" r="1.400" fill="#fff" />
    <ellipse cx="37" cy="64" rx="6" ry="3.600" fill="#FFB3C8" opacity=".75" /><ellipse cx="83" cy="64" rx="6" ry="3.600" fill="#FFB3C8" opacity=".75" />
    <path d="M53 62q7 11 14 0z" fill="#FF6B8B" />
  </svg>);
}
