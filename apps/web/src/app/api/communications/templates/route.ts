/**
 * API Route: Templates de Mensajes
 * 
 * GET: Listar templates de la organización
 * POST: Crear nuevo template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateTemplate, extractVariables } from '@/lib/communications/template-engine';
import { getUserAndOrganization } from '@/lib/organization/utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, organization, error: authError } = await getUserAndOrganization(supabase);

    if (authError || !user || !organization) {
      return NextResponse.json(
        { error: authError?.message || 'No autenticado o sin organización' },
        { status: 401 }
      );
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const type = searchParams.get('type');

    // Construir query
    let query = supabase
      .from('message_templates')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error al obtener templates:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, organization, error: authError } = await getUserAndOrganization(supabase);

    if (authError || !user || !organization) {
      return NextResponse.json(
        { error: authError?.message || 'No autenticado o sin organización' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, type, subject, body_html, body_text, variables, parent_template_id } = body;

    // Validaciones
    if (!name || !subject || !body_html) {
      return NextResponse.json(
        { error: 'name, subject y body_html son campos requeridos' },
        { status: 400 }
      );
    }

    // Validar sintaxis del template
    const validation = validateTemplate(body_html);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Template inválido: ${validation.error}` },
        { status: 400 }
      );
    }

    // Extraer variables del template si no se proporcionaron
    const extractedVars = extractVariables(body_html);
    const templateVariables = variables || {};
    
    // Agregar variables extraídas que no estén en el objeto proporcionado
    extractedVars.forEach((varName) => {
      if (!templateVariables[varName]) {
        templateVariables[varName] = `Variable: ${varName}`;
      }
    });

    // Crear template
    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        organization_id: organization.id,
        name,
        description: description || null,
        type: type || 'email',
        subject,
        body_html,
        body_text: body_text || null,
        variables: templateVariables,
        version: 1,
        parent_template_id: parent_template_id || null,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al crear template:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear template' },
      { status: 500 }
    );
  }
}

