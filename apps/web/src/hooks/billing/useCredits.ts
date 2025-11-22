'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useCreditsBalance(orgId: string) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchBalance() {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase.rpc('get_balance', {
          org_id: orgId,
        });
        
        if (fetchError) {
          if (fetchError.code === 'P0001' || fetchError.message.includes('not found')) {
            setBalance(0);
            return;
          }
          throw fetchError;
        }
        
        setBalance(parseFloat(data || '0'));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (orgId) {
      fetchBalance();
    }
  }, [orgId]);
  
  return { balance, loading, error };
}

export function useCreditAccount(orgId: string) {
  const [account, setAccount] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchAccount() {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('credit_accounts')
          .select('*')
          .eq('organization_id', orgId)
          .single();
        
        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No existe cuenta, crear una vacía
            const { data: newAccount } = await supabase
              .from('credit_accounts')
              .insert({
                organization_id: orgId,
                balance: 0,
                reserved_balance: 0,
              })
              .select()
              .single();
            
            setAccount(newAccount);
            return;
          }
          throw fetchError;
        }
        
        setAccount(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (orgId) {
      fetchAccount();
    }
  }, [orgId]);
  
  return { account, loading, error };
}

export function useCreditTransactions(orgId: string, limit = 10) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchTransactions() {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (fetchError) {
          throw fetchError;
        }
        
        setTransactions(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (orgId) {
      fetchTransactions();
    }
  }, [orgId, limit]);
  
  return { transactions, loading, error };
}

