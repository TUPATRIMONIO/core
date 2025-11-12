'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileSignature,
  FileCheck,
  Building2,
  FileText,
  Scale,
  Home,
  TrendingUp,
  Briefcase,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Menu,
  ChevronDown,
  Globe,
  LogIn,
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigation } from './NavigationProvider';
import { ImagotipoImage } from '@tupatrimonio/assets';

interface NavItem {
  title: string;
  href: string;
  description?: string;
  icon?: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Configuración de menú
const serviciosItems: NavItem[] = [
  {
    title: 'Firmas Electrónicas',
    href: '/firmas-electronicas',
    description: 'Firma documentos con validez legal desde cualquier lugar',
    icon: FileSignature,
  },
  {
    title: 'Notaría Online',
    href: '/notaria-online',
    description: 'Trámites notariales 100% digitales sin filas ni esperas',
    icon: FileCheck,
  },
  {
    title: 'Modificaciones de Empresa',
    href: '/modificaciones-empresa',
    description: 'Actualiza tu empresa de forma rápida y legal',
    icon: Building2,
  },
  {
    title: 'Contrato de Arriendo',
    href: '/cl/contrato-de-arriendo-online',
    description: 'Crea contratos de arriendo listos para firmar',
    icon: FileText,
  },
];

const solucionesItems: NavItem[] = [
  {
    title: 'Legal Tech',
    href: '/legal-tech',
    description: 'Tecnología para simplificar tus procesos legales',
    icon: Scale,
  },
  {
    title: 'PropTech',
    href: '/proptech',
    description: 'Gestión completa de propiedades e inmuebles',
    icon: Home,
    badge: 'Próximamente',
  },
  {
    title: 'FinTech',
    href: '/fintech',
    description: 'Protección y organización de tu patrimonio financiero',
    icon: TrendingUp,
    badge: 'Próximamente',
  },
  {
    title: 'Business Hub',
    href: '/business-hub',
    description: 'Herramientas y formación para emprendedores',
    icon: Briefcase,
    badge: 'Próximamente',
  },
];

const recursosItems: NavItem[] = [
  {
    title: 'Blog',
    href: '/blog',
    description: 'Artículos y guías sobre trámites legales',
    icon: BookOpen,
  },
  {
    title: 'Base de Conocimiento',
    href: '/base-conocimiento',
    description: 'Recursos y documentación completa',
    icon: Lightbulb,
  },
  {
    title: 'Centro de Ayuda',
    href: '/ayuda',
    description: 'Encuentra respuestas a tus preguntas',
    icon: HelpCircle,
  },
];

const paises = [
  { code: 'cl', name: 'Chile', flag: '🇨🇱' },
  { code: 'ar', name: 'Argentina', flag: '🇦🇷' },
  { code: 'mx', name: 'México', flag: '🇲🇽' },
  { code: 'co', name: 'Colombia', flag: '🇨🇴' },
  { code: 'pe', name: 'Perú', flag: '🇵🇪' },
];

export function MainNavigation() {
  const { showNav } = useNavigation();
  const [isScrolled, setIsScrolled] = React.useState(false);

  // Detectar scroll para cambiar estilo del header
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!showNav) return null;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-md'
          : 'bg-background/80 backdrop-blur-sm border-b border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              {/* Desktop: Logo horizontal */}
              <div className="hidden lg:block">
                <ImagotipoImage variant="horizontal" width={144} height={40} priority />
              </div>
              {/* Mobile: Isotipo */}
              <div className="lg:hidden">
                <ImagotipoImage variant="isotipo" width={40} height={40} priority />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Servicios Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-quicksand">
                    Servicios
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[600px] gap-3 p-4 md:grid-cols-2">
                      {serviciosItems.map((item) => (
                        <ListItem
                          key={item.href}
                          title={item.title}
                          href={item.href}
                          icon={item.icon}
                        >
                          {item.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Soluciones Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-quicksand">
                    Soluciones
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[500px] gap-3 p-4 md:grid-cols-2">
                      {solucionesItems.map((item) => (
                        <ListItem
                          key={item.href}
                          title={item.title}
                          href={item.href}
                          icon={item.icon}
                          badge={item.badge}
                        >
                          {item.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Recursos Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-quicksand">
                    Recursos
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {recursosItems.map((item) => (
                        <ListItem
                          key={item.href}
                          title={item.title}
                          href={item.href}
                          icon={item.icon}
                        >
                          {item.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Nosotros - Link directo */}
                <NavigationMenuItem>
                  <Link href="/nosotros" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), 'font-quicksand')}>
                      Nosotros
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                {/* Precios - Link directo */}
                <NavigationMenuItem>
                  <Link href="/cl/precios" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), 'font-quicksand')}>
                      Precios
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side - Country Selector & CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Selector de País */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="font-quicksand gap-2">
                  <Globe className="w-4 h-4" />
                  País
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {paises.map((pais) => (
                  <DropdownMenuItem key={pais.code} asChild>
                    <Link
                      href={`/${pais.code}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-xl">{pais.flag}</span>
                      <span className="font-quicksand">{pais.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* CTAs */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="font-quicksand"
            >
              <a href="https://tupatrimon.io/ingresar/" target="_blank" rel="noopener noreferrer nofollow">
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {/* País Dropdown Mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {paises.map((pais) => (
                  <DropdownMenuItem key={pais.code} asChild>
                    <Link
                      href={`/${pais.code}`}
                      className="flex items-center gap-2"
                    >
                      <span className="text-lg">{pais.flag}</span>
                      <span className="font-quicksand">{pais.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Main Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                  <span className="sr-only">Menú</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px]">
                {/* Servicios */}
                <DropdownMenuLabel className="font-quicksand text-[var(--tp-brand)]">
                  Servicios
                </DropdownMenuLabel>
                {serviciosItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        {Icon && <Icon className="w-4 h-4 mr-2 text-[var(--tp-brand)]" />}
                        <span className="font-quicksand">{item.title}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                
                <DropdownMenuSeparator />
                
                {/* Soluciones */}
                <DropdownMenuLabel className="font-quicksand text-[var(--tp-brand)]">
                  Soluciones
                </DropdownMenuLabel>
                {solucionesItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        {Icon && <Icon className="w-4 h-4 mr-2 text-[var(--tp-brand)]" />}
                        <span className="font-quicksand">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                
                <DropdownMenuSeparator />
                
                {/* Recursos */}
                <DropdownMenuLabel className="font-quicksand text-[var(--tp-brand)]">
                  Recursos
                </DropdownMenuLabel>
                {recursosItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        {Icon && <Icon className="w-4 h-4 mr-2 text-[var(--tp-brand)]" />}
                        <span className="font-quicksand">{item.title}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                
                <DropdownMenuSeparator />
                
                {/* Enlaces directos */}
                <DropdownMenuItem asChild>
                  <Link href="/nosotros" className="font-quicksand cursor-pointer">
                    Nosotros
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cl/precios" className="font-quicksand cursor-pointer">
                    Precios
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Iniciar Sesión */}
                <DropdownMenuItem asChild>
                  <a 
                    href="https://tupatrimon.io/ingresar/" 
                    target="_blank" 
                    rel="noopener noreferrer nofollow"
                    className="font-quicksand cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

// Componente para items del menú desktop
interface ListItemProps extends React.ComponentPropsWithoutRef<'a'> {
  title: string;
  href: string;
  icon?: React.ElementType;
  badge?: string;
  children?: React.ReactNode;
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, href, icon: Icon, badge, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            href={href}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4 text-[var(--tp-brand)]" />}
              <div className="text-sm font-quicksand font-semibold leading-none">
                {title}
              </div>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            {children && (
              <p className="line-clamp-2 text-xs leading-snug text-muted-foreground mt-1">
                {children}
              </p>
            )}
          </Link>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = 'ListItem';

