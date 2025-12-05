import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type StatCardProps = {
  title: string
  value: string | number
  icon: LucideIcon
  subtitle?: string
  trend?: string
  className?: string
  iconClassName?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("w-4 h-4 text-muted-foreground", iconClassName)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <span className={cn(
                "text-xs font-medium",
                trend.startsWith("+") ? "text-green-600" : "text-red-600"
              )}>
                {trend}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
