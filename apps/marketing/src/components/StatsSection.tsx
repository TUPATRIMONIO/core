import { Icon } from '@tupatrimonio/ui';
import { Users, FileCheck, Zap, Clock, TrendingDown } from 'lucide-react';
import { USERS_COUNT } from '@/lib/constants';

/**
 * Variantes predefinidas de estadísticas
 */
export type StatsVariant = 'default' | 'nosotros' | 'notaria' | 'firmas';

interface StatsSectionProps {
  /**
   * Variante predefinida de estadísticas a mostrar.
   * - 'default': Para home y páginas genéricas
   * - 'nosotros': Para página sobre nosotros
   * - 'notaria': Para landing de notaría online
   * - 'firmas': Para landing de firmas electrónicas
   */
  variant?: StatsVariant;
  /**
   * Clases CSS adicionales para la sección
   */
  className?: string;
}

/**
 * Configuración de estadísticas por variante
 */
const STATS_CONFIG = {
  default: {
    title: "Números que Hablan por Nosotros",
    description: "Miles de personas y empresas ya confían en TuPatrimonio para lo que más les importa",
    stats: [
        {
          icon: Users,
          value: USERS_COUNT.shortUpper,
          label: "Usuarios Confían en Nosotros",
          description: "Desde personas hasta grandes empresas"
        },
        {
          icon: FileCheck,
          value: "+60K",
          label: "Documentos Firmados",
          description: "Con validez legal garantizada"
        },
        {
          icon: Zap,
          value: "En Minutos",
          label: "Lo que Antes Tomaba Días",
          description: "Rapidez sin sacrificar seguridad"
        }
      ]
  },
  nosotros: {
    title: "Números que Hablan por Nosotros",
    description: "Miles de personas y empresas ya confían en nosotros para lo que más les importa",
    stats: [
      {
        icon: Users,
        value: USERS_COUNT.shortUpper,
        label: "Usuarios Confían en Nosotros",
        description: "Desde personas hasta grandes empresas"
      },
      {
        icon: FileCheck,
        value: "+60K",
        label: "Documentos Firmados",
        description: "Con validez legal garantizada"
      },
      {
        icon: Zap,
        value: "En Minutos",
        label: "Lo que Antes Tomaba Días",
        description: "Rapidez sin sacrificar seguridad"
      }
    ]
  },
  notaria: {
    title: "Números que Hablan por Nosotros",
    description: "Miles de personas y empresas ya confían en TuPatrimonio para sus trámites notariales",
    stats: [
        {
          icon: Users,
          value: USERS_COUNT.shortUpper,
          label: "Usuarios Confían en Nosotros",
          description: "Desde personas hasta grandes empresas"
        },
        {
          icon: FileCheck,
          value: "+60K",
          label: "Documentos Firmados",
          description: "Con validez legal garantizada"
        },
        {
          icon: Zap,
          value: "En Minutos",
          label: "Lo que Antes Tomaba Días",
          description: "Rapidez sin sacrificar seguridad"
        }
      ]
  },
  firmas: {
    title: "Números que Hablan por Nosotros",
    description: "Miles de personas y empresas ya confían en TuPatrimonio para sus firmas electrónicas",
    stats: [
        {
          icon: Users,
          value: USERS_COUNT.shortUpper,
          label: "Usuarios Confían en Nosotros",
          description: "Desde personas hasta grandes empresas"
        },
        {
          icon: FileCheck,
          value: "+60K",
          label: "Documentos Firmados",
          description: "Con validez legal garantizada"
        },
        {
          icon: Zap,
          value: "En Minutos",
          label: "Lo que Antes Tomaba Días",
          description: "Rapidez sin sacrificar seguridad"
        }
      ]
  }
};

/**
 * Componente reutilizable para mostrar secciones de estadísticas
 * con contenido predefinido según la variante.
 * 
 * @example
 * ```tsx
 * // Uso básico con variante default
 * <StatsSection />
 * 
 * // Uso con variante específica
 * <StatsSection variant="notaria" />
 * <StatsSection variant="nosotros" />
 * <StatsSection variant="firmas" />
 * ```
 */
export function StatsSection({
  variant = 'default',
  className = ""
}: StatsSectionProps) {
  const config = STATS_CONFIG[variant];
  
  return (
    <section className={`py-20 bg-gradient-to-br from-[var(--tp-brand)] to-[var(--tp-brand-light)] text-white ${className}`}>
      <div className="max-w-7xl tp-container">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-white mb-6">
            {config.title}
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {config.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-12">
          {config.stats.map((stat, index) => (
            <div key={index} className="text-center">
              {/* Icon Container */}
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon={stat.icon} size="xl" variant="white" />
              </div>
              
              {/* Value */}
              <div className="text-5xl md:text-6xl font-bold mb-3">
                {stat.value}
              </div>
              
              {/* Label */}
              <div className="text-xl text-white/90">
                {stat.label}
              </div>
              
              {/* Description */}
              <p className="text-white/70 mt-2">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

