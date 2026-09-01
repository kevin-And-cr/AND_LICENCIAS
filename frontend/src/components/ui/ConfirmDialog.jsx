import { AlertTriangle, Trash2, HelpCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

/**
 * Modal de confirmación genérico.
 *
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   onConfirm   () => void | Promise<void>
 *   title       string
 *   message     string | ReactNode
 *   variant     "danger" | "warning" | "default"   (default "default")
 *   confirmText string   (default "Confirmar")
 *   cancelText  string   (default "Cancelar")
 *   loading     boolean
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "¿Estás seguro?",
  message = "Esta acción no se puede deshacer.",
  variant = "default",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
}) {
  const BRAND = "#F48124";

  const config = {
    danger:  { icon: <Trash2 size={28} />,        iconBg: "#fef2f2", iconColor: "#dc2626", btnVariant: "danger"   },
    warning: { icon: <AlertTriangle size={28} />,  iconBg: "#fffbeb", iconColor: "#d97706", btnVariant: "warning"  },
    default: { icon: <HelpCircle size={28} />,     iconBg: `${BRAND}15`, iconColor: BRAND,  btnVariant: "primary"  },
  }[variant];

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={config.btnVariant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: config.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: config.iconColor,
        }}>
          {config.icon}
        </div>
        <p style={{ fontSize: 14, color: "#475569", margin: 0, lineHeight: 1.6, paddingTop: 4 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}
