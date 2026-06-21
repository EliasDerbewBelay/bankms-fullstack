'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed z-50 flex max-h-[min(90dvh,900px)] w-[calc(100%-2rem)] flex-col',
            'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-background shadow-2xl',
            'animate-fade-in focus:outline-none sm:w-full',
            sizeClasses[size]
          )}
        >
          <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-foreground">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground touch-manipulation"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
