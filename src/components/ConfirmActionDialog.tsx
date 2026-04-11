import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ConfirmActionDialogProps = {
  triggerText: string;
  title: string;
  description: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  pending?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  children?: ReactNode;
};

export function ConfirmActionDialog({
  triggerText,
  title,
  description,
  confirmText,
  onConfirm,
  disabled = false,
  pending = false,
  variant = "destructive",
  children,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant={variant} disabled={disabled || pending} />}>
        {triggerText}
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          {children}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={pending}
            onClick={() => void onConfirm()}
          >
            {pending ? "Processing..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
