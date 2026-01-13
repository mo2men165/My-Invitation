// apps/frontend/src/components/ui/toaster.tsx
"use client"

import { Toast } from "@/components/ui/Toast"
import { useToast } from "@/hooks/useToast"
import { motion } from "framer-motion"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[420px] max-h-screen pointer-events-none">
      {toasts.map((toast, index) => (
        <motion.div
          key={toast.id}
          layout
          className="pointer-events-auto"
          transition={{ layout: { duration: 0.2 } }}
          style={{ zIndex: 1000 - index }}
        >
          <Toast
            id={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            duration={toast.duration}
            onDismiss={dismiss}
          />
        </motion.div>
      ))}
    </div>
  )
}