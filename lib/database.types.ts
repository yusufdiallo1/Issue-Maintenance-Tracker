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
          source_language: string | null;
          description_translations: Record<string, string>;
          tag_translations: Record<string, Record<string, string>>;
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
          pinned: boolean;
          proof_paths: string[];
          proof_note: string | null;
          proof_note_lang: string | null;
          done_by: string | null;
          done_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          reject_reason: string | null;
        };
        Insert: {
          created_at?: string;
          deadline?: Database["public"]["Enums"]["issue_deadline"] | null;
          description?: string;
          description_ar?: string;
          source_language?: string | null;
          description_translations?: Record<string, string>;
          tag_translations?: Record<string, Record<string, string>>;
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
          pinned?: boolean;
          proof_paths?: string[];
          proof_note?: string | null;
          proof_note_lang?: string | null;
          done_by?: string | null;
          done_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          reject_reason?: string | null;
        };
        Update: {
          created_at?: string;
          deadline?: Database["public"]["Enums"]["issue_deadline"] | null;
          description?: string;
          description_ar?: string;
          source_language?: string | null;
          description_translations?: Record<string, string>;
          tag_translations?: Record<string, Record<string, string>>;
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
          pinned?: boolean;
          proof_paths?: string[];
          proof_note?: string | null;
          proof_note_lang?: string | null;
          done_by?: string | null;
          done_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          reject_reason?: string | null;
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
          preferred_language: string;
          notif_enabled: boolean;
          notif_sound: boolean;
          properties: string[];
          title: string | null;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          username: string;
          preferred_language?: string;
          notif_enabled?: boolean;
          notif_sound?: boolean;
          properties?: string[];
          title?: string | null;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          username?: string;
          preferred_language?: string;
          notif_enabled?: boolean;
          notif_sound?: boolean;
          properties?: string[];
          title?: string | null;
        };
        Relationships: [];
      };
      rooms: {
        Row: { id: number; property: string; room: string; created_at: string };
        Insert: { id?: never; property: string; room: string; created_at?: string };
        Update: { id?: never; property?: string; room?: string; created_at?: string };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          kind: string;
          issue_id: number | null;
          title: string;
          body: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: never;
          user_id: string;
          kind: string;
          issue_id?: number | null;
          title: string;
          body: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: never;
          user_id?: string;
          kind?: string;
          issue_id?: number | null;
          title?: string;
          body?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: number;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          platform: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          platform?: string;
          created_at?: string;
        };
        Update: {
          id?: never;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          platform?: string;
          created_at?: string;
        };
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
      audit_action:
        | "report"
        | "take"
        | "done"
        | "deadline"
        | "addemp"
        | "rmemp"
        | "login"
        | "role"
        | "pwreset"
        | "passcode";
      issue_deadline: "today" | "tomorrow" | "days3" | "week";
      issue_status: "open" | "progress" | "pending" | "done";
      issue_urgency: "urgent" | "soon" | "wait";
      user_role: "admin" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
