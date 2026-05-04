"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "¿Cómo transfiero mi boleto?",
    answer: "Puedes transferir tu boleto desde la sección 'Mis Boletos' en tu Billetera Digital. Simplemente selecciona el boleto que deseas enviar e ingresa el correo electrónico del destinatario registrado en StageFront."
  },
  {
    question: "¿Qué pasa si el concierto se cancela?",
    answer: "Si un evento es cancelado oficialmente, procesaremos automáticamente un reembolso completo a tu método de pago original dentro de 3 a 5 días hábiles."
  },
  {
    question: "¿Puedo cambiar la fecha de mi entrada?",
    answer: "Las entradas son para fechas específicas y generalmente no se pueden cambiar. Revisa las políticas del organizador del evento para excepciones específicas."
  },
  {
    question: "¿Cuándo recibiré mis boletos digitales?",
    answer: "Tus boletos digitales estarán disponibles inmediatamente después de la compra en tu Billetera Digital (/wallet) y también recibirás un correo de confirmación."
  }
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col divide-y divide-white/10">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index} 
            className="py-stack-sm group cursor-pointer"
            onClick={() => toggleAccordion(index)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline-md text-[20px] text-primary group-hover:text-tertiary-container transition-colors">
                {faq.question}
              </h3>
              <span className={`material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all duration-300 ${isOpen ? "rotate-45" : ""}`}>
                add
              </span>
            </div>
            {/* Contenido Colapsable */}
            <div 
              className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 mt-4 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <p className="font-body-md text-on-surface-variant">
                {faq.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
