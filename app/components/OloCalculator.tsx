"use client";
import { useEffect } from "react";

export default function OloCalculator() {
  useEffect(() => {
    (window as any).OloCalculator = {
      ...(window as any).OloCalculator,
      onApply: async (p: { email: string }) => {
        const res = await fetch("/api/early-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: p.email }),
        });
        return res.ok;
      },
    };
  }, []);

  return <olo-calculator />;
}
