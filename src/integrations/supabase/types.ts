export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: Database["public"]["Enums"]["asset_type"]
          id: string
          metadata: Json | null
          processing_status: Database["public"]["Enums"]["processing_status"]
          project_id: string | null
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: Database["public"]["Enums"]["asset_type"]
          id?: string
          metadata?: Json | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          project_id?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: Database["public"]["Enums"]["asset_type"]
          id?: string
          metadata?: Json | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          project_id?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_facts: {
        Row: {
          content: Json
          created_at: string
          fact_type: Database["public"]["Enums"]["fact_type"]
          id: string
          project_id: string
          provenance: Json | null
          source_proposed_fact_id: string | null
          superseded_by: string | null
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          content: Json
          created_at?: string
          fact_type: Database["public"]["Enums"]["fact_type"]
          id?: string
          project_id: string
          provenance?: Json | null
          source_proposed_fact_id?: string | null
          superseded_by?: string | null
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          fact_type?: Database["public"]["Enums"]["fact_type"]
          id?: string
          project_id?: string
          provenance?: Json | null
          source_proposed_fact_id?: string | null
          superseded_by?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_facts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_facts_source_proposed_fact_id_fkey"
            columns: ["source_proposed_fact_id"]
            isOneToOne: false
            referencedRelation: "proposed_facts"
            referencedColumns: ["id"]
          },
        ]
      }
      change_events: {
        Row: {
          canonical_fact_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["delta_type"]
          id: string
          new_value: Json | null
          previous_value: Json | null
          project_id: string | null
          review_case_id: string | null
          user_id: string
        }
        Insert: {
          canonical_fact_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["delta_type"]
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          project_id?: string | null
          review_case_id?: string | null
          user_id: string
        }
        Update: {
          canonical_fact_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["delta_type"]
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          project_id?: string | null
          review_case_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_events_canonical_fact_id_fkey"
            columns: ["canonical_fact_id"]
            isOneToOne: false
            referencedRelation: "canonical_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_events_review_case_id_fkey"
            columns: ["review_case_id"]
            isOneToOne: false
            referencedRelation: "review_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      commit_results: {
        Row: {
          committed_facts: string[] | null
          created_at: string
          id: string
          rejected_facts: string[] | null
          session_id: string
          summary: string | null
          user_id: string
        }
        Insert: {
          committed_facts?: string[] | null
          created_at?: string
          id?: string
          rejected_facts?: string[] | null
          session_id: string
          summary?: string | null
          user_id: string
        }
        Update: {
          committed_facts?: string[] | null
          created_at?: string
          id?: string
          rejected_facts?: string[] | null
          session_id?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commit_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "review_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contradictions: {
        Row: {
          contradiction_type: Database["public"]["Enums"]["contradiction_type"]
          created_at: string
          description: string | null
          fact_a_id: string | null
          fact_b_id: string | null
          id: string
          project_id: string
          resolution: string | null
          resolved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          contradiction_type: Database["public"]["Enums"]["contradiction_type"]
          created_at?: string
          description?: string | null
          fact_a_id?: string | null
          fact_b_id?: string | null
          id?: string
          project_id: string
          resolution?: string | null
          resolved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          contradiction_type?: Database["public"]["Enums"]["contradiction_type"]
          created_at?: string
          description?: string | null
          fact_a_id?: string | null
          fact_b_id?: string | null
          id?: string
          project_id?: string
          resolution?: string | null
          resolved?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contradictions_fact_a_id_fkey"
            columns: ["fact_a_id"]
            isOneToOne: false
            referencedRelation: "canonical_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contradictions_fact_b_id_fkey"
            columns: ["fact_b_id"]
            isOneToOne: false
            referencedRelation: "canonical_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contradictions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      corrections: {
        Row: {
          canonical_fact_id: string
          corrected_value: Json
          created_at: string
          id: string
          previous_value: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          canonical_fact_id: string
          corrected_value: Json
          created_at?: string
          id?: string
          previous_value?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          canonical_fact_id?: string
          corrected_value?: Json
          created_at?: string
          id?: string
          previous_value?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrections_canonical_fact_id_fkey"
            columns: ["canonical_fact_id"]
            isOneToOne: false
            referencedRelation: "canonical_facts"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          canonical_fact_id: string | null
          created_at: string
          due_date: string
          id: string
          project_id: string
          relevance: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canonical_fact_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          project_id: string
          relevance?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canonical_fact_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          project_id?: string
          relevance?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_canonical_fact_id_fkey"
            columns: ["canonical_fact_id"]
            isOneToOne: false
            referencedRelation: "canonical_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          canonical_fact_id: string | null
          created_at: string
          decided_at: string | null
          description: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["decision_status"]
          title: string
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          canonical_fact_id?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["decision_status"]
          title: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          canonical_fact_id?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["decision_status"]
          title?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_canonical_fact_id_fkey"
            columns: ["canonical_fact_id"]
            isOneToOne: false
            referencedRelation: "canonical_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_references: {
        Row: {
          created_at: string
          id: string
          relation: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          relation?: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relation?: string | null
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id?: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      open_points: {
        Row: {
          canonical_fact_id: string | null
          created_at: string
          description: string | null
          id: string
          project_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canonical_fact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canonical_fact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_points_canonical_fact_id_fkey"
            columns: ["canonical_fact_id"]
            isOneToOne: false
            referencedRelation: "canonical_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_points_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          metadata: Json | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          metadata?: Json | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      parsed_documents: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          metadata: Json | null
          parser_version: string | null
          segments: Json
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          parser_version?: string | null
          segments?: Json
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          parser_version?: string | null
          segments?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parsed_documents_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      persons: {
        Row: {
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          name: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_stakeholder_links: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          person_id: string | null
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          person_id?: string | null
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          person_id?: string | null
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stakeholder_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stakeholder_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stakeholder_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_state_snapshots: {
        Row: {
          created_at: string
          id: string
          project_id: string
          snapshot: Json
          summary: string | null
          trigger_event: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          snapshot: Json
          summary?: string | null
          trigger_event?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          snapshot?: Json
          summary?: string | null
          trigger_event?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_state_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposed_facts: {
        Row: {
          against_fact_id: string | null
          confidence: number | null
          content: Json
          created_at: string
          delta_type: Database["public"]["Enums"]["delta_type"] | null
          extraction_run_id: string | null
          fact_type: Database["public"]["Enums"]["fact_type"]
          id: string
          parsed_document_id: string | null
          project_id: string | null
          source_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          against_fact_id?: string | null
          confidence?: number | null
          content: Json
          created_at?: string
          delta_type?: Database["public"]["Enums"]["delta_type"] | null
          extraction_run_id?: string | null
          fact_type?: Database["public"]["Enums"]["fact_type"]
          id?: string
          parsed_document_id?: string | null
          project_id?: string | null
          source_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          against_fact_id?: string | null
          confidence?: number | null
          content?: Json
          created_at?: string
          delta_type?: Database["public"]["Enums"]["delta_type"] | null
          extraction_run_id?: string | null
          fact_type?: Database["public"]["Enums"]["fact_type"]
          id?: string
          parsed_document_id?: string | null
          project_id?: string | null
          source_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposed_facts_parsed_document_id_fkey"
            columns: ["parsed_document_id"]
            isOneToOne: false
            referencedRelation: "parsed_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposed_facts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposed_facts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      review_cases: {
        Row: {
          box_state: Database["public"]["Enums"]["box_state"]
          box_type: Database["public"]["Enums"]["box_type"]
          context: Json | null
          created_at: string
          description: string | null
          id: string
          priority: number | null
          proposed_fact_id: string | null
          session_id: string
          title: string | null
          updated_at: string
          user_decision: Json | null
          user_id: string
        }
        Insert: {
          box_state?: Database["public"]["Enums"]["box_state"]
          box_type?: Database["public"]["Enums"]["box_type"]
          context?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: number | null
          proposed_fact_id?: string | null
          session_id: string
          title?: string | null
          updated_at?: string
          user_decision?: Json | null
          user_id: string
        }
        Update: {
          box_state?: Database["public"]["Enums"]["box_state"]
          box_type?: Database["public"]["Enums"]["box_type"]
          context?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: number | null
          proposed_fact_id?: string | null
          session_id?: string
          title?: string | null
          updated_at?: string
          user_decision?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_cases_proposed_fact_id_fkey"
            columns: ["proposed_fact_id"]
            isOneToOne: false
            referencedRelation: "proposed_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_cases_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "review_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_sessions: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          resolved_cases: number | null
          status: Database["public"]["Enums"]["review_status"]
          summary: string | null
          total_cases: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          resolved_cases?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          summary?: string | null
          total_cases?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          resolved_cases?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          summary?: string | null
          total_cases?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          asset_id: string
          created_at: string
          extraction_run_id: string | null
          id: string
          metadata: Json | null
          recipients: string[] | null
          sender: string | null
          source_date: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          extraction_run_id?: string | null
          id?: string
          metadata?: Json | null
          recipients?: string[] | null
          sender?: string | null
          source_date?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          extraction_run_id?: string | null
          id?: string
          metadata?: Json | null
          recipients?: string[] | null
          sender?: string | null
          source_date?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          canonical_fact_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          canonical_fact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          canonical_fact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_canonical_fact_id_fkey"
            columns: ["canonical_fact_id"]
            isOneToOne: false
            referencedRelation: "canonical_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          canonical_fact_id: string | null
          created_at: string
          description: string | null
          id: string
          merged_into: string | null
          name: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canonical_fact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          merged_into?: string | null
          name: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canonical_fact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          merged_into?: string | null
          name?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_canonical_fact_id_fkey"
            columns: ["canonical_fact_id"]
            isOneToOne: false
            referencedRelation: "canonical_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      version_links: {
        Row: {
          created_at: string
          id: string
          link_type: string
          predecessor_id: string
          successor_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_type?: string
          predecessor_id: string
          successor_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: string
          predecessor_id?: string
          successor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "version_links_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "version_links_successor_id_fkey"
            columns: ["successor_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      asset_type: "pdf" | "docx" | "pptx" | "image" | "eml" | "note" | "other"
      box_state:
        | "proposed"
        | "expanded"
        | "modified"
        | "confirmed"
        | "rejected"
        | "escalated"
      box_type:
        | "knowledge"
        | "assignment"
        | "conflict"
        | "selection"
        | "input"
        | "context"
        | "action"
      contradiction_type: "deadline" | "decision" | "version" | "assignment"
      decision_status: "active" | "superseded" | "revoked" | "draft"
      delta_type:
        | "confirm"
        | "add"
        | "replace"
        | "contradict"
        | "merge"
        | "discard"
      fact_type:
        | "topic"
        | "decision"
        | "deadline"
        | "task"
        | "open_point"
        | "stakeholder"
        | "reference"
        | "other"
      processing_status: "pending" | "processing" | "completed" | "failed"
      review_status: "open" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      asset_type: ["pdf", "docx", "pptx", "image", "eml", "note", "other"],
      box_state: [
        "proposed",
        "expanded",
        "modified",
        "confirmed",
        "rejected",
        "escalated",
      ],
      box_type: [
        "knowledge",
        "assignment",
        "conflict",
        "selection",
        "input",
        "context",
        "action",
      ],
      contradiction_type: ["deadline", "decision", "version", "assignment"],
      decision_status: ["active", "superseded", "revoked", "draft"],
      delta_type: [
        "confirm",
        "add",
        "replace",
        "contradict",
        "merge",
        "discard",
      ],
      fact_type: [
        "topic",
        "decision",
        "deadline",
        "task",
        "open_point",
        "stakeholder",
        "reference",
        "other",
      ],
      processing_status: ["pending", "processing", "completed", "failed"],
      review_status: ["open", "in_progress", "completed", "cancelled"],
    },
  },
} as const
