import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-gradient-to-br from-slate-900 to-slate-800 border-b border-white/10 p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
        {actions && (
          <div className="sticky bottom-0 bg-gradient-to-br from-slate-900 to-slate-800 border-t border-white/10 p-6 flex justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  variant = 'info',
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-slate-900',
    info: 'bg-gradient-to-r from-electric-500 to-cyan-500 hover:from-electric-400 hover:to-cyan-400 text-slate-950',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <>
          <button onClick={onClose} className="btn-secondary">
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-3.5 font-semibold rounded-xl transition-all duration-300 shadow-lg ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-gray-300 leading-relaxed">{message}</p>
    </Modal>
  );
}

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  submitText?: string;
  cancelText?: string;
}

export function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  submitText = 'OK',
  cancelText = 'Abbrechen',
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = () => {
    onSubmit(value);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <>
          <button onClick={onClose} className="btn-secondary">
            {cancelText}
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {submitText}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">{message}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          className="input-field"
          autoFocus
        />
      </div>
    </Modal>
  );
}

interface SelectEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (eventId: string) => void;
  events: Array<{ id: string; title: string }>;
  title: string;
  message: string;
}

export function SelectEventModal({
  isOpen,
  onClose,
  onSelect,
  events,
  title,
  message,
}: SelectEventModalProps) {
  const [selectedId, setSelectedId] = useState<string>('');

  const handleSelect = () => {
    if (selectedId) {
      onSelect(selectedId);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <>
          <button onClick={onClose} className="btn-secondary">
            Abbrechen
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedId}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            OK
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed mb-4">{message}</p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.map((event, index) => (
            <button
              key={event.id}
              onClick={() => setSelectedId(event.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedId === event.id
                  ? 'bg-electric-500/20 border-electric-500/50 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-gray-300 hover:border-electric-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-electric-400 to-cyan-500 rounded-lg flex items-center justify-center text-slate-950 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-xs text-gray-500 font-mono truncate">{event.id}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
