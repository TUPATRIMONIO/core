import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import { ShieldCheck } from "lucide-react";

interface RefundScenario {
  title: string;
  description: string;
  details?: string[];
}

const refundScenarios: RefundScenario[] = [
  {
    title: "A) Pedido aún en proceso de firmas",
    description: "Monto total del pedido menos el valor lista de las firmas realizadas.",
  },
  {
    title: "B) Luego de observación de notaría para documentos factible de ser procesados",
    description: "Tienes dos opciones:",
    details: [
      "1) Podrás corregir el documento según las indicaciones de notaría sin costo, salvo la inclusión de nuevos firmantes.",
      "2) Podrás solicitar la anulación del pedido con reembolso del servicio notarial, si no deseas continuar con las correcciones.",
    ]
  },
  {
    title: "C) Rechazo definitivo de notaría para documentos no factible de ser procesados",
    description: "Reembolso total a modo de cortesía.",
  },
];

export default function RefundPolicy() {
  return (
    <Card className="border-2 border-[var(--tp-brand)] shadow-2xl overflow-hidden bg-card">
      <CardHeader className="text-center pt-10 pb-8 border-b border-border">
        <div className="mb-4">
          <IconContainer 
            icon={ShieldCheck} 
            variant="brand" 
            shape="circle" 
            size="md"
            className="mx-auto"
          />
        </div>
        <h3 className="mb-3">Política de Reembolsos</h3>
        <p className="text-muted-foreground">
          Tu tranquilidad es nuestra prioridad. Reembolsos según el estado de tu pedido.
        </p>
      </CardHeader>

      <CardContent className="p-8 md:p-10">
        <div className="space-y-4">
          {refundScenarios.map((scenario, index) => (
            <div 
              key={index}
              className="p-6 bg-background dark:bg-muted/20 rounded-xl border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-lg transition-all"
            >
              <h4 className="font-semibold text-foreground mb-2">
                {scenario.title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                {scenario.description}
              </p>
              {scenario.details && (
                <ul className="space-y-1.5 mt-3 ml-4">
                  {scenario.details.map((detail, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground leading-relaxed">
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="mt-6 flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-xl border-2 border-green-200 dark:border-green-800">
            <Icon icon={ShieldCheck} size="md" className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-green-700 dark:text-green-300 mb-1">Plazo de reembolso</h5>
              <p className="text-sm text-green-600 dark:text-green-400">
                Puedes solicitar reembolso dentro de los 30 días desde la compra si el pedido no está finalizado.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

