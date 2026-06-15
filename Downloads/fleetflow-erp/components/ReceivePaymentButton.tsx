"use client";
import { useState } from "react";
import { DollarSign } from "lucide-react";
import ReceivePaymentModal from "./ReceivePaymentModal";

export default function ReceivePaymentButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="ff-btn ff-btn-secondary">
        <DollarSign size={14} /> Receive Payment
      </button>
      {open && <ReceivePaymentModal onClose={() => setOpen(false)} />}
    </>
  );
}
