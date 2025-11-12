import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Icon } from "@tupatrimonio/ui";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotarialServiceData {
  name: string;
  price: number;
  remote: boolean;
  purpose: string;
  docs: string;
}

const notarialServices: NotarialServiceData[] = [
  { 
    name: 'Copia Certificada', 
    price: 8990, 
    remote: true, 
    purpose: 'Asegurar que una copia sea fiel al original', 
    docs: 'Documento que se firmará' 
  },
  { 
    name: 'Protocolización', 
    price: 15990, 
    remote: true, 
    purpose: 'Dar formalidad legal a documentos privados', 
    docs: 'Documento que se firmará' 
  },
  { 
    name: 'FAN', 
    price: 9990, 
    remote: true, 
    purpose: 'Certificar que la firma es auténtica y corresponde al firmante', 
    docs: 'Documento que se firmará y eventualmente adicionales' 
  },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export default function NotarialServicesTable() {
  return (
    <div className="w-full">
      <div className="text-center mb-12">
        <h2 className="mb-4">
          Servicios Notariales
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Validez legal completa con notarías chilenas certificadas. Todo 100% remoto.
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full border-collapse bg-card shadow-2xl rounded-2xl overflow-hidden border-2 border-border">
          <TableHeader>
            <TableRow className="bg-[var(--tp-brand)]">
              <TableHead className="text-white font-semibold text-sm md:text-base px-6 py-5">
                Característica
              </TableHead>
              {notarialServices.map((service) => (
                <TableHead 
                  key={service.name} 
                  className="text-white font-semibold text-sm md:text-base text-center px-6 py-5 min-w-[180px]"
                >
                  {service.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Fila de Precio */}
            <TableRow className="bg-background hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold px-6 py-5">Precio</TableCell>
              {notarialServices.map((service) => (
                <TableCell key={service.name} className="text-center px-6 py-5">
                  <span className="text-xl font-bold text-[var(--tp-brand)]">
                    {formatPrice(service.price)}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">por documento</p>
                </TableCell>
              ))}
            </TableRow>

            {/* Fila de Trámite Remoto */}
            <TableRow className="bg-card hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold px-6 py-5">Trámite Remoto</TableCell>
              {notarialServices.map((service) => (
                <TableCell key={service.name} className="text-center px-6 py-5">
                  <div className="flex justify-center">
                    {service.remote && (
                      <Icon icon={CheckCircle} size="md" className="text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Fila de Propósito */}
            <TableRow className="bg-background hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold px-6 py-5">Para qué sirve</TableCell>
              {notarialServices.map((service) => (
                <TableCell key={service.name} className="text-center px-6 py-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.purpose}</p>
                </TableCell>
              ))}
            </TableRow>

            {/* Fila de Documentos Requeridos */}
            <TableRow className="bg-card hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold px-6 py-5">Documentos</TableCell>
              {notarialServices.map((service) => (
                <TableCell key={service.name} className="text-center px-6 py-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.docs}</p>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="text-center mt-10">
        <a href="https://tupatrimon.io/legalizacion-de-documentos-electronicos/" rel="noopener noreferrer nofollow">
          <Button 
            size="lg"
            className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Solicitar Servicio Notarial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </a>
      </div>
    </div>
  );
}

