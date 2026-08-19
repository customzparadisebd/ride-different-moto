// ============================================================
// WHATSAPP FLOATING WIDGET
// Purpose: Branded floating contact button for storefront.
// ============================================================
import React from "react";
import { MessageCircle } from "lucide-react";

export function WhatsAppFloating() {
  const whatsappNumber = "8801890722202";
  const message = encodeURIComponent("Hello CUSTOMZ PARADISE BD, I'm interested in your motorcycle modifications.");
  const url = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="size-8" />
      <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex h-4 w-4 rounded-full bg-white text-[8px] font-black text-[#25D366] items-center justify-center">1</span>
      </span>
    </a>
  );
}
