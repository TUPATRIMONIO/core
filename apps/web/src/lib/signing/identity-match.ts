export interface SignerData {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  rut?: string | null;
  metadata?: {
    identifier_value?: string;
    [key: string]: any;
  };
}

export interface VeriffData {
  person?: {
    firstName?: string | null;
    lastName?: string | null;
    idNumber?: string | null;
  };
  document?: {
    number?: string | null;
  };
  decision?: {
    document?: {
      number?: string | null;
    };
    person?: {
      firstName?: string | null;
      lastName?: string | null;
      idNumber?: string | null;
    };
  };
}

export interface IdentityMatchResult {
  nameMatch: boolean;
  identifierMatch: boolean;
  overallMatch: boolean;
  details?: {
    signerName: string;
    veriffName: string;
    signerId: string;
    veriffId: string;
  };
}

/**
 * Normaliza texto: minúsculas, sin acentos, trim
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .trim();
}

/**
 * Normaliza identificador: solo alfanuméricos, minúsculas
 */
export function normalizeIdentifier(id: string): string {
  if (!id) return "";
  // Eliminar todo lo que no sea letra o número
  return id.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Compara los datos del firmante con los datos de Veriff
 */
export function compareSignerWithVeriff(
  signer: SignerData,
  veriff: VeriffData
): IdentityMatchResult {
  // 1. Obtener datos del firmante
  const signerFirstName = normalizeText(signer.first_name || "");
  const signerLastName = normalizeText(signer.last_name || "");
  const signerFullName = normalizeText(signer.full_name || `${signerFirstName} ${signerLastName}`);
  
  const signerId = normalizeIdentifier(
    signer.rut || signer.metadata?.identifier_value || ""
  );

  // 2. Obtener datos de Veriff
  // Veriff puede devolver los datos en diferentes estructuras dependiendo del endpoint/webhook
  const veriffPerson = veriff.person || veriff.decision?.person;
  const veriffDoc = veriff.document || veriff.decision?.document;

  const veriffFirstName = normalizeText(veriffPerson?.firstName || "");
  const veriffLastName = normalizeText(veriffPerson?.lastName || "");
  const veriffFullName = `${veriffFirstName} ${veriffLastName}`.trim();
  
  const veriffId = normalizeIdentifier(
    veriffPerson?.idNumber || veriffDoc?.number || ""
  );

  // 3. Comparación de Nombres (Coincidencia Parcial)
  // Tokenizar nombres del firmante
  const signerNameTokens = signerFullName.split(/\s+/).filter(t => t.length > 0);
  
  // Verificar que cada token del firmante exista en el nombre de Veriff
  // Esto permite que "Juan Perez" haga match con "Juan Carlos Perez Gonzalez"
  const nameMatch = signerNameTokens.length > 0 && signerNameTokens.every(token => {
    return veriffFullName.includes(token);
  });

  // 4. Comparación de Identificador (Coincidencia Exacta Normalizada)
  // Si ambos tienen ID, deben coincidir. Si alguno no tiene, se ignora esta validación (asumiendo que nameMatch es suficiente o que no se pidió ID)
  // PERO: La regla de negocio dice "Si el firmante tiene identificador Y Veriff devuelve identificador: ambos deben coincidir"
  
  let identifierMatch = true;
  if (signerId && veriffId) {
    identifierMatch = signerId === veriffId;
  }

  // 5. Resultado Global
  // Si hay ID en ambos lados, ambos deben coincidir.
  // Si no hay ID en alguno, solo el nombre manda.
  const overallMatch = nameMatch && identifierMatch;

  return {
    nameMatch,
    identifierMatch,
    overallMatch,
    details: {
      signerName: signerFullName,
      veriffName: veriffFullName,
      signerId,
      veriffId
    }
  };
}
