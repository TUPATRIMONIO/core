/**
 * Cliente API de Haulmer (OpenFactura) para facturación electrónica chilena
 * 
 * Documentación: https://docsapi-openfactura.haulmer.com/
 * 
 * Este cliente emite DTEs (Documentos Tributarios Electrónicos) como:
 * - Factura Electrónica (TipoDTE: 33)
 * - Boleta Electrónica (TipoDTE: 39)
 * - Nota de Crédito Electrónica (TipoDTE: 61)
 */

// URLs según ambiente
const HAULMER_URLS = {
  production: 'https://api.haulmer.com',
  sandbox: 'https://dev-api.haulmer.com',
} as const;

const HAULMER_ENVIRONMENT = (process.env.HAULMER_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
const HAULMER_API_URL = process.env.HAULMER_API_URL || HAULMER_URLS[HAULMER_ENVIRONMENT];
const HAULMER_API_KEY = process.env.HAULMER_API_KEY || '';

// Datos del emisor (TuPatrimonio) - valores por defecto desde Make blueprint
// Estos valores se pueden sobrescribir con variables de entorno
const HAULMER_EMISOR = {
  RUTEmisor: process.env.HAULMER_EMISOR_RUT || '77028682-4',
  RznSoc: process.env.HAULMER_EMISOR_RAZON_SOCIAL || 'TU PATRIMONIO ASESORIAS SPA',
  GiroEmis: process.env.HAULMER_EMISOR_GIRO || 'SERV DIGITALES, INMOBILIARIOS, FINANCIEROS, COMERCIALIZACION VEHICULO',
  Acteco: parseInt(process.env.HAULMER_EMISOR_ACTECO || '620900'),
  DirOrigen: process.env.HAULMER_EMISOR_DIRECCION || 'AV. PROVIDENCIA 1208, OF 207',
  CmnaOrigen: process.env.HAULMER_EMISOR_COMUNA || 'Providencia',
  CdgSIISucur: process.env.HAULMER_EMISOR_SUCURSAL || '83413793',
  Telefono: process.env.HAULMER_EMISOR_TELEFONO || '+56949166719',
};

// Tipos de DTE soportados
export const TipoDTE = {
  FACTURA_ELECTRONICA: 33,
  FACTURA_EXENTA: 34,
  BOLETA_ELECTRONICA: 39,
  BOLETA_EXENTA: 41,
  NOTA_CREDITO: 61,
  NOTA_DEBITO: 56,
} as const;

// Interfaces para la API de Haulmer
export interface HaulmerEmisor {
  RUTEmisor: string;
  RznSoc: string;
  GiroEmis: string;
  Acteco: number;
  DirOrigen: string;
  CmnaOrigen: string;
  CdgSIISucur?: string;
  CorreoEmisor?: string;
  Telefono?: string;
  [key: string]: string | number | undefined;
}

export interface HaulmerReceptor {
  RUTRecep: string;
  RznSocRecep: string;
  GiroRecep: string;
  DirRecep: string;
  CmnaRecep: string;
  Contacto?: string;
  CorreoRecep?: string;
}

export interface HaulmerDetalle {
  NroLinDet: number;
  NmbItem: string;
  DscItem?: string;
  QtyItem: number;
  PrcItem: number;
  MontoItem: number;
  IndExe?: number; // 1 si es exento
}

export interface HaulmerTotales {
  MntNeto?: number;
  MntExe?: number;
  TasaIVA?: string;
  IVA?: number;
  MntTotal: number;
  MontoPeriodo?: number; // Igual a MntTotal para facturas
  VlrPagar?: number; // Valor a pagar, igual a MntTotal
}

export interface HaulmerDTE {
  Encabezado: {
    IdDoc: {
      TipoDTE: number;
      Folio: number; // Siempre 0, Haulmer asigna el folio
      FchEmis: string; // YYYY-MM-DD
      TpoTranCompra?: string; // Tipo transacción compra (1: del giro)
      TpoTranVenta?: string; // Tipo transacción venta (1: del giro)
      FmaPago?: number; // 1: Contado, 2: Crédito, 3: Sin costo
    };
    Emisor: HaulmerEmisor;
    Receptor: HaulmerReceptor;
    Totales: HaulmerTotales;
  };
  Detalle: HaulmerDetalle[];
}

export interface HaulmerEmitirRequest {
  response: string[]; // ['PDF', 'XML', 'FOLIO', 'TIMBRE']
  dte: HaulmerDTE;
  sendEmail?: {
    to: string;
    CC?: string;
    BCC?: string;
  };
}

export interface HaulmerEmitirResponse {
  TOKEN: string;
  FOLIO?: number;
  PDF?: string; // Base64
  XML?: string; // Base64
  TIMBRE?: string; // Base64
  LOGO?: string; // Base64
  RESOLUCION?: {
    fecha: string;
    numero: number;
  };
  WARNING?: string;
}

export interface HaulmerErrorResponse {
  error: {
    message: string;
    code: string; // OF-01, OF-02, etc.
    details?: Array<{ field: string; issue: string }>;
  };
}

export interface HaulmerDocumentoEmitido {
  RUTRecep: number;
  DV: string;
  RznSocRecep: string;
  TipoDTE: number;
  Folio: number;
  FchEmis: string;
  FechaRecibido: string;
  MntExe: number;
  MntNeto: number;
  IVA: number;
  MntTotal: number;
  FmaPago: string;
  token: string;
}

export interface HaulmerListResponse {
  current_page: number;
  last_page: number;
  data: HaulmerDocumentoEmitido[];
  total: number;
}

class HaulmerClient {
  private apiKey: string;
  private baseUrl: string;
  private environment: 'sandbox' | 'production';
  private emisor: HaulmerEmisor;

  constructor() {
    this.apiKey = HAULMER_API_KEY;
    this.baseUrl = HAULMER_API_URL;
    this.environment = HAULMER_ENVIRONMENT;
    this.emisor = HAULMER_EMISOR;

    if (!this.apiKey) {
      console.warn('⚠️ [Haulmer] API Key no configurada. Las operaciones fallarán.');
    }

    if (!this.emisor.RUTEmisor) {
      console.warn('⚠️ [Haulmer] Datos del emisor no configurados.');
    }
  }

  /**
   * Realiza una petición a la API de Haulmer
   * Ref: https://docsapi-openfactura.haulmer.com/
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any,
    idempotencyKey?: string
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Haulmer API Key no configurada');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    // Autenticación: header 'apikey' directo (NO Bearer)
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
    };

    // Idempotency Key opcional (24h de duración)
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    console.log('📡 [Haulmer API Request]', {
      method,
      endpoint,
      url,
      environment: this.environment,
      hasBody: !!body,
      hasIdempotencyKey: !!idempotencyKey,
    });

    try {
      const response = await fetch(url, options);

      // Rate limit exceeded (429)
      if (response.status === 429) {
        const errorData = await response.json();
        throw new Error(`Rate limit excedido: ${errorData.message}`);
      }

      // API Key inválida (401)
      if (response.status === 401) {
        throw new Error('API Key de Haulmer inválida o expirada');
      }

      const data = await response.json();

      // Verificar si hay error en la respuesta
      if (data.error) {
        const errorResponse = data as HaulmerErrorResponse;
        console.error('❌ [Haulmer API Error]', {
          code: errorResponse.error.code,
          message: errorResponse.error.message,
          details: errorResponse.error.details,
        });
        throw new Error(`Haulmer ${errorResponse.error.code}: ${errorResponse.error.message}`);
      }

      return data as T;
    } catch (error: any) {
      console.error('❌ [Haulmer API Request Failed]', {
        endpoint,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Emite un DTE (Documento Tributario Electrónico)
   * 
   * @param tipoDTE - Tipo de documento (33: Factura, 39: Boleta, etc.)
   * @param receptor - Datos del receptor
   * @param detalle - Líneas de detalle
   * @param totales - Totales del documento
   * @param options - Opciones adicionales
   * @returns Respuesta con TOKEN, FOLIO, PDF, XML
   */
  async emitirDTE(
    tipoDTE: number,
    receptor: HaulmerReceptor,
    detalle: HaulmerDetalle[],
    totales: HaulmerTotales,
    options?: {
      fechaEmision?: string;
      formaPago?: number;
      sendEmail?: { to: string; CC?: string; BCC?: string };
      idempotencyKey?: string;
    }
  ): Promise<HaulmerEmitirResponse> {
    // Completar totales con campos obligatorios
    const totalesCompletos: HaulmerTotales = {
      ...totales,
      MontoPeriodo: totales.MontoPeriodo ?? totales.MntTotal,
      VlrPagar: totales.VlrPagar ?? totales.MntTotal,
    };

    const request: HaulmerEmitirRequest = {
      response: ['PDF', 'FOLIO', 'XML'],
      dte: {
        Encabezado: {
          IdDoc: {
            TipoDTE: tipoDTE,
            Folio: 0, // Haulmer asigna el folio automáticamente
            FchEmis: options?.fechaEmision || this.getCurrentDate(),
            TpoTranCompra: '1', // Del giro
            TpoTranVenta: '1', // Del giro
            FmaPago: options?.formaPago || 1, // 1: Contado
          },
          Emisor: this.emisor,
          Receptor: receptor,
          Totales: totalesCompletos,
        },
        Detalle: detalle,
      },
    };

    if (options?.sendEmail) {
      request.sendEmail = options.sendEmail;
    }

    console.log('📝 [Haulmer] Enviando DTE:', JSON.stringify(request, null, 2));

    const response = await this.makeRequest<HaulmerEmitirResponse>(
      '/v2/dte/document',
      'POST',
      request,
      options?.idempotencyKey
    );

    console.log('✅ [Haulmer] DTE emitido exitosamente:', {
      token: response.TOKEN,
      folio: response.FOLIO,
      tipoDTE,
    });

    return response;
  }

  /**
   * Emite una Factura Electrónica (TipoDTE: 33)
   */
  async emitirFactura(
    receptor: HaulmerReceptor,
    detalle: HaulmerDetalle[],
    totales: HaulmerTotales,
    options?: {
      fechaEmision?: string;
      formaPago?: number;
      sendEmail?: { to: string };
      idempotencyKey?: string;
    }
  ): Promise<HaulmerEmitirResponse> {
    return this.emitirDTE(TipoDTE.FACTURA_ELECTRONICA, receptor, detalle, totales, options);
  }

  /**
   * Emite una Boleta Electrónica (TipoDTE: 39)
   */
  async emitirBoleta(
    receptor: HaulmerReceptor,
    detalle: HaulmerDetalle[],
    totales: HaulmerTotales,
    options?: {
      fechaEmision?: string;
      sendEmail?: { to: string };
      idempotencyKey?: string;
    }
  ): Promise<HaulmerEmitirResponse> {
    return this.emitirDTE(TipoDTE.BOLETA_ELECTRONICA, receptor, detalle, totales, {
      ...options,
      formaPago: 1, // Boletas siempre contado
    });
  }

  /**
   * Lista documentos emitidos con filtros
   * 
   * @param filters - Filtros de búsqueda
   * @param page - Número de página (máx 30 resultados por página)
   */
  async listarDocumentosEmitidos(
    filters?: {
      tipoDTE?: number;
      fechaDesde?: string;
      fechaHasta?: string;
      rutReceptor?: number;
    },
    page: number = 1
  ): Promise<HaulmerListResponse> {
    const body: any = { Page: page.toString() };

    if (filters?.tipoDTE) {
      body.TipoDTE = { eq: filters.tipoDTE.toString() };
    }

    if (filters?.fechaDesde || filters?.fechaHasta) {
      body.FchEmis = {};
      if (filters.fechaDesde) body.FchEmis.gte = filters.fechaDesde;
      if (filters.fechaHasta) body.FchEmis.lte = filters.fechaHasta;
    }

    if (filters?.rutReceptor) {
      body.RUTRecep = { eq: filters.rutReceptor };
    }

    return this.makeRequest<HaulmerListResponse>(
      '/v2/dte/document/issued',
      'POST',
      body
    );
  }

  /**
   * Obtiene los datos del emisor configurado
   */
  getEmisor(): HaulmerEmisor {
    return { ...this.emisor };
  }

  /**
   * Verifica si el cliente está correctamente configurado
   */
  isConfigured(): boolean {
    return !!(
      this.apiKey &&
      this.emisor.RUTEmisor &&
      this.emisor.RznSoc &&
      this.emisor.GiroEmis
    );
  }
}

// Exportar instancia singleton
export const haulmerClient = new HaulmerClient();

