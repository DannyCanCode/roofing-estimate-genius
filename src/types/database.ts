export interface Report {
  id: string;
  file_path: string;
  original_filename: string;
  status: string;
  error_message: string | null;
  metadata: any;
  processed_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface Estimate {
  id: string;
  customer_name: string;
  amount: number;
  status: string;
  date: string;
  roofing_type: string;
  address: string | null;
  report_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstimateItem {
  id: string;
  estimate_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  created_at: string;
  updated_at: string;
}