'use client';

import { LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LogoutConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function LogoutConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
}: LogoutConfirmationModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle className="text-xl font-semibold text-foreground">
            Confirmar Saída
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground leading-relaxed">
            Tem certeza que deseja sair do sistema?
            <br />
            <span className="text-sm text-text-secondary">
              Você será redirecionado para a página de login.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3">
          <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1 bg-muted hover:bg-muted/80 text-muted-foreground border-0">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full sm:w-auto order-1 sm:order-2 bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sim, Sair
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
