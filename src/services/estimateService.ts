import { supabase } from "@/integrations/supabase/client";
import { Estimate, EstimateItem } from "@/types/database";

export async function createEstimate(estimate: Omit<Estimate, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('estimates')
    .insert(estimate)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createEstimateItems(items: Omit<EstimateItem, 'id' | 'created_at' | 'updated_at'>[]) {
  const { data, error } = await supabase
    .from('estimate_items')
    .insert(items)
    .select();

  if (error) throw error;
  return data;
}

export async function getEstimates() {
  const { data, error } = await supabase
    .from('estimates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getEstimateItems(estimateId: string) {
  const { data, error } = await supabase
    .from('estimate_items')
    .select('*')
    .eq('estimate_id', estimateId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}