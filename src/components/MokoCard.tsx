import Link from 'next/link';

export default function MokoCard({
  href,
  title,
  desc,
  img,
  color,
}: {
  href?: string;
  title: string;
  desc?: string;
  img: string;
  color: string;
}) {
  const body = (
    <div className={`rounded-3xl p-4 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 ${color} text-white overflow-hidden relative`}>
      <img src={img} alt={title} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-2xl border-4 border-white/40 shadow mb-3" />
      <h3 className="text-xl md:text-2xl font-extrabold drop-shadow">{title}</h3>
      {desc ? <p className="text-sm md:text-base opacity-90 mt-1 font-medium">{desc}</p> : null}
      <div className="absolute -right-6 -bottom-6 text-8xl opacity-10">✨</div>
    </div>
  );
  if (href) return <Link href={href}>{body}</Link>;
  return body;
}
