
-- Título: Script de Verificación de Flujo de Firma Electrónica
-- Descripción: Este script simula un ciclo de vida completo de un documento para verificar la lógica de negocio, RPCs y Triggers.
-- Instrucciones: Ejecutar este script en el editor SQL de Supabase.

BEGIN;

DO $$
DECLARE
    -- Variables para IDs
    v_org_id UUID;
    v_user_admin_id UUID;
    v_user_reviewer_id UUID;
    v_doc_id UUID;
    v_signer_id UUID;
    v_doc_token TEXT;
    v_signer_token TEXT;
    v_doc_status signing.document_status;
BEGIN
    RAISE NOTICE 'Iniciando pruebas de verificación de Firma Electrónica...';

    -- 1. Setup: Obtener una organización y usuario existentes (o crear dummy si es entorno de pruebas puro)
    -- Para este test, tomaremos el primer usuario y organización que encontremos para actuar como el "Creador"
    SELECT id INTO v_user_admin_id FROM auth.users LIMIT 1;
    -- Mockear org_id (generalmente vendría de organization_users)
    -- Buscamos una org donde este usuario esté activo
    SELECT organization_id INTO v_org_id FROM core.organization_users WHERE user_id = v_user_admin_id LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró una organización válida para el usuario de prueba.';
    END IF;

    RAISE NOTICE 'Test Context: Org: %, User: %', v_org_id, v_user_admin_id;

    -- 2. Prueba: Crear Documento (RPC: create_signing_document)
    RAISE NOTICE '2. Probando create_signing_document...';
    
    -- Simulamos contexto de auth (necesario para RLS y 'created_by')
    -- Nota: En bloques DO pgplsql puros no podemos establecer auth.uid() fácilmente sin extensiones,
    -- así que asumiremos que las RPCs usan el parámetro p_user_id si se modificaron, o si dependen de auth.uid() podrían fallar en este script standalone.
    -- Las RPCs que creamos usan `auth.uid()` internamente.
    -- LIMITACIÓN: Este script SQL directo fallará en RLS si no setea el contexto.
    -- ESTRATEGIA: Para validación lógica, haremos BYPASS RLS temporales o insertaremos directo, 
    -- PERO lo mejor es probar las RPCs.
    -- Vamos a intentar setear la variable de configuración local que Supabase usa para simular auth si es posible,
    -- o simplemente llamaremos a las funciones asumiendo rol 'postgres'/'service_role' que se salta RLS.
    
    -- Al ejecutar como superusuario/postgres en editor SQL, RLS se aplica? Default: No para dueños de tabla, pero sí para RPCs security definer.
    -- Probemos llamando la RPC.

    -- Mock de request.jwt.claim.sub (simulación de auth)
    -- SET LOCAL "request.jwt.claim.sub" TO v_user_admin_id::text; -- Esto suele funcionar en PostgREST pero no siempre en consola directa
    
    -- Llamada RPC
    SELECT id INTO v_doc_id FROM public.create_signing_document(
        v_org_id,
        'Documento de Prueba Automática',
        'Descripción generada por script de QA',
        'sequential',
        'none',
        TRUE, -- requires_approval
        FALSE -- requires_ai_review
    );
    
    IF v_doc_id IS NULL THEN
        RAISE EXCEPTION 'Falló create_signing_document: ID es nulo';
    END IF;

    -- Update manual de path para simular subida de archivo
    UPDATE signing.documents 
    SET original_file_path = 'dummy/path/doc.pdf', original_file_name = 'doc.pdf', status = 'draft'
    WHERE id = v_doc_id;

    RAISE NOTICE 'Documento creado OK: %', v_doc_id;

    -- 3. Prueba: Agregar Firmante (RPC: add_document_signer)
    RAISE NOTICE '3. Probando add_document_signer...';
    
    SELECT id, token INTO v_signer_id, v_signer_token 
    FROM public.add_document_signer(
        v_doc_id,
        'Test Signer',
        'test@example.com',
        NULL,
        FALSE,
        1
    );

    IF v_signer_id IS NULL THEN 
        RAISE EXCEPTION 'Falló add_document_signer';
    END IF;
    
    RAISE NOTICE 'Firmante agregado OK: % (Token: %)', v_signer_id, v_signer_token;

    -- 4. Prueba: Flujo de Aprobación
    RAISE NOTICE '4. Probando Flujo de Aprobación...';
    
    -- Agregar revisor (Manual insert como hace el frontend)
    INSERT INTO signing.reviewers (document_id, user_id, status)
    VALUES (v_doc_id, v_user_admin_id, 'pending')
    RETURNING id INTO v_user_reviewer_id;

    -- Enviar a revisión (RPC: submit_document_for_review)
    -- Esta RPC espera array de UUIDs. Le pasamos el del admin.
    PERFORM public.submit_document_for_review(v_doc_id, ARRAY[v_user_admin_id]);
    
    -- Verificar cambio de estado
    SELECT status INTO v_doc_status FROM signing.documents WHERE id = v_doc_id;
    IF v_doc_status != 'pending_review' THEN
        RAISE EXCEPTION 'El estado debería ser pending_review, es: %', v_doc_status;
    END IF;
    RAISE NOTICE 'Documento enviado a revisión OK';

    -- Aprobar documento (RPC: approve_document_review)
    PERFORM public.approve_document_review(v_doc_id, 'Aprobado por script de test');
    
    -- Verificar estado (Debe ser 'approved')
    SELECT status INTO v_doc_status FROM signing.documents WHERE id = v_doc_id;
    IF v_doc_status != 'approved' THEN
        RAISE EXCEPTION 'El estado debería ser approved, es: %', v_doc_status;
    END IF;
    RAISE NOTICE 'Documento aprobado OK';

    -- 5. Prueba: Enviar a Firma (RPC: send_document_to_sign)
    RAISE NOTICE '5. Probando send_document_to_sign...';
    PERFORM public.send_document_to_sign(v_doc_id);
    
    SELECT status INTO v_doc_status FROM signing.documents WHERE id = v_doc_id;
    IF v_doc_status != 'pending_signature' THEN
        RAISE EXCEPTION 'El estado debería ser pending_signature, es: %', v_doc_status;
    END IF;
    RAISE NOTICE 'Documento enviado a firma OK';

    -- 6. Prueba: Firmar (RPC: record_signature)
    RAISE NOTICE '6. Probando record_signature...';
    
    -- Verificar turno antes
    IF (SELECT is_my_turn FROM public.get_document_for_signing(v_signer_token)) != TRUE THEN
        RAISE EXCEPTION 'Debería ser el turno del firmante 1';
    END IF;

    PERFORM public.record_signature(
        v_signer_token,
        '127.0.0.1',
        'Test Script User Agent',
        NULL
    );

    -- 7. Verificar Finalización
    SELECT status INTO v_doc_status FROM signing.documents WHERE id = v_doc_id;
    IF v_doc_status != 'completed' AND v_doc_status != 'pending_notary' THEN
        -- Si era el único firmante y no hay notaría, debería estar completed
        RAISE EXCEPTION 'El documento debería estar completed, estado actual: %', v_doc_status;
    END IF;
    
    RAISE NOTICE 'Ciclo completo exitoso. Estado final: %', v_doc_status;

    -- ROLLBACK para no ensuciar la base de datos real
    RAISE NOTICE 'Reviertiendo cambios de prueba...';
    RAISE EXCEPTION 'Test completado exitosamente (Rollback intencional)';

EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%Test completado exitosamente%' THEN
            RAISE NOTICE '✅ PRUEBA EXITOSA: Todo el flujo funciona correctamente.';
        ELSE
            RAISE NOTICE '❌ PRUEBA FALLIDA: %', SQLERRM;
        END IF;
        -- Rollback implícito al abortar transacción
END;
$$;
