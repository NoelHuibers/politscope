"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow?: string;
  title: string;
  width?: number;
  children: ReactNode;
};

export function ModalFrame({ open, onOpenChange, eyebrow, title, width = 640, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 50,
          }}
        />
        <Dialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width,
            maxWidth: "calc(100% - 64px)",
            maxHeight: "90vh",
            background: "var(--panel)",
            border: "1px solid var(--hairline)",
            borderRadius: 8,
            boxShadow: "var(--shadow)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            zIndex: 51,
            color: "var(--ink)",
            fontFamily: "var(--font-sans)",
          }}
          aria-describedby={undefined}
        >
          <div
            style={{
              padding: "18px 22px 14px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              borderBottom: "1px solid var(--hairline)",
            }}
          >
            <div>
              {eyebrow && (
                <div className="t-eyebrow" style={{ marginBottom: 4 }}>
                  {eyebrow}
                </div>
              )}
              <Dialog.Title
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 22,
                  fontWeight: 500,
                  color: "var(--ink)",
                  letterSpacing: "-0.005em",
                  margin: 0,
                }}
              >
                {title}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="btn-ghost" aria-label="Schließen">
                <Icon name="close" size={12} />
              </button>
            </Dialog.Close>
          </div>
          <div className="scroll-y" style={{ padding: "16px 22px 20px", overflow: "auto" }}>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
