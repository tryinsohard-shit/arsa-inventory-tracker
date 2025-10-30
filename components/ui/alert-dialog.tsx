"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"

export type AlertDialogType = "alert" | "confirm" | "success" | "error" | "warning" | "info"

interface AlertDialogContextType {
  alert: (message: string, title?: string) => Promise<void>
  confirm: (message: string, title?: string) => Promise<boolean>
  success: (message: string, title?: string) => Promise<void>
  error: (message: string, title?: string) => Promise<void>
  warning: (message: string, title?: string) => Promise<void>
  info: (message: string, title?: string) => Promise<void>
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(undefined)

interface DialogState {
  open: boolean
  type: AlertDialogType
  title: string
  message: string
  resolve?: (value: boolean) => void
}

export function AlertDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DialogState>({
    open: false,
    type: "alert",
    title: "",
    message: "",
  })

  const showDialog = (type: AlertDialogType, message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        type,
        title: title || getDefaultTitle(type),
        message,
        resolve,
      })
    })
  }

  const alert = (message: string, title?: string) =>
    showDialog("alert", message, title).then(() => true)

  const confirm = (message: string, title?: string) =>
    showDialog("confirm", message, title)

  const success = (message: string, title?: string) =>
    showDialog("success", message, title).then(() => true)

  const error = (message: string, title?: string) =>
    showDialog("error", message, title).then(() => true)

  const warning = (message: string, title?: string) =>
    showDialog("warning", message, title).then(() => true)

  const info = (message: string, title?: string) =>
    showDialog("info", message, title).then(() => true)

  const handleConfirm = () => {
    state.resolve?.(true)
    setState((prev) => ({ ...prev, open: false }))
  }

  const handleCancel = () => {
    state.resolve?.(false)
    setState((prev) => ({ ...prev, open: false }))
  }

  const getIcon = () => {
    switch (state.type) {
      case "confirm":
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "info":
      case "alert":
      default:
        return <Info className="h-6 w-6 text-blue-500" />
    }
  }

  const isConfirmDialog = state.type === "confirm" || state.type === "warning"

  return (
    <AlertDialogContext.Provider value={{ alert, confirm, success, error, warning, info }}>
      {children}
      <Dialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <div className="flex gap-4">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="flex-1">
              <DialogHeader className="gap-2 text-left">
                <DialogTitle className="text-lg">{state.title}</DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-base mt-2">{state.message}</DialogDescription>
            </div>
          </div>
          <DialogFooter className="mt-6 gap-2 sm:gap-3">
            {isConfirmDialog && (
              <Button variant="outline" onClick={handleCancel} className="sm:w-auto">
                Cancel
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              className={
                state.type === "error"
                  ? "bg-red-600 hover:bg-red-700"
                  : state.type === "warning"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : ""
              }
            >
              {isConfirmDialog ? "Confirm" : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AlertDialogContext.Provider>
  )
}

export function useAlertDialog() {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error("useAlertDialog must be used within AlertDialogProvider")
  }
  return context
}

function getDefaultTitle(type: AlertDialogType): string {
  switch (type) {
    case "confirm":
      return "Confirm Action"
    case "success":
      return "Success"
    case "error":
      return "Error"
    case "warning":
      return "Warning"
    case "info":
      return "Information"
    case "alert":
    default:
      return "Alert"
  }
}
