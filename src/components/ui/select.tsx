import * as React from 'react'
import { cn } from '@/lib/utils'

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

function useSelectContext() {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('Select components must be used within a Select')
  return context
}

function Select({ value, onValueChange, children }: {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState('')
  const [open, setOpen] = React.useState(false)

  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <SelectContext.Provider value={{
        value: value ?? uncontrolledValue,
        onValueChange: (v) => {
          (onValueChange ?? setUncontrolledValue)(v)
          setOpen(false)
        },
        open,
        setOpen,
      }}>
        {children}
      </SelectContext.Provider>
    </div>
  )
}

function SelectTrigger({ className, children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSelectContext()
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <svg
        className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext()
  return <span className="text-sm">{value || placeholder}</span>
}

function SelectContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSelectContext()
  if (!open) return null
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

function SelectItem({ value, children, className, ...props }: { value: string } & React.HTMLAttributes<HTMLDivElement>) {
  const { value: selectedValue, onValueChange } = useSelectContext()
  return (
    <div
      role="option"
      aria-selected={value === selectedValue}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        value === selectedValue && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
