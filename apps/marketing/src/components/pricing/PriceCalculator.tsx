"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { IconContainer } from "@tupatrimonio/ui";
import { Calculator, ArrowRight } from "lucide-react";

interface SignatureType {
  id: string;
  name: string;
  price: number;
}

interface NotarialService {
  id: string;
  name: string;
  price: number;
}

const signatureTypes: SignatureType[] = [
  { id: "fes", name: "Firma Electrónica Simple (FES)", price: 6990 },
  { id: "fesb", name: "Firma Electrónica Simple Biométrica (FESB)", price: 7990 },
  { id: "fes-clave", name: "Firma Electrónica Simple (Clave Única)", price: 7990 },
  { id: "fea", name: "Firma Electrónica Avanzada (FEA)", price: 8990 },
];

const notarialServices: NotarialService[] = [
  { id: "none", name: "Sin servicio notarial, solo firma electrónica", price: 0 },
  { id: "copia", name: "Copia certificada", price: 8990 },
  { id: "protocolizacion", name: "Protocolización", price: 15990 },
  { id: "fan", name: "Firma Autorizada por Notario (FAN)", price: 9990 },
];

export default function PriceCalculator() {
  const [signatureType, setSignatureType] = useState<string>("");
  const [notarialService, setNotarialService] = useState<string>("");
  const [signers, setSigners] = useState<string>("1");
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Filtrar tipos de firma según servicio notarial
  const availableSignatures = notarialService === "fan" 
    ? signatureTypes.filter(s => s.id === "fes-clave")
    : signatureTypes;

  // Auto-seleccionar FES Clave Única cuando se elige FAN
  useEffect(() => {
    if (notarialService === "fan" && signatureType !== "fes-clave") {
      setSignatureType("fes-clave");
    }
  }, [notarialService, signatureType]);

  useEffect(() => {
    if (signatureType && notarialService && signers) {
      const signature = signatureTypes.find(s => s.id === signatureType);
      const notarial = notarialServices.find(n => n.id === notarialService);
      const numSigners = parseInt(signers);

      if (signature && notarial) {
        let signatureTotal = signature.price * numSigners;
        
        // FAN incluye el costo de la firma por cada firmante
        let notarialTotal = notarial.price;
        if (notarialService === "fan") {
          notarialTotal = notarial.price * numSigners;
        }
        
        setTotalPrice(signatureTotal + notarialTotal);
      }
    } else {
      setTotalPrice(0);
    }
  }, [signatureType, notarialService, signers]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="border-2 border-[var(--tp-brand)] shadow-2xl overflow-hidden bg-card">
      <CardHeader className="text-center pt-10 pb-8 border-b border-border">
        <div className="mb-4">
          <IconContainer 
            icon={Calculator} 
            variant="brand" 
            shape="circle" 
            size="md"
            className="mx-auto"
          />
        </div>
        <h3 className="mb-3">Calculadora de Precio</h3>
        <p className="text-muted-foreground">
          Descubre cuánto cuesta tu trámite en segundos
        </p>
      </CardHeader>

      <CardContent className="p-8 md:p-10">
        <div className="space-y-6 max-w-2xl mx-auto">
        {/* Selector de Servicio Notarial */}
        <div className="space-y-2">
          <Label htmlFor="notarial-service" className="text-sm font-semibold text-foreground">
            Servicio notarial
          </Label>
          <Select value={notarialService} onValueChange={setNotarialService}>
            <SelectTrigger id="notarial-service" className="w-full">
              <SelectValue placeholder="Selecciona un servicio" />
            </SelectTrigger>
            <SelectContent>
              {notarialServices.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de Tipo de Firma */}
        <div className="space-y-2">
          <Label htmlFor="signature-type" className="text-sm font-semibold text-foreground">
            Tipo de firma electrónica
          </Label>
          <Select value={signatureType} onValueChange={setSignatureType}>
            <SelectTrigger id="signature-type" className="w-full">
              <SelectValue placeholder="Selecciona un tipo de firma" />
            </SelectTrigger>
            <SelectContent>
              {availableSignatures.map((sig) => (
                <SelectItem key={sig.id} value={sig.id}>
                  {sig.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {notarialService === "fan" && (
            <p className="text-xs text-muted-foreground mt-1">
              ℹ️ FAN solo es compatible con Firma Electrónica Simple con Clave Única
            </p>
          )}
        </div>

        {/* Selector de Número de Firmantes */}
        <div className="space-y-2">
          <Label htmlFor="signers" className="text-sm font-semibold text-foreground">
            Número de firmantes
          </Label>
          <Select value={signers} onValueChange={setSigners}>
            <SelectTrigger id="signers" className="w-full">
              <SelectValue placeholder="Selecciona cantidad" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? 'firmante' : 'firmantes'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Total */}
        <div className="mt-8 pt-8 border-t-2 border-border">
          <div className="bg-[var(--tp-background-light)] dark:bg-muted/20 rounded-2xl p-6 mb-6 text-center border border-border">
            <div className="mb-2">
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Total del servicio</span>
            </div>
            <div className="text-5xl font-bold text-[var(--tp-brand)]">
              {formatPrice(totalPrice)}
            </div>
          </div>

          {totalPrice > 0 ? (
            <a href="https://tupatrimon.io/legalizacion-de-documentos-electronicos/" rel="noopener noreferrer nofollow">
              <Button 
                size="lg"
                className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-7 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
              >
                Continuar con mi trámite
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          ) : (
            <Button 
              size="lg"
              className="w-full bg-muted text-muted-foreground px-10 py-7 text-lg font-bold cursor-not-allowed"
              disabled
            >
              Selecciona tus opciones
            </Button>
          )}
        </div>
        </div>
      </CardContent>
    </Card>
  );
}

