interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({
  children,
  className = '',
}: GlassCardProps) {
  return (
    <div
      className={`
   rounded-3xl
   border
   border-white/10
   bg-white/[0.05]
   backdrop-blur-xl
   shadow-[0_8px_32px_rgba(59,130,246,0.12)]
   transition-all
   duration-300
   hover:shadow-[0_8px_40px_rgba(59,130,246,0.25)]
   hover:-translate-y-1
   ${className}
   `}
    >
      {children}
    </div>
  );
}
