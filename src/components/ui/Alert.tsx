import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertProps {
  type: 'error' | 'warning' | 'success' | 'info'
  message: string
  dismissible?: boolean
  onDismiss?: () => void
}

const typeConfig = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-700',
    icon: AlertCircle,
    iconClass: 'text-red-500',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertTriangle,
    iconClass: 'text-yellow-500',
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-700',
    icon: CheckCircle,
    iconClass: 'text-green-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-700',
    icon: Info,
    iconClass: 'text-blue-500',
  },
}

export function Alert({ type, message, dismissible, onDismiss }: AlertProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border rounded-md text-sm',
        config.container
      )}
      role="alert"
    >
      <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.iconClass)} />
      <p className="flex-1">{message}</p>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 ml-1 hover:opacity-70 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
