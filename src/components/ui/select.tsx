import * as React from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void
}

function Select({ className, onValueChange, onChange, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base text-foreground sm:text-sm disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      onChange={event => {
        onChange?.(event)
        onValueChange?.(event.target.value)
      }}
      {...props}
    />
  )
}

export { Select }
