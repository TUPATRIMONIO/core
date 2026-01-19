"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "reviewing", label: "En revisión" },
  { value: "resolved", label: "Resuelto" },
  { value: "rejected", label: "Rechazado" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Todos los tipos" },
  { value: "error", label: "Error" },
  { value: "improvement", label: "Mejora" },
];

export function FeedbackFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "all";
  const type = searchParams.get("type") ?? "all";

  const updateParams = (nextStatus: string, nextType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    if (nextStatus && nextStatus !== "all") {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    if (nextType && nextType !== "all") {
      params.set("type", nextType);
    } else {
      params.delete("type");
    }

    router.push(`/admin/feedback?${params.toString()}`);
  };

  const handleClear = () => {
    router.push("/admin/feedback");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={status} onValueChange={(value) => updateParams(value, type)}>
        <SelectTrigger className="w-[180px]">
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

      <Select value={type} onValueChange={(value) => updateParams(status, value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={handleClear}>
        Limpiar filtros
      </Button>
    </div>
  );
}
