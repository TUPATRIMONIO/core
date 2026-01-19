"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "open", label: "Abierto" },
  { value: "pending", label: "Pendiente" },
  { value: "resolved", label: "Resuelto" },
  { value: "closed", label: "Cerrado" },
];

export function SupportTicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "all";

  const updateParams = (nextStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    if (nextStatus && nextStatus !== "all") {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    router.push(`/admin/support/tickets?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={status} onValueChange={updateParams}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={() => router.push("/admin/support/tickets")}>
        Limpiar filtros
      </Button>
    </div>
  );
}
