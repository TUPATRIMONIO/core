import { Users } from "lucide-react";
import { USERS_COUNT, type UsersCountFormat } from "@/lib/constants";

interface UsersCountProps {
  /**
   * Formato del número a mostrar
   * @default "textShort"
   */
  format?: Exclude<UsersCountFormat, "raw">;
  /**
   * Mostrar ícono de usuarios
   * @default false
   */
  showIcon?: boolean;
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * Componente para mostrar la cantidad de usuarios de TuPatrimonio
 * Centraliza el valor para fácil actualización y consistencia
 */
export function UsersCount({ 
  format = "textShort", 
  showIcon = false, 
  className = "" 
}: UsersCountProps) {
  const value = USERS_COUNT[format];
  
  if (showIcon) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <Users className="w-4 h-4" />
        {value}
      </span>
    );
  }
  
  return <span className={className}>{value}</span>;
}

