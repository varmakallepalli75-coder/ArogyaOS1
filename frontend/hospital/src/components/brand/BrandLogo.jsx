export function BrandMark({ className = 'h-10 w-10', title }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} xmlns="http://www.w3.org/2000/svg">
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id="medcareaxis-mark" x1="9" y1="7" x2="55" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10A77D"/><stop offset="1" stopColor="#05664D"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="18" fill="url(#medcareaxis-mark)"/>
      <path d="M28.5 13.5a3.5 3.5 0 0 1 7 0V25h-7V13.5ZM28.5 39h7v11.5a3.5 3.5 0 0 1-7 0V39ZM13.5 28.5H25v7H13.5a3.5 3.5 0 0 1 0-7ZM39 28.5h11.5a3.5 3.5 0 0 1 0 7H39v-7Z" fill="white"/>
      <rect x="25" y="25" width="14" height="14" rx="5" fill="#D9FFF2"/>
      <circle cx="32" cy="32" r="3.5" fill="#087A5B"/>
    </svg>
  )
}

export default function BrandLogo({ className = '', markClassName = 'h-10 w-10', wordmarkClassName = 'text-xl', inverse = false, subtitle }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <BrandMark className={markClassName} title="MedCareAxis" />
      <span className="flex flex-col text-left leading-none">
        <span className={`${wordmarkClassName} font-extrabold tracking-[-.045em] ${inverse ? 'text-white' : 'text-slate-950'}`}>
          MedCare<span className={inverse ? 'text-emerald-300' : 'text-emerald-600'}>Axis</span>
        </span>
        {subtitle && <span className={`mt-1 text-[10px] font-semibold tracking-[.12em] uppercase ${inverse ? 'text-emerald-200/70' : 'text-slate-400'}`}>{subtitle}</span>}
      </span>
    </span>
  )
}
