export function Loader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} role="status" aria-label="Loading">
      <span className="w-2 h-2 rounded-full bg-brand-orange animate-claude-dot [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-brand-orange animate-claude-dot [animation-delay:160ms]" />
      <span className="w-2 h-2 rounded-full bg-brand-orange animate-claude-dot [animation-delay:320ms]" />
    </div>
  );
}