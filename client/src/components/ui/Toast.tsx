// apps/frontend/src/components/ui/toast.tsx
import * as React from "react"
import { cva } from "class-variance-authority"
import { X, Heart, GitCompare, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-4 overflow-hidden rounded-xl border backdrop-blur-md p-4 shadow-2xl",
  {
    variants: {
      variant: {
        default: "bg-gray-900/95 border-gray-700/50 text-white",
        wishlist: "bg-gray-900/95 border-red-500/30 text-white",
        compare: "bg-gray-900/95 border-blue-500/30 text-white",
        cart: "bg-gray-900/95 border-emerald-500/30 text-white",
        destructive: "bg-gray-900/95 border-red-500/40 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Progress bar component
const ToastProgressBar: React.FC<{ 
  duration: number; 
  variant: string;
  onComplete: () => void;
}> = ({ duration, variant, onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const getProgressColor = () => {
    switch (variant) {
      case 'wishlist': return 'bg-red-500'
      case 'compare': return 'bg-blue-500'
      case 'cart': return 'bg-emerald-500'
      case 'destructive': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700/50">
      <motion.div
        className={cn("h-full", getProgressColor())}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
      />
    </div>
  );
};

interface ToastProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'wishlist' | 'compare' | 'cart' | 'destructive';
  duration?: number;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id,
  title, 
  description, 
  variant = 'default', 
  duration = 5000,
  onDismiss 
}) => {
  const [isAnimatingOut, setIsAnimatingOut] = React.useState(false);

  const handleComplete = React.useCallback(() => {
    setIsAnimatingOut(true);
  }, []);

  const handleAnimationComplete = React.useCallback(() => {
    if (isAnimatingOut) {
      onDismiss(id);
    }
  }, [isAnimatingOut, id, onDismiss]);

  const handleClose = React.useCallback(() => {
    setIsAnimatingOut(true);
  }, []);

  const getIcon = () => {
    switch (variant) {
      case 'wishlist':
        return <Heart className="w-5 h-5 fill-current text-red-500" />;
      case 'compare':
        return <GitCompare className="w-5 h-5 text-blue-500" />;
      case 'cart':
        return <ShoppingCart className="w-5 h-5 text-emerald-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 400, scale: 0.8 }}
      animate={{ 
        opacity: isAnimatingOut ? 0 : 1, 
        x: isAnimatingOut ? 400 : 0, 
        scale: isAnimatingOut ? 0.8 : 1
      }}
      onAnimationComplete={handleAnimationComplete}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.5
      }}
      className={cn(toastVariants({ variant }))}
      style={{ width: '400px' }}
    >
      {/* Icon */}
      {getIcon() && (
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
      )}
      
      {/* Content Container */}
      <div className="flex-1 min-w-0">
        <div className="grid gap-1">
          {title && (
            <div className="text-sm font-semibold text-white leading-tight">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm text-white/90 leading-relaxed">
              {description}
            </div>
          )}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200 group"
      >
        <X className="w-4 h-4 text-white/60 group-hover:text-white/80" />
      </button>

      {/* Progress Bar */}
      {!isAnimatingOut && (
        <ToastProgressBar 
          duration={duration} 
          variant={variant} 
          onComplete={handleComplete}
        />
      )}
    </motion.div>
  );
};

type ToastActionElement = React.ReactElement

export {
  type ToastProps,
  type ToastActionElement,
  Toast,
}