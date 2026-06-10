export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"];
          actor: string | null;
          actor_name: string;
          created_at: string;
          id: number;
          target_property: string | null;
          target_room: string | null;
          target_text: string | null;
        };
        Insert: {
          action: Database["public"]["Enums"]["audit_action"];
          actor?: string | null;
          actor_name: string;
          created_at?: string;
          id?: never;
          target_property?: string | null;
          target_room?: string | null;
          target_text?: string | null;
        };
        Update: {
          action?: Database["public"]["Enums"]["audit_action"];
          actor?: string | null;
          actor_name?: string;
          created_at?: string;
          id?: never;
          target_property?: string | null;
          target_room?: string | null;
          target_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_fkey";
            columns: ["actor"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      issues: {
        Row: {
          created_at: string;
          deadline: Database["public"]["Enums"]["issue_deadline"] | null;
          description: string;
          description_ar: string;
          id: number;
          photo_path: string | null;
          photo_paths: string[];
          property: string;
          reported_by: string;
          resolved_at: string | null;
          resolved_minutes: number | null;
          room: string;
          status: Database["public"]["Enums"]["issue_status"];
          tags: string[];
          taken_by: string | null;
          type: string;
          urgency: Database["public"]["Enums"]["issue_urgency"];
        };
        Insert: {
          created_at?: string;
          deadline?: Database["public"]["Enums"]["issue_deadline"] | null;
          description?: string;
          description_ar?: string;
          id?: never;
          photo_path?: string | null;
          photo_paths?: string[];
          property: string;
          reported_by: string;
          resolved_at?: string | null;
          resolved_minutes?: number | null;
          room?: string;
          status?: Database["public"]["Enums"]["issue_status"];
          tags?: string[];
          taken_by?: string | null;
          type: string;
          urgency: Database["public"]["Enums"]["issue_urgency"];
        };
        Update: {
          created_at?: string;
          deadline?: Database["public"]["Enums"]["issue_deadline"] | null;
          description?: string;
          description_ar?: string;
          id?: never;
          photo_path?: string | null;
          photo_paths?: string[];
          property?: string;
          reported_by?: string;
          resolved_at?: string | null;
          resolved_minutes?: number | null;
          room?: string;
          status?: Database["public"]["Enums"]["issue_status"];
          tags?: string[];
          taken_by?: string | null;
          type?: string;
          urgency?: Database["public"]["Enums"]["issue_urgency"];
        };
        Relationships: [
          {
            foreignKeyName: "issues_reported_by_fkey";
            columns: ["reported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issues_taken_by_fkey";
            columns: ["taken_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          username: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          username: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          username?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: { id: number; property: string; room: string; created_at: string };
        Insert: { id?: never; property: string; room: string; created_at?: string };
        Update: { id?: never; property?: string; room?: string; created_at?: string };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      audit_action: "report" | "take" | "done" | "deadline" | "addemp" | "rmemp" | "login";
      issue_deadline: "today" | "tomorrow" | "days3" | "week";
      issue_status: "open" | "progress" | "done";
      issue_urgency: "urgent" | "soon" | "wait";
      user_role: "admin" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
