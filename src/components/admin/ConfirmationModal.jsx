import { AlertTriangle, X } from 'lucide-react';

function ConfirmationModal({
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'default',
  onConfirm,
  onClose,
  children,
}) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        <span className={`admin-modal-icon ${tone === 'danger' ? 'danger' : ''}`}><AlertTriangle size={20} /></span>
        <h2 id="admin-modal-title">{title}</h2>
        {message && <p>{message}</p>}
        {children}
        <div className="admin-modal-actions">
          <button type="button" className="admin-button admin-button-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className={`admin-button ${tone === 'danger' ? 'admin-button-danger' : 'admin-button-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmationModal;
