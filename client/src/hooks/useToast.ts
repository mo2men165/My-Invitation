// apps/frontend/src/hooks/use-toast.ts
import * as React from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'wishlist' | 'compare' | 'cart' | 'destructive'
  duration?: number
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

// Use a more stable state management approach
const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  // Batch updates to prevent excessive re-renders
  Promise.resolve().then(() => {
    listeners.forEach((listener) => {
      listener(memoryState)
    })
  })
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST": {
      // Prevent duplicates and limit toasts
      const existingToast = state.toasts.find(t => 
        t.title === action.toast.title && 
        t.description === action.toast.description
      )
      
      if (existingToast) {
        return state // Don't add duplicate
      }

      const newToasts = [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      return {
        ...state,
        toasts: newToasts,
      }
    }

    case "DISMISS_TOAST": {
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    }
    
    case "REMOVE_TOAST": {
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    }
  }
}

type Toast = Omit<ToasterToast, "id">

function toast({ duration = TOAST_REMOVE_DELAY, ...props }: Toast) {
  const id = genId()

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      duration,
    },
  })

  return {
    id: id,
    dismiss,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, []) // Remove state dependency to prevent unnecessary re-renders

  return {
    ...state,
    toast,
    dismiss: (toastId: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }