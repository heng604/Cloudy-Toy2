/** Round profile picture; shows the first letter of the name when there is no photo. */
export default function Avatar({ src, name = "", size = 40, className = "" }: { src?: string; name?: string; size?: number; className?: string }) {
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  return (<span style={{ width: size, height: size, fontSize: size * 0.42 }} className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-sky-border bg-[#E4F0FF] font-extrabold text-[#2F7FC6] ${className}`}>
    {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span aria-hidden="true">{letter}</span>}</span>);
}
