// supabase/migrations/20260811000000_init.sql の内容を手動で反映した型定義。
// スキーマを変更した場合はここも合わせて更新すること
// (Supabase CLIが使えるようになれば `supabase gen types typescript` で自動生成に切替可能)。

export type AssigneeType = "owner" | "staff";
export type TaskStatus = "open" | "completed";
export type PriorityLevel = "urgent" | "high" | "medium" | "low";
export type TaskSource = "manual" | "ai_chat";
export type RecurrenceType =
  | "daily"
  | "weekly"
  | "monthly_on_day"
  | "monthly_last_day";
export type AttachmentKind = "file" | "url";
export type SubtaskStatus = "open" | "completed";
export type ProjectPhase =
  | "concept"
  | "researching"
  | "preparing"
  | "active"
  | "operating"
  | "on_hold"
  | "completed";
export type ProjectNoteType = "text" | "diagram";
export type Channel = "airregi" | "uber_eats" | "rocket_now" | "stores";
export type CampaignType =
  | "instagram_post"
  | "threads_post"
  | "line_broadcast"
  | "ad"
  | "pop"
  | "campaign"
  | "collab"
  | "new_product";
export type IngredientType = "raw_material" | "intermediate_recipe";
export type HotIce = "HOT" | "ICE";

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      task_recurrence_series: {
        Row: {
          id: string;
          title_template: string;
          category_id: string | null;
          assignee_type: AssigneeType;
          assignee_staff_id: string | null;
          memo_template: string | null;
          recurrence_type: RecurrenceType;
          recurrence_config: Record<string, unknown> | null;
          due_offset_days: number;
          priority_level: PriorityLevel;
          is_active: boolean;
          last_generated_due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title_template: string;
          category_id?: string | null;
          assignee_type?: AssigneeType;
          assignee_staff_id?: string | null;
          memo_template?: string | null;
          recurrence_type: RecurrenceType;
          recurrence_config?: Record<string, unknown> | null;
          due_offset_days?: number;
          priority_level?: PriorityLevel;
          is_active?: boolean;
          last_generated_due_date?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["task_recurrence_series"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "task_recurrence_series_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_recurrence_series_assignee_staff_id_fkey";
            columns: ["assignee_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      task_recurrence_series_subtasks: {
        Row: {
          id: string;
          series_id: string;
          title: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          title: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["task_recurrence_series_subtasks"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "task_recurrence_series_subtasks_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "task_recurrence_series";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          memo: string | null;
          category_id: string | null;
          assignee_type: AssigneeType;
          assignee_staff_id: string | null;
          due_date: string | null;
          start_date: string | null;
          status: TaskStatus;
          completed_at: string | null;
          is_waiting: boolean;
          waiting_follow_up_date: string | null;
          waiting_note: string | null;
          priority_level: PriorityLevel;
          priority_score: number;
          priority_reason: string | null;
          priority_updated_at: string | null;
          recurrence_series_id: string | null;
          related_product_id: string | null;
          stores_order_id: string | null;
          progress_override: number | null;
          project_id: string | null;
          source: TaskSource;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          memo?: string | null;
          category_id?: string | null;
          assignee_type?: AssigneeType;
          assignee_staff_id?: string | null;
          due_date?: string | null;
          start_date?: string | null;
          status?: TaskStatus;
          completed_at?: string | null;
          is_waiting?: boolean;
          waiting_follow_up_date?: string | null;
          waiting_note?: string | null;
          priority_level?: PriorityLevel;
          priority_score?: number;
          priority_reason?: string | null;
          priority_updated_at?: string | null;
          recurrence_series_id?: string | null;
          related_product_id?: string | null;
          stores_order_id?: string | null;
          progress_override?: number | null;
          project_id?: string | null;
          source?: TaskSource;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assignee_staff_id_fkey";
            columns: ["assignee_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_recurrence_series_id_fkey";
            columns: ["recurrence_series_id"];
            isOneToOne: false;
            referencedRelation: "task_recurrence_series";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_related_product_id_fkey";
            columns: ["related_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          purpose: string | null;
          memo: string | null;
          phase: ProjectPhase;
          start_date: string | null;
          due_date: string | null;
          end_date: string | null;
          final_review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id?: string | null;
          purpose?: string | null;
          memo?: string | null;
          phase?: ProjectPhase;
          start_date?: string | null;
          due_date?: string | null;
          end_date?: string | null;
          final_review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      project_notes: {
        Row: {
          id: string;
          project_id: string;
          note_type: ProjectNoteType;
          content: string | null;
          diagram: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          note_type?: ProjectNoteType;
          content?: string | null;
          diagram?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_notes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_attachments: {
        Row: {
          id: string;
          project_id: string;
          note_id: string | null;
          kind: AttachmentKind;
          storage_path: string | null;
          file_name: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          external_url: string | null;
          label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          note_id?: string | null;
          kind: AttachmentKind;
          storage_path?: string | null;
          file_name?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          external_url?: string | null;
          label?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["project_attachments"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "project_attachments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_attachments_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "project_notes";
            referencedColumns: ["id"];
          },
        ];
      };
      attachments: {
        Row: {
          id: string;
          task_id: string;
          kind: AttachmentKind;
          storage_path: string | null;
          file_name: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          external_url: string | null;
          label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          kind: AttachmentKind;
          storage_path?: string | null;
          file_name?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          external_url?: string | null;
          label?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["attachments"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "attachments_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          unit: string;
          lead_time_days: number;
          safety_stock: number;
          safety_stock_days: number;
          last_ordered_at: string | null;
          last_received_at: string | null;
          is_active: boolean;
          sort_order: number;
          supplier: string | null;
          purchase_price: number | null;
          package_amount: number | null;
          price_updated_at: string | null;
          note: string | null;
          display_color: string | null;
          material_category: string | null;
          material_sort_order: number;
          show_in_costing: boolean;
          merged_into_product_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          unit?: string;
          lead_time_days?: number;
          safety_stock?: number;
          safety_stock_days?: number;
          sort_order?: number;
          last_ordered_at?: string | null;
          last_received_at?: string | null;
          is_active?: boolean;
          supplier?: string | null;
          purchase_price?: number | null;
          package_amount?: number | null;
          price_updated_at?: string | null;
          note?: string | null;
          display_color?: string | null;
          material_category?: string | null;
          material_sort_order?: number;
          show_in_costing?: boolean;
          merged_into_product_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      raw_material_price_history: {
        Row: {
          id: string;
          product_id: string;
          purchase_price: number;
          package_amount: number;
          unit_cost: number;
          changed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          purchase_price: number;
          package_amount: number;
          unit_cost: number;
          changed_at?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["raw_material_price_history"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "raw_material_price_history_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      intermediate_recipes: {
        Row: {
          id: string;
          name: string;
          yield_amount: number;
          yield_unit: string;
          note: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          yield_amount: number;
          yield_unit?: string;
          note?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["intermediate_recipes"]["Insert"]
        >;
        Relationships: [];
      };
      intermediate_recipe_ingredients: {
        Row: {
          id: string;
          intermediate_recipe_id: string;
          product_id: string;
          amount: number;
          unit: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          intermediate_recipe_id: string;
          product_id: string;
          amount: number;
          unit: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["intermediate_recipe_ingredients"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "intermediate_recipe_ingredients_intermediate_recipe_id_fkey";
            columns: ["intermediate_recipe_id"];
            isOneToOne: false;
            referencedRelation: "intermediate_recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "intermediate_recipe_ingredients_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_item_ingredients: {
        Row: {
          id: string;
          menu_item_id: string;
          ingredient_type: IngredientType;
          product_id: string | null;
          intermediate_recipe_id: string | null;
          amount: number;
          unit: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          ingredient_type: IngredientType;
          product_id?: string | null;
          intermediate_recipe_id?: string | null;
          amount: number;
          unit: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["menu_item_ingredients"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "menu_item_ingredients_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_item_ingredients_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_item_ingredients_intermediate_recipe_id_fkey";
            columns: ["intermediate_recipe_id"];
            isOneToOne: false;
            referencedRelation: "intermediate_recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      recipe_category_defaults: {
        Row: {
          id: string;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["recipe_category_defaults"]["Insert"]
        >;
        Relationships: [];
      };
      recipe_category_default_variants: {
        Row: {
          id: string;
          category_default_id: string;
          hot_ice: "HOT" | "ICE" | null;
          size: string;
          list_price: number | null;
          cup_product_id: string | null;
          lid_product_id: string | null;
          straw_product_id: string | null;
          sleeve_product_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_default_id: string;
          hot_ice?: "HOT" | "ICE" | null;
          size: string;
          list_price?: number | null;
          cup_product_id?: string | null;
          lid_product_id?: string | null;
          straw_product_id?: string | null;
          sleeve_product_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["recipe_category_default_variants"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "recipe_category_default_variants_category_default_id_fkey";
            columns: ["category_default_id"];
            isOneToOne: false;
            referencedRelation: "recipe_category_defaults";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_category_default_variants_cup_product_id_fkey";
            columns: ["cup_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_category_default_variants_lid_product_id_fkey";
            columns: ["lid_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_category_default_variants_straw_product_id_fkey";
            columns: ["straw_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_category_default_variants_sleeve_product_id_fkey";
            columns: ["sleeve_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_snapshots: {
        Row: {
          id: string;
          product_id: string;
          recorded_on: string;
          quantity: number;
          kitchen_back: number | null;
          under_chair: number | null;
          office: number | null;
          warehouse: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          recorded_on: string;
          quantity: number;
          kitchen_back?: number | null;
          under_chair?: number | null;
          office?: number | null;
          warehouse?: number | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["stock_snapshots"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "stock_snapshots_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_check_results: {
        Row: {
          id: string;
          checked_on: string;
          product_id: string;
          product_name: string;
          required_text: string | null;
          current_text: string | null;
          shortage: number | null;
          task_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          checked_on: string;
          product_id: string;
          product_name: string;
          required_text?: string | null;
          current_text?: string | null;
          shortage?: number | null;
          task_id?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["inventory_check_results"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "inventory_check_results_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_check_results_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      task_templates: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["task_templates"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "task_templates_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      task_template_subtasks: {
        Row: {
          id: string;
          template_id: string;
          title: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          title: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["task_template_subtasks"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "task_template_subtasks_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "task_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          status: SubtaskStatus;
          completed_at: string | null;
          due_date: string | null;
          assignee_type: AssigneeType;
          assignee_staff_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          status?: SubtaskStatus;
          completed_at?: string | null;
          due_date?: string | null;
          assignee_type?: AssigneeType;
          assignee_staff_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subtasks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subtasks_assignee_staff_id_fkey";
            columns: ["assignee_staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      channel_settings: {
        Row: {
          channel: Channel;
          display_name: string;
          commission_rate: number;
        };
        Insert: {
          channel: Channel;
          display_name: string;
          commission_rate?: number;
        };
        Update: Partial<Database["public"]["Tables"]["channel_settings"]["Insert"]>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          is_active: boolean;
          sort_order: number;
          parent_menu_item_id: string | null;
          hot_ice: HotIce | null;
          size: string | null;
          variant_label: string | null;
          list_price: number | null;
          recipe_category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          is_active?: boolean;
          sort_order?: number;
          parent_menu_item_id?: string | null;
          hot_ice?: HotIce | null;
          size?: string | null;
          variant_label?: string | null;
          list_price?: number | null;
          recipe_category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "menu_items_parent_menu_item_id_fkey";
            columns: ["parent_menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      channel_menu_item_mappings: {
        Row: {
          id: string;
          channel: Channel;
          external_name: string;
          menu_item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel: Channel;
          external_name: string;
          menu_item_id: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["channel_menu_item_mappings"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "channel_menu_item_mappings_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_channel_sales: {
        Row: {
          id: string;
          date: string;
          channel: Channel;
          gross_amount: number;
          net_amount: number;
          order_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          channel: Channel;
          gross_amount?: number;
          net_amount?: number;
          order_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_channel_sales"]["Insert"]>;
        Relationships: [];
      };
      menu_item_sales: {
        Row: {
          id: string;
          date: string;
          channel: Channel;
          menu_item_id: string | null;
          external_name: string;
          quantity: number;
          gross_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          channel: Channel;
          menu_item_id?: string | null;
          external_name: string;
          quantity?: number;
          gross_amount?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_item_sales"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "menu_item_sales_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_targets: {
        Row: {
          id: string;
          month: string;
          target_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          month: string;
          target_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales_targets"]["Insert"]>;
        Relationships: [];
      };
      marketing_campaigns: {
        Row: {
          id: string;
          type: CampaignType;
          date: string;
          menu_item_id: string | null;
          ad_cost: number | null;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: CampaignType;
          date: string;
          menu_item_id?: string | null;
          ad_cost?: number | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marketing_campaigns"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      monthly_reviews: {
        Row: {
          id: string;
          month: string;
          pl_image_storage_path: string | null;
          pl_image_file_name: string | null;
          pl_line_items: Record<string, unknown>[];
          meeting_notes: string | null;
          ai_plan: Record<string, unknown> | null;
          ai_plan_generated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          month: string;
          pl_image_storage_path?: string | null;
          pl_image_file_name?: string | null;
          pl_line_items?: Record<string, unknown>[];
          meeting_notes?: string | null;
          ai_plan?: Record<string, unknown> | null;
          ai_plan_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_reviews"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
