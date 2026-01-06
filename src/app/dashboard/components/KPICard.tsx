interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: string;
  trend: 'up' | 'down';
  color: string;
}

export default function KPICard({ title, value, change, icon, trend, color }: KPICardProps) {
  return (
    <div className="relative rounded-2xl px-4 py-3 shadow-elevated border border-border bg-card/90 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 group">
      {/* Soft colored background using the KPI gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 pointer-events-none`} />

      <div className="relative flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d={icon} />
          </svg>
        </div>
        <div className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] md:text-xs ${trend === 'up' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {trend === 'up' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            )}
          </svg>
          <span className="font-cta font-semibold">{Math.abs(change)}%</span>
        </div>
      </div>
      <h3 className="relative text-xs md:text-sm font-body text-muted-foreground mb-1.5">{title}</h3>
      <p className="relative text-2xl md:text-3xl font-display font-bold text-foreground">{value}</p>
    </div>
  );
}