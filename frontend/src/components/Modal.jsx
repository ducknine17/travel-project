import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Brand";

export default function Modal({ title, onClose, children, className = "" }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const keydown = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab") return;
      const focusables = [...ref.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')];
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, []);
  return createPortal(<div className={`modal-backdrop ${className}`} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="modal-paper" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}><div className="modal-heading"><h2>{title}</h2><button className="icon-btn" aria-label={`${title} 닫기`} onClick={onClose}><Icon name="close"/></button></div>{children}</section></div>, document.body);
}
