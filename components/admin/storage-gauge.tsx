import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type StorageGaugeProps = {
  used: number
  total: number
  percentage: number
}

export function StorageGauge({ used, total, percentage }: StorageGaugeProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getColor = () => {
    if (percentage < 70) return "bg-green-500"
    if (percentage < 90) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
        <CardDescription>
          {formatBytes(used)} of {formatBytes(total)} used
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Usage</span>
            <span className="font-medium">{percentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2"
            indicatorClassName={getColor()}
          />
          <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
            <div>
              <p className="text-muted-foreground">Used</p>
              <p className="font-medium">{formatBytes(used)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Available</p>
              <p className="font-medium">{formatBytes(total - used)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
