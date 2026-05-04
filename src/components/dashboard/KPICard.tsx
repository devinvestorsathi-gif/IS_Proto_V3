import { formatIndianShort } from '@/lib/utils/formatters'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title:       string
  value:       string | number
  subtitle?:   string
  icon?:       LucideIcon
  trend?:      number   // positive = green, negative = red
  format?:     'number' | 'currency' | 'percent' | 'raw'
  highlight?:  boolean  // gold border for north star metric
}

export default function KPICard({
  title, value, subtitle, icon: Icon, trend, format = 'raw', highlight = false
}: KPICardProps) {
  function displayValue(): string {
    if (typeof value === 'string') return value
    switch (format) {
      case 'currency': return formatIndianShort(value)
      case 'percent':  return `${value.toFixed(1)}%`
      case 'number':   return value.toLocaleString('en-IN')
      default:         return String(value)
    }
  }

  return (
    <div className={`
      is-card flex flex-col gap-3 animate-fade-in
      ${highlight ? 'border-gold/40 shadow-[0_0_15px_rgba(201,168,76,0.1)]' : ''}
    `}>
      <div className="flex items-start justify-between">
        <p className="text-text-secondary text-xs font-medium uppercase tracking-wide">
          {title}
        </p>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${highlight ? 'bg-gold/10' : 'bg-surface-raised'}`}>
            <Icon size={14} className={highlight ? 'text-gold' : 'text-text-secondary'} />
          </div>
        )}
      </div>

      <div>
        <p className={`text-2xl font-bold ${highlight ? 'text-gold' : 'text-text-primary'}`}>
          {displayValue()}
        </p>
        {subtitle && (
          <p className="text-text-secondary text-xs mt-0.5">{subtitle}</p>
        )}
      </div>

      {trend !== undefined && (
        <p className={`text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs last month
        </p>
      )}
    </div>
  )
}