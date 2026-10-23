import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface DialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
  titleId: string
}

const DialogContext = React.createContext<DialogContextType | null>(null)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error('Dialog components must be used within a Dialog')
  return context
}

function Dialog({ open: controlledOpen, onOpenChange, children }: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const onOpenChange_ = onOpenChange ?? setUncontrolledOpen
  const titleId = React.useId()

  return (
    <DialogContext.Provider value={{ open, onOpenChange: onOpenChange_, titleId }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ children, ...props }: { asChild?: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useDialog()
  return (
    <button onClick={() => onOpenChange(true)} {...props}>
      {children}
    </button>
  )
}

function DialogContent({ children, className, ...props }: React.DialogHTMLAttributes<HTMLDialogElement>) {
  const { open, onOpenChange, titleId } = useDialog()
  const { t } = useTranslation()
  const ref = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return

    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      className={cn(
        "fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-xl border bg-background p-4 text-foreground shadow-lg backdrop:bg-black/50 sm:p-6",
        className
      )}
      onCancel={event => {
        event.preventDefault()
        onOpenChange(false)
      }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
        )).filter(element => element.getClientRects().length > 0 && element.tabIndex >= 0)
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      {...props}
    >
      {children}
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground active:bg-accent"
        aria-label={t('common.close')}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </dialog>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-5 flex flex-col space-y-1.5 pr-10 text-left", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialog()
  return (
    <h2
      id={titleId}
      className={cn("text-lg font-semibold leading-snug tracking-tight", className)}
      {...props}
    />
  )
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle }
