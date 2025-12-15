'use server';

import { createServiceRoleClient } from "@/lib/supabase/server";

export type TicketRecipient = {
  email: string;
  type: 'user' | 'organization' | 'contact' | 'other';
  id?: string;
  name?: string;
};

export type RecipientSuggestions = {
  primary: TicketRecipient[];
  secondary: TicketRecipient[];
};

export async function resolveTicketRecipients(associations: {
  orderId?: string;
  userId?: string;
  organizationId?: string;
  contactId?: string;
  companyId?: string;
}): Promise<RecipientSuggestions> {
  const supabase = createServiceRoleClient();
  const primary: TicketRecipient[] = [];
  const secondary: TicketRecipient[] = [];
  const processedEmails = new Set<string>();

  const addRecipient = (
    list: TicketRecipient[], 
    email: string | undefined | null, 
    type: TicketRecipient['type'], 
    id?: string, 
    name?: string
  ) => {
    if (email && !processedEmails.has(email)) {
      list.push({ email, type, id, name });
      processedEmails.add(email);
    }
  };

  try {
    // 1. Context: ORDER
    if (associations.orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select(`
          user_id,
          organization_id,
          users:user_id (email, raw_user_meta_data),
          organizations:organization_id (email, name)
        `)
        .eq('id', associations.orderId)
        .single();

      if (order) {
        // Default: User
        if (order.users) {
           const u = order.users as any;
           // raw_user_meta_data usually contains full_name
           const fullName = u.raw_user_meta_data?.full_name || u.email;
           addRecipient(primary, u.email, 'user', order.user_id, fullName);
        }
        
        // Secondary: Organization
        if (order.organizations) {
            const o = order.organizations as any;
            addRecipient(secondary, o.email, 'organization', order.organization_id, o.name);
        }
      }
    } 
    // 2. Context: ORGANIZATION (Direct, no order)
    else if (associations.organizationId) {
        const { data: org } = await supabase
            .from('organizations')
            .select('email, name')
            .eq('id', associations.organizationId)
            .single();
        
        if (org) {
            addRecipient(primary, org.email, 'organization', associations.organizationId, org.name);
        }
    }
    // 3. Context: USER (Direct, no order)
    else if (associations.userId) {
        const { data: userData } = await supabase.auth.admin.getUserById(associations.userId);
        if (userData && userData.user) {
             const fullName = userData.user.user_metadata?.full_name || userData.user.email;
             addRecipient(primary, userData.user.email || '', 'user', associations.userId, fullName);
        }
    }
    
    // 4. Context: CRM Contact
    if (associations.contactId) {
        try {
             const { data: contact } = await supabase.schema('crm').from('contacts').select('email, first_name, last_name').eq('id', associations.contactId).single();
             if (contact) {
                 // If we already have a primary (e.g. from Order), this might be secondary? 
                 // Or if it's a contact context, it should be primary.
                 // If primary is empty, this is primary.
                 const targetList = primary.length === 0 ? primary : secondary;
                 addRecipient(targetList, contact.email, 'contact', associations.contactId, `${contact.first_name} ${contact.last_name}`);
             }
        } catch (e) {
            console.error('Error fetching contact:', e);
        }
    }

  } catch (error) {
    console.error('Error resolving recipients:', error);
  }

  return { primary, secondary };
}


