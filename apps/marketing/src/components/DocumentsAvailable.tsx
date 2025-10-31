"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, ChevronDown, ChevronRight, Briefcase, FileText, 
  Scale, Award, Home, MoreHorizontal, Star, ExternalLink,
  Shield, GraduationCap, Building2, FileCheck, Clock, Users
} from "lucide-react";
import { Button } from "./ui/button";

// ============================================================================
// TIPOS DE DATOS
// ============================================================================

interface Document {
  name: string;
  link: string;
  popular?: boolean;
}

interface Subcategory {
  id: string;
  name: string;
  documents: Document[];
}

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  subcategories?: Subcategory[];
  documents?: Document[];
}

// ============================================================================
// DATOS DE DOCUMENTOS
// ============================================================================

const POPULAR_DOCUMENTS: Document[] = [
  { name: "Contrato de arriendo", popular: true },
  { name: "Declaración de residencia", popular: true },
  { name: "Declaración jurada simple", popular: true },
  { name: "Poder simple", popular: true },
  { name: "Declaración jurada de mudanza", popular: true },
  { name: "Promesa de compraventa", popular: true },
];

const DOCUMENTS_DATA: Category[] = [
  {
    id: "laboral",
    name: "Laboral",
    icon: Briefcase,
    documents: [
      { name: "Renuncia Voluntaria (DT y Carta Particular)" },
      { name: "Despido injustificado" },
      { name: "Término de contrato a plazo fijo" },
      { name: "Terminación de obra o faena" },
      { name: "Contrato de trabajo general" },
      { name: "Contrato a plazo fijo" },
      { name: "Contrato indefinido" },
      { name: "Contrato por obra o faena" },
      { name: "Contrato por proyecto" },
      { name: "Anexo de contrato de trabajo" },
      { name: "Contrato trabajador(a) casa particular" },
      { name: "Contrato trabajador extranjero" },
      { name: "Certificado de vigencia laboral" },
      { name: "Certificado de antigüedad laboral" },
      { name: "Certificado de relación laboral" },
      { name: "Carta de aviso término de contrato" },
      { name: "Carta de oferta de trabajo" },
      { name: "Comprobante de vacaciones" },
      { name: "Liquidación de sueldo" },
      { name: "Certificado de sueldos pensiones y/o honorarios" },
      { name: "Anexo de contrato para teletrabajo" },
      { name: "Actualización de datos PREVIRED" },
    ],
  },
  {
    id: "contratos",
    name: "Contratos",
    icon: FileText,
    subcategories: [
      {
        id: "arrendamiento",
        name: "Arrendamiento",
        documents: [
          { name: "Arrendamiento inmueble habitacional" },
          { name: "Arrendamiento inmueble comercial" },
          { name: "Subarrendamiento habitacional" },
          { name: "Subarrendamiento comercial" },
          { name: "Anexo de contrato de arrendamiento" },
          { name: "Permiso de subarrendamiento" },
          { name: "Cesión de arrendamiento" },
          { name: "Arrendamiento de estacionamiento" },
          { name: "Arrendamiento de vehículo motorizado" },
          { name: "Arrendamiento de maquinaria" },
          { name: "Término de contrato de arrendamiento" },
          { name: "Desahucio" },
          { name: "Reserva de arrendamiento" },
          { name: "Orden de arrendamiento" },
          { name: "Inventario de arrendamiento" },
          { name: "Devolución de propiedad arrendada" },
          { name: "Devolución de garantía de arriendo" },
        ],
      },
      {
        id: "compraventa",
        name: "Compraventa y Promesas",
        documents: [
          { name: "Promesa de compraventa de inmueble" },
          { name: "Promesa de compraventa de vehículo" },
          { name: "Anexo promesa de compraventa" },
          { name: "Reserva de compraventa" },
          { name: "Arrendamiento con promesa de compraventa" },
          { name: "Término de Promesa" },
          { name: "Compraventa de bienes muebles" },
          { name: "Compraventa de vehículo" },
          { name: "Compraventa de acciones" },
          { name: "Cesión de acciones" },
          { name: "Compraventa de patente comercial" },
          { name: "Cesión de patente comercial" },
          { name: "Carta de retracto" },
          { name: "Orden de venta" },
        ],
      },
      {
        id: "otros-contratos",
        name: "Otros Contratos",
        documents: [
          { name: "Comodato de bien mueble" },
          { name: "Comodato de inmueble" },
          { name: "Prestación de servicios profesionales" },
          { name: "Ejecución de obra material" },
          { name: "Usufructo de vehículos" },
          { name: "Mutuo de dinero" },
          { name: "Mutuo con intereses" },
          { name: "Convenio entre empresas" },
          { name: "Acuerdo de confidencialidad" },
          { name: "Reconocimiento de Deuda" },
          { name: "Recibo de dinero" },
          { name: "Pagaré" },
          { name: "Carta compromiso de pago" },
        ],
      },
    ],
  },
  {
    id: "legales",
    name: "Legales",
    icon: Scale,
    subcategories: [
      {
        id: "declaraciones-juradas",
        name: "Declaraciones Juradas",
        documents: [
          { name: "Declaración jurada de domicilio o residencia" },
          { name: "Declaración jurada simple o general" },
          { name: "Declaración jurada de soltería" },
          { name: "Declaración jurada personal de administración pública" },
          { name: "Declaración jurada inhabilidad para contratar en administración pública" },
          { name: "Declaración jurada de convivencia" },
          { name: "Declaración jurada no alteración de inmueble" },
          { name: "Declaración jurada de alcoholes" },
          { name: "Declaración jurada extravío de documentos personales" },
          { name: "Declaración jurada extravío de documentos de vehículo" },
          { name: "Declaración jurada extravío de licencia" },
          { name: "Declaración jurada de expensas" },
          { name: "Declaración jurada citación de juzgado" },
          { name: "Declaración jurada no integrante de partido político" },
          { name: "Declaración jurada renuncia a acciones legales y/o finiquito" },
          { name: "Declaración jurada de renta o ingresos" },
          { name: "Declaración jurada ingresos para fondo solidario de crédito universitario" },
          { name: "Declaración simple pensión de alimentos" },
          { name: "Declaración jurada de mudanza" },
        ],
      },
      {
        id: "poderes-mandatos",
        name: "Poderes y Mandatos",
        documents: [
          { name: "Mandato para trámites administrativos simples" },
          { name: "Mandato especial compraventa de vehículo" },
          { name: "Mandato retiro de documentos en oficinas público/privadas" },
          { name: "Mandato especial para SII" },
          { name: "Mandato especial para TGR" },
          { name: "Mandato administración de inmueble" },
          { name: "Mandato asamblea de copropietarios" },
          { name: "Mandato posesión efectiva en Registro Civil" },
          { name: "Revocación de mandato mercantil" },
          { name: "Mandato retiro de mercancía en aduana" },
          { name: "Mandato retiro de placa patente" },
          { name: "Poder para absolver posiciones (concursal)" },
          { name: "Carta poder votar en Junta de Cooperativas" },
          { name: "Poder general" },
          { name: "Poder simple" },
        ],
      },
      {
        id: "autorizaciones",
        name: "Autorizaciones",
        documents: [
          { name: "Autorización de uso de imagen (adultos)" },
          { name: "Autorización anulación de contrato (extranjería)" },
          { name: "Autorización mudanza en transporte terrestre" },
          { name: "Autorización trámites para TAG" },
          { name: "Autorización salida del país de vehículo (natural)" },
          { name: "Autorización salida del país de vehículo (jurídica)" },
          { name: "Autorización padre para tramitar licencia (menor de edad)" },
          { name: "Autorización uso de inmueble (otros fines)" },
          { name: "Autorización uso de inmueble (comerciales)" },
          { name: "Autorización de adosamiento" },
          { name: "Autorización de subarrendamiento" },
          { name: "Autorización cesión de derechos de autor o marca" },
          { name: "Autorización de viaje menor" },
        ],
      },
    ],
  },
  {
    id: "certificados",
    name: "Certificados",
    icon: Award,
    subcategories: [
      {
        id: "registro-civil",
        name: "Registro Civil",
        documents: [
          { name: "Cédula de identidad" },
          { name: "Certificado de nacimiento" },
          { name: "Certificado de nacimiento para fines judiciales" },
          { name: "Certificado de nacimiento para tramitación de herencia" },
          { name: "Certificado de matrimonio" },
          { name: "Certificado de matrimonio con vigencia" },
          { name: "Certificado de matrimonio para fines previsionales" },
          { name: "Certificado de defunción" },
          { name: "Certificado de defunción con vigencia" },
          { name: "Certificado de defunción para fines previsionales" },
          { name: "Certificado de no matrimonio o soltería" },
          { name: "Acta de cese de convivencia" },
          { name: "Certificado de situación militar" },
          { name: "Hoja de vida del conductor" },
        ],
      },
      {
        id: "institucionales",
        name: "Institucionales",
        documents: [
          { name: "Certificado de antecedentes para fines particulares" },
          { name: "Certificado de antecedentes para fines especiales" },
          { name: "Certificado de título profesional" },
          { name: "Certificado de capacitación" },
          { name: "Certificado de afiliación AFP" },
          { name: "Certificado de fecha de pago pensión" },
          { name: "Cartola Hogar" },
          { name: "Certificado inscripción Registro Nacional de Discapacidad" },
          { name: "Certificado de deuda fiscal" },
          { name: "Certificado de trabajo o relación laboral anterior" },
          { name: "Certificado de residencia" },
          { name: "Certificado de gastos comunes al día" },
        ],
      },
      {
        id: "empresariales",
        name: "Empresariales",
        documents: [
          { name: "Certificado estatuto actualizado" },
          { name: "Certificado vigencia de Sociedad" },
          { name: "Certificado de anotaciones" },
          { name: "Copia inscripción constitución" },
          { name: "Certificado vigencia de accionistas" },
          { name: "Certificado vigencia de acciones" },
          { name: "Certificado de personería" },
        ],
      },
    ],
  },
  {
    id: "inmobiliarios",
    name: "Inmobiliarios",
    icon: Home,
    documents: [
      { name: "Inscripción Registro de Propiedad" },
      { name: "Inscripción Registro de Hipotecas" },
      { name: "Inscripción Registro de Prohibiciones" },
      { name: "Cancelación de Hipotecas" },
      { name: "Alzamiento de Hipotecas" },
      { name: "Cancelación de Prohibiciones" },
      { name: "Alzamiento de Prohibiciones" },
      { name: "Carpeta Estudio de Títulos" },
      { name: "Certificado de gravámenes y prohibiciones" },
      { name: "Certificado de vigencia CBR" },
      { name: "Certificado de dominio vigente" },
      { name: "Certificado de deslindes" },
      { name: "Copia de inscripción con vigencia" },
      { name: "Copia de inscripción sin vigencia" },
      { name: "Inscripción Posesión Efectiva" },
      { name: "Archivo de Planos" },
      { name: "Copia de Planos" },
      { name: "Minuta de rectificación" },
    ],
  },
  {
    id: "mas",
    name: "Más",
    icon: MoreHorizontal,
    subcategories: [
      {
        id: "seguros",
        name: "Seguros",
        documents: [
          { name: "Seguro automotriz" },
          { name: "Seguro asistencia vial" },
          { name: "SOAP (Seguro Obligatorio de Accidentes Personales)" },
          { name: "Seguro Scooter" },
          { name: "Seguro Bicicleta" },
          { name: "Asistencia en viaje internacional" },
          { name: "Seguro de Hogar" },
          { name: "Seguro de Condominio" },
          { name: "Seguro de Vida" },
          { name: "Seguro Oncológico" },
          { name: "Seguro Hospitalario" },
          { name: "Seguro de Accidentes Personales" },
          { name: "Asesores previsionales" },
          { name: "Seguros para Empresas" },
        ],
      },
      {
        id: "educacion",
        name: "Educación",
        documents: [
          { name: "Certificado de encuesta de clases de religión" },
          { name: "Contrato de prestación de servicios educacionales escolares" },
          { name: "Comprobante de recepción de reglamento interno y PEI" },
          { name: "Matrícula escolar" },
          { name: "Matrícula universitaria" },
          { name: "Certificado de matrícula escolar" },
        ],
      },
      {
        id: "societarios",
        name: "Societarios",
        documents: [
          { name: "Compraventa de acciones societarias" },
          { name: "Cesión de acciones societarias" },
          { name: "Acta de sesión de directorio" },
          { name: "Acta de junta extraordinaria" },
          { name: "Acuerdo de accionistas" },
          { name: "Migración de régimen societario" },
          { name: "Acta asamblea Club de Fútbol" },
        ],
      },
      {
        id: "regulatorios",
        name: "Administrativos y Regulatorios",
        documents: [
          { name: "Permiso alteración viviendas económicas" },
          { name: "Concesión servicio público gas" },
          { name: "Resoluciones DGA (Dirección General de Aguas)" },
          { name: "Resoluciones SEC (concesión eléctrica)" },
          { name: "Decretos Ministerio de Energía" },
          { name: "Documentos probatorios ingreso Administración del Estado" },
          { name: "Certificado asociación deportiva profesional" },
          { name: "Trámites Código de Aguas" },
          { name: "Poder suplente Agente de Aduanas" },
        ],
      },
      {
        id: "otros",
        name: "Otros Documentos",
        documents: [
          { name: "Carta de invitación para extranjeros" },
          { name: "Bases de sorteo" },
          { name: "Carta de resguardo" },
          { name: "Carta de interés de propiedad" },
          { name: "Carta de oferta de propiedad" },
        ],
      },
    ],
  },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface DocumentsAvailableProps {
  baseLink?: string;
  showSearch?: boolean;
  showPopular?: boolean;
}

export default function DocumentsAvailable({
  baseLink = "https://tupatrimon.io/legalizacion-de-documentos-electronicos/",
  showSearch = true,
  showPopular = true,
}: DocumentsAvailableProps) {
  const [activeTab, setActiveTab] = useState<string>("laboral");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // Toggle subcategoría expandida
  const toggleSubcategory = (subcategoryId: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  // Filtrar documentos por búsqueda (en todas las categorías)
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return DOCUMENTS_DATA;

    const query = searchQuery.toLowerCase();
    return DOCUMENTS_DATA.map(category => {
      if (category.subcategories) {
        const filteredSubcategories = category.subcategories
          .map(subcat => ({
            ...subcat,
            documents: subcat.documents.filter(doc =>
              doc.name.toLowerCase().includes(query)
            ),
          }))
          .filter(subcat => subcat.documents.length > 0);

        return {
          ...category,
          subcategories: filteredSubcategories,
        };
      } else if (category.documents) {
        return {
          ...category,
          documents: category.documents.filter(doc =>
            doc.name.toLowerCase().includes(query)
          ),
        };
      }
      return category;
    }).filter(category => {
      if (category.subcategories) {
        return category.subcategories.length > 0;
      }
      return category.documents && category.documents.length > 0;
    });
  }, [searchQuery]);

  // Determinar qué categorías mostrar
  const displayCategories = searchQuery 
    ? filteredData // Mostrar todas las categorías con resultados cuando hay búsqueda
    : DOCUMENTS_DATA.filter(cat => cat.id === activeTab); // Solo mostrar categoría activa sin búsqueda

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Documentos Notariales Online Disponibles
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Más del 90% de documentos legales con validez en todo Chile
          </p>
        </div>

        {/* Barra de búsqueda */}
        {showSearch && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documento... Ej: finiquito, arriendo, CBR"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-[var(--tp-brand)] focus:outline-none transition-colors"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Mostrando resultados en todas las categorías
              </p>
            )}
          </div>
        )}

        {/* Sección Más Solicitados */}
        {showPopular && !searchQuery && (
          <div className="mb-12">
            <div className="bg-gradient-to-br from-[var(--tp-brand-5)] to-white rounded-2xl p-8 border-2 border-[var(--tp-brand-20)]">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-7 h-7 text-[var(--tp-brand)] fill-[var(--tp-brand)]" />
                <h3 className="text-2xl font-bold text-gray-900">Más Solicitados</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {POPULAR_DOCUMENTS.map((doc, index) => (
                  <a
                    key={index}
                    href={baseLink}
                    rel="noopener noreferrer nofollow"
                    className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileCheck className="w-5 h-5 text-[var(--tp-brand)] flex-shrink-0" />
                      <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[var(--tp-brand)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sistema de Tabs - Solo visible cuando NO hay búsqueda */}
        {!searchQuery && (
          <div className="mb-8">
            {/* Desktop: Tabs horizontales */}
            <div className="hidden md:flex gap-2 border-b border-gray-200 overflow-x-auto">
              {DOCUMENTS_DATA.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                      activeTab === category.id
                        ? "text-[var(--tp-brand)] border-b-2 border-[var(--tp-brand)] -mb-[2px]"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {category.name}
                  </button>
                );
              })}
            </div>

            {/* Mobile: Dropdown */}
            <div className="md:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-200 rounded-lg focus:border-[var(--tp-brand)] focus:outline-none"
              >
                {DOCUMENTS_DATA.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Contenido: Resultados de búsqueda o categoría activa */}
        {displayCategories.length > 0 ? (
          <div className="space-y-8">
            {displayCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id}>
                  {/* Mostrar título de categoría solo cuando hay búsqueda */}
                  {searchQuery && (
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[var(--tp-brand-20)]">
                      <Icon className="w-6 h-6 text-[var(--tp-brand)]" />
                      <h3 className="text-2xl font-bold text-gray-900">{category.name}</h3>
                    </div>
                  )}
                  
                  {/* Si tiene subcategorías */}
                  {category.subcategories && (
                    <div className="space-y-4">
                      {category.subcategories.map((subcategory) => {
                        const isExpanded = expandedSubcategories.has(subcategory.id);
                        return (
                          <div
                            key={subcategory.id}
                            className="border-2 border-gray-200 rounded-xl overflow-hidden"
                          >
                            {/* Header de subcategoría */}
                            <button
                              onClick={() => toggleSubcategory(subcategory.id)}
                              className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-[var(--tp-brand)]" />
                                <h4 className="text-lg font-bold text-gray-900">
                                  {subcategory.name}
                                </h4>
                                <span className="text-sm text-gray-500">
                                  ({subcategory.documents.length} documentos)
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                              )}
                            </button>

                            {/* Lista de documentos */}
                            {isExpanded && (
                              <div className="p-5 bg-white">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {subcategory.documents.map((doc, index) => (
                                    <a
                                      key={index}
                                      href={baseLink}
                                      rel="noopener noreferrer nofollow"
                                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[var(--tp-brand)] hover:shadow-md transition-all group"
                                    >
                                      <p className="text-sm text-gray-800 flex-1">
                                        {doc.name}
                                      </p>
                                      <ExternalLink className="w-4 h-4 text-[var(--tp-brand)] opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Si tiene documentos directos (sin subcategorías) */}
                  {category.documents && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={baseLink}
                          rel="noopener noreferrer nofollow"
                          className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-[var(--tp-brand)] hover:shadow-md transition-all group"
                        >
                          <p className="text-sm text-gray-800 flex-1">{doc.name}</p>
                          <ExternalLink className="w-4 h-4 text-[var(--tp-brand)] opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Mensaje cuando no hay resultados de búsqueda */
          searchQuery && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No se encontraron documentos para "{searchQuery}"
              </p>
            </div>
          )
        )}

        {/* CTA Final */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-[var(--tp-brand-5)] to-transparent rounded-2xl p-8 border border-[var(--tp-brand-20)]">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿No encuentras el documento que necesitas?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Contáctanos y te ayudaremos a encontrar la solución perfecta para tu trámite legal
            </p>
            <Button
              asChild
              className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-8 py-6 text-lg rounded-xl"
            >
              <a href="/contacto" rel="noopener noreferrer">
                Hablar con un asesor
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
