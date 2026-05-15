import React from "react";

interface ErrorToastProps {
  title?: string;
  message: string;
  onClose: () => void;
}

export function ErrorToast({ title = "Transacción Rechazada", message, onClose }: ErrorToastProps) {
  return (
    <div className="fixed bottom-8 right-8 z-[100] animate-[slideInRight_0.5s_ease-out_forwards] max-w-sm w-full">
      <div className="relative bg-error-container/80 border border-error/30 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl shadow-error-container/20">
        <div className="flex items-start p-6 gap-4 relative z-10">
          <div className="flex-shrink-0 mt-1">
            <span
              className="material-symbols-outlined text-error text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              gpp_bad
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-headline-md text-[20px] text-error mb-2 leading-tight">
              {title}
            </h3>
            <p className="font-body-md text-[14px] text-on-error-container opacity-90 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-error hover:text-white transition-colors opacity-70 hover:opacity-100 p-1"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {/* Contextual Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-error/10 to-transparent pointer-events-none"></div>
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-[3px] bg-error/20 w-full">
          <div className="h-full bg-error origin-left animate-[shrinkProgress_5s_linear_forwards]"></div>
        </div>
      </div>
    </div>
  );
}
