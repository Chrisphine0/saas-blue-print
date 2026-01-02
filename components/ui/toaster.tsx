'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  console.log('Toaster rendering with toasts:', toasts)

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        console.log('Rendering individual toast:', {
          id,
          title,
          description,
          hasAction: !!action,
          otherProps: props,
        })

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title ? (
                <ToastTitle>{title}</ToastTitle>
              ) : null}
              {description ? (
                <ToastDescription>{description}</ToastDescription>
              ) : null}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}