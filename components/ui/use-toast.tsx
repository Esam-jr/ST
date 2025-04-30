import { useState, useCallback } from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastState extends ToastProps {
  id: string;
  visible: boolean;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
  toasts: ToastState[];
}

export function useToast(): ToastContextType {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = useCallback(
    (props: ToastProps) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { ...props, id, visible: true };
      
      setToasts((prev) => [...prev, newToast]);
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => 
          prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
        );
        
        // Remove from state after animation
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
      }, 5000);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => 
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  return { toast, dismiss, toasts };
} 