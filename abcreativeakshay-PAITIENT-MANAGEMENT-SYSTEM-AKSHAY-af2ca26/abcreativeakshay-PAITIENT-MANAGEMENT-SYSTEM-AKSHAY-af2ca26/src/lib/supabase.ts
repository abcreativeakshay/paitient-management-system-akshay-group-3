import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iuhpkdxtgsexyxmnpkym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aHBrZHh0Z3NleHl4bW5wa3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzg3MDgsImV4cCI6MjA3MTg1NDcwOH0.pdCqqbEbaQtWAxUZ3ZgiwMBcRB_fbdxbs1gU3glkDEg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: string;
          phone: string;
          email: string;
          address: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['patients']['Insert']>;
      };
      doctors: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          specialization: string;
          phone: string;
          email: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['doctors']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['doctors']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          appointment_date: string;
          status: 'scheduled' | 'completed' | 'cancelled';
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
      prescriptions: {
        Row: {
          id: string;
          appointment_id: string;
          medication: string;
          dosage: string;
          instructions: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>;
      };
      medical_records: {
        Row: {
          id: string;
          patient_id: string;
          record_date: string;
          diagnosis: string;
          treatment: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['medical_records']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['medical_records']['Insert']>;
      };
    };
  };
};
