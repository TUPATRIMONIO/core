import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Icon } from "@tupatrimonio/ui";
import { CheckCircle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignatureData {
  type: string;
  price: number;
  security: string;
  countries: string;
  claveUnica: boolean;
  biometry: boolean;
  speed: string;
}

const signatures: SignatureData[] = [
  { 
    type: 'FES', 
    price: 6990, 
    security: 'Alta', 
    countries: 'Todos', 
    claveUnica: false, 
    biometry: false, 
    speed: '1 minuto' 
  },
  { 
    type: 'FESB', 
    price: 7990, 
    security: 'Muy Alta', 
    countries: 'Todos', 
    claveUnica: false, 
    biometry: true, 
    speed: '1 minuto' 
  },
  { 
    type: 'FES Clave Única', 
    price: 7990, 
    security: 'Muy Alta', 
    countries: 'Chile', 
    claveUnica: true, 
    biometry: false, 
    speed: '1 minuto' 
  },
  { 
    type: 'FEA', 
    price: 8990, 
    security: 'Más Alta', 
    countries: 'Chile', 
    claveUnica: true, 
    biometry: false, 
    speed: '5 minutos' 
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

export default function SignatureComparisonTable() {
  return (
    <div className="w-full">
      <div className="text-center mb-12">
        <h2 className="mb-4">
          Tipos de Firma Electrónica
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Conoce las diferencias entre cada opción y elige la que mejor se adapte a tus necesidades
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full border-collapse bg-card shadow-2xl rounded-2xl overflow-hidden border-2 border-border">
          <TableHeader>
            <TableRow className="bg-[var(--tp-brand)]">
              <TableHead className="text-white font-semibold text-sm md:text-base px-6 py-5">
                Característica
              </TableHead>
              {signatures.map((sig) => (
                <TableHead 
                  key={sig.type} 
                  className="text-white font-semibold text-sm md:text-base text-center px-6 py-5 min-w-[140px]"
                >
                  {sig.type}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Fila de Precio */}
            <TableRow className="bg-background hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold px-6 py-5">Precio por firma</TableCell>
              {signatures.map((sig) => (
                <TableCell key={sig.type} className="text-center px-6 py-5">
                  <span className="text-xl font-bold text-[var(--tp-brand)]">
                    {formatPrice(sig.price)}
                  </span>
                </TableCell>
              ))}
            </TableRow>

            {/* Fila de Seguridad */}
            <TableRow className="bg-card hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold px-6 py-5">Seguridad</TableCell>
              {signatures.map((sig) => (
                <TableCell key={sig.type} className="text-center px-6 py-5">
                  <span className="text-sm font-medium">{sig.security}</span>
                </TableCell>
              ))}
            </TableRow>

            {/* Fila de Países */}
            <TableRow className="bg-background hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold px-6 py-5">Países</TableCell>
              {signatures.map((sig) => (
                <TableCell key={sig.type} className="text-center px-6 py-5">
                  <span className="text-sm">{sig.countries}</span>
                </TableCell>
              ))}
            </TableRow>

            {/* Fila de Clave Única */}
            <TableRow className="bg-card hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold px-6 py-5">Clave Única</TableCell>
              {signatures.map((sig) => (
                <TableCell key={sig.type} className="text-center px-6 py-5">
                  <div className="flex justify-center">
                    {sig.claveUnica ? (
                      <Icon icon={CheckCircle} size="md" className="text-green-600 dark:text-green-400" />
                    ) : (
                      <Icon icon={X} size="md" className="text-gray-400 dark:text-gray-600" />
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Fila de Biometría */}
            <TableRow className="bg-background hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold px-6 py-5">Biometría Facial</TableCell>
              {signatures.map((sig) => (
                <TableCell key={sig.type} className="text-center px-6 py-5">
                  <div className="flex justify-center">
                    {sig.biometry ? (
                      <Icon icon={CheckCircle} size="md" className="text-green-600 dark:text-green-400" />
                    ) : (
                      <Icon icon={X} size="md" className="text-gray-400 dark:text-gray-600" />
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Fila de Velocidad */}
            <TableRow className="bg-card hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold px-6 py-5">Velocidad aprox.</TableCell>
              {signatures.map((sig) => (
                <TableCell key={sig.type} className="text-center px-6 py-5">
                  <span className="text-sm">{sig.speed}</span>
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
            Elegir mi Firma Electrónica
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </a>
      </div>
    </div>
  );
}

