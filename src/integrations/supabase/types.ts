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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          ciudad: string
          contacto: string | null
          created_at: string | null
          encomendado: string | null
          grupo_cliente: string | null
          id: string
          numero_cliente: string
          razon_social: string
          rnc: string | null
          ruta: string | null
          ubicacion: string | null
          updated_at: string | null
          zona: string
        }
        Insert: {
          ciudad: string
          contacto?: string | null
          created_at?: string | null
          encomendado?: string | null
          grupo_cliente?: string | null
          id?: string
          numero_cliente: string
          razon_social: string
          rnc?: string | null
          ruta?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          zona: string
        }
        Update: {
          ciudad?: string
          contacto?: string | null
          created_at?: string | null
          encomendado?: string | null
          grupo_cliente?: string | null
          id?: string
          numero_cliente?: string
          razon_social?: string
          rnc?: string | null
          ruta?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          zona?: string
        }
        Relationships: []
      }
      conduces: {
        Row: {
          bulto_modificado: boolean | null
          cantidad_bultos: number
          cantidad_entregados: number | null
          ciudad: string | null
          created_at: string | null
          encomendado: string | null
          estado: string
          excepcion: boolean | null
          fecha_carga: string
          fecha_entrega: string
          firma: string | null
          hora_entrega_exacta: string | null
          id: string
          imagen: string | null
          laboratorio: string
          motivo_excepcion: string | null
          nota: string | null
          nota_modificacion_bulto: string | null
          numero_cliente: string | null
          numero_conduce: string
          numero_factura: string
          prioridad: boolean | null
          razon_social: string | null
          region: string
          relacion: string | null
          tiempo_entrega: string | null
          updated_at: string | null
        }
        Insert: {
          bulto_modificado?: boolean | null
          cantidad_bultos: number
          cantidad_entregados?: number | null
          ciudad?: string | null
          created_at?: string | null
          encomendado?: string | null
          estado: string
          excepcion?: boolean | null
          fecha_carga: string
          fecha_entrega: string
          firma?: string | null
          hora_entrega_exacta?: string | null
          id?: string
          imagen?: string | null
          laboratorio: string
          motivo_excepcion?: string | null
          nota?: string | null
          nota_modificacion_bulto?: string | null
          numero_cliente?: string | null
          numero_conduce: string
          numero_factura: string
          prioridad?: boolean | null
          razon_social?: string | null
          region: string
          relacion?: string | null
          tiempo_entrega?: string | null
          updated_at?: string | null
        }
        Update: {
          bulto_modificado?: boolean | null
          cantidad_bultos?: number
          cantidad_entregados?: number | null
          ciudad?: string | null
          created_at?: string | null
          encomendado?: string | null
          estado?: string
          excepcion?: boolean | null
          fecha_carga?: string
          fecha_entrega?: string
          firma?: string | null
          hora_entrega_exacta?: string | null
          id?: string
          imagen?: string | null
          laboratorio?: string
          motivo_excepcion?: string | null
          nota?: string | null
          nota_modificacion_bulto?: string | null
          numero_cliente?: string | null
          numero_conduce?: string
          numero_factura?: string
          prioridad?: boolean | null
          razon_social?: string | null
          region?: string
          relacion?: string | null
          tiempo_entrega?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conduces_numero_cliente_fkey"
            columns: ["numero_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["numero_cliente"]
          },
        ]
      }
      control_conduces: {
        Row: {
          conduce_number: string
          created_at: string
          estado: string
          fecha_entrega: string
          id: string
          notas: string | null
          relacion_id: string
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          conduce_number: string
          created_at?: string
          estado?: string
          fecha_entrega?: string
          id?: string
          notas?: string | null
          relacion_id: string
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          conduce_number?: string
          created_at?: string
          estado?: string
          fecha_entrega?: string
          id?: string
          notas?: string | null
          relacion_id?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_conduces_relacion_id_fkey"
            columns: ["relacion_id"]
            isOneToOne: false
            referencedRelation: "relaciones_conduces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_conduces_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      dias_festivos: {
        Row: {
          created_at: string
          fecha: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fecha: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fecha?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      entregas_lam: {
        Row: {
          cantidad_bultos: number
          cliente: string
          created_at: string
          fecha_recogida: string
          firma_despachador: string
          id: string
          imagen_conduce: string
          notas: string | null
          updated_at: string
          usuario_id: string | null
          usuario_nombre: string | null
        }
        Insert: {
          cantidad_bultos: number
          cliente?: string
          created_at?: string
          fecha_recogida?: string
          firma_despachador: string
          id?: string
          imagen_conduce: string
          notas?: string | null
          updated_at?: string
          usuario_id?: string | null
          usuario_nombre?: string | null
        }
        Update: {
          cantidad_bultos?: number
          cliente?: string
          created_at?: string
          fecha_recogida?: string
          firma_despachador?: string
          id?: string
          imagen_conduce?: string
          notas?: string | null
          updated_at?: string
          usuario_id?: string | null
          usuario_nombre?: string | null
        }
        Relationships: []
      }
      pending_clientes: {
        Row: {
          created_at: string | null
          id: string
          numero_cliente: string
          zona: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          numero_cliente: string
          zona: string
        }
        Update: {
          created_at?: string | null
          id?: string
          numero_cliente?: string
          zona?: string
        }
        Relationships: []
      }
      relacion_conduces_fechas: {
        Row: {
          conduces_entregados: number
          conduces_entregados_lista: string[]
          conduces_entregados_nave: number | null
          conduces_entregados_nave_list: string[] | null
          conduces_pendientes: number
          created_at: string
          enviado_laboratorio: boolean | null
          fecha_carga: string | null
          fecha_envio_laboratorio: string | null
          fecha_relacion: string
          id: string
          lista_conduces: string[]
          relacion_id: string
          total_conduces: number
          updated_at: string
        }
        Insert: {
          conduces_entregados?: number
          conduces_entregados_lista?: string[]
          conduces_entregados_nave?: number | null
          conduces_entregados_nave_list?: string[] | null
          conduces_pendientes?: number
          created_at?: string
          enviado_laboratorio?: boolean | null
          fecha_carga?: string | null
          fecha_envio_laboratorio?: string | null
          fecha_relacion: string
          id?: string
          lista_conduces?: string[]
          relacion_id: string
          total_conduces?: number
          updated_at?: string
        }
        Update: {
          conduces_entregados?: number
          conduces_entregados_lista?: string[]
          conduces_entregados_nave?: number | null
          conduces_entregados_nave_list?: string[] | null
          conduces_pendientes?: number
          created_at?: string
          enviado_laboratorio?: boolean | null
          fecha_carga?: string | null
          fecha_envio_laboratorio?: string | null
          fecha_relacion?: string
          id?: string
          lista_conduces?: string[]
          relacion_id?: string
          total_conduces?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relacion_conduces_fechas_relacion_id_fkey"
            columns: ["relacion_id"]
            isOneToOne: false
            referencedRelation: "relaciones_conduces"
            referencedColumns: ["id"]
          },
        ]
      }
      relaciones_conduces: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      rutas_asignaciones: {
        Row: {
          ciudad: string
          created_at: string | null
          dia_semana: number
          encomendado: string
          id: string
          updated_at: string | null
        }
        Insert: {
          ciudad: string
          created_at?: string | null
          dia_semana: number
          encomendado: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          ciudad?: string
          created_at?: string | null
          dia_semana?: number
          encomendado?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          apellido: string
          auth_id: string | null
          camion: string | null
          created_at: string | null
          email: string
          id: string
          laboratorio: string | null
          nivel: number
          nombre: string
          password: string | null
          puesto: string
          updated_at: string | null
        }
        Insert: {
          apellido: string
          auth_id?: string | null
          camion?: string | null
          created_at?: string | null
          email: string
          id?: string
          laboratorio?: string | null
          nivel: number
          nombre: string
          password?: string | null
          puesto: string
          updated_at?: string | null
        }
        Update: {
          apellido?: string
          auth_id?: string | null
          camion?: string | null
          created_at?: string | null
          email?: string
          id?: string
          laboratorio?: string | null
          nivel?: number
          nombre?: string
          password?: string | null
          puesto?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      verified_shipments: {
        Row: {
          bulto_sequence: number | null
          conduce_id: string | null
          conduce_number: string
          created_at: string | null
          encomendado: string
          id: string
          scan_type: string
          updated_at: string | null
          user_id: string | null
          user_name: string | null
          verified_at: string | null
        }
        Insert: {
          bulto_sequence?: number | null
          conduce_id?: string | null
          conduce_number: string
          created_at?: string | null
          encomendado: string
          id?: string
          scan_type: string
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
          verified_at?: string | null
        }
        Update: {
          bulto_sequence?: number | null
          conduce_id?: string | null
          conduce_number?: string
          created_at?: string | null
          encomendado?: string
          id?: string
          scan_type?: string
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verified_shipments_conduce_id_fkey"
            columns: ["conduce_id"]
            isOneToOne: false
            referencedRelation: "conduces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_credentials: {
        Args: { email_param: string; password_param: string }
        Returns: {
          apellido: string
          auth_id: string | null
          camion: string | null
          created_at: string | null
          email: string
          id: string
          laboratorio: string | null
          nivel: number
          nombre: string
          password: string | null
          puesto: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "usuarios"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      delete_product_cascade: {
        Args: { target_product_id: string }
        Returns: undefined
      }
      get_all_users: {
        Args: never
        Returns: {
          apellido: string
          auth_id: string | null
          camion: string | null
          created_at: string | null
          email: string
          id: string
          laboratorio: string | null
          nivel: number
          nombre: string
          password: string | null
          puesto: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "usuarios"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_fast_count: { Args: { table_name: string }; Returns: number }
      get_global_bultos_stats: {
        Args: never
        Returns: {
          total_bultos_devueltos: number
          total_bultos_en_transito: number
          total_bultos_entregados: number
          total_conduces_devueltos: number
          total_conduces_en_transito: number
          total_conduces_entregados: number
        }[]
      }
      get_region_bultos_stats: {
        Args: { region_name: string }
        Returns: {
          region_bultos_devueltos: number
          region_bultos_en_transito: number
          region_bultos_entregados: number
          region_clientes_en_transito: number
          region_conduces_devueltos: number
          region_conduces_en_transito: number
          region_conduces_entregados: number
        }[]
      }
      get_usuario_by_id: {
        Args: { user_id: string }
        Returns: {
          apellido: string
          auth_id: string | null
          camion: string | null
          created_at: string | null
          email: string
          id: string
          laboratorio: string | null
          nivel: number
          nombre: string
          password: string | null
          puesto: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "usuarios"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_usuarios: {
        Args: never
        Returns: {
          apellido: string
          auth_id: string | null
          camion: string | null
          created_at: string | null
          email: string
          id: string
          laboratorio: string | null
          nivel: number
          nombre: string
          password: string | null
          puesto: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "usuarios"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_usuarios_by_puesto: {
        Args: { puesto_param: string }
        Returns: {
          apellido: string
          auth_id: string | null
          camion: string | null
          created_at: string | null
          email: string
          id: string
          laboratorio: string | null
          nivel: number
          nombre: string
          password: string | null
          puesto: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "usuarios"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      import_mock_clientes: { Args: never; Returns: undefined }
      import_mock_data: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_user_admin: { Args: { user_id: string }; Returns: boolean }
      update_usuario: {
        Args: { user_data: Json; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
