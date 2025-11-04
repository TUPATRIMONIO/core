import React from "react";

export interface ComparisonRow {
  aspect: string;
  emoji: string;
  online: {
    value: string;
    description: string;
    highlight?: boolean;
  };
  physical: {
    value: string;
    description: string;
  };
}

export interface ComparisonTableSectionProps {
  title: string;
  description: string;
  rows: ComparisonRow[];
  ctaText: string;
  ctaDescription: string;
  ctaHref: string;
}

export default function ComparisonTableSection({
  title,
  description,
  rows,
  ctaText,
  ctaDescription,
  ctaHref,
}: ComparisonTableSectionProps) {
  return (
    <section id="beneficios" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        {/* Tabla de comparación de beneficios */}
        <div className="overflow-x-auto mb-12">
          <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[var(--tp-brand)]">
                <th className="px-6 py-4 text-left text-white font-bold text-lg">Aspecto</th>
                <th className="px-6 py-4 text-center text-white font-bold text-lg">Notaría Online<br />(TuPatrimonio)</th>
                <th className="px-6 py-4 text-center text-white font-bold text-lg">Notaría Física<br />(Tradicional)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className={`${index < rows.length - 1 ? 'border-b' : ''} hover:bg-gray-50 transition-colors`}>
                  <td className="px-6 py-4 font-medium text-gray-900">{row.emoji} {row.aspect}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xl font-bold ${row.online.highlight ? 'text-green-600' : 'text-gray-900'}`}>
                      {row.online.value}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{row.online.description}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xl font-medium text-gray-600">{row.physical.value}</span>
                    <p className="text-sm text-gray-500 mt-1">{row.physical.description}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Llamado a la acción después de la tabla */}
        <div className="text-center mt-12 p-8 bg-gradient-to-r from-[var(--tp-brand-light)] to-[var(--tp-brand)] rounded-2xl">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {ctaText}
          </h3>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            {ctaDescription}
          </p>
          <a 
            href={ctaHref}
            rel="noopener noreferrer nofollow"
            className="inline-block bg-white text-[var(--tp-brand)] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Comenzar Ahora
          </a>
        </div>
      </div>
    </section>
  );
}

