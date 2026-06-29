-- Create app_config table
CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gasoil_price NUMERIC NOT NULL DEFAULT 200.0,
  admin_emails TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial row if not exists
INSERT INTO app_config (gasoil_price, admin_emails)
SELECT 195.50, ARRAY['Haroldrospa@gmail.com']
WHERE NOT EXISTS (SELECT 1 FROM app_config);

-- Create choferes_budget table
CREATE TABLE IF NOT EXISTS choferes_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chofer_id TEXT NOT NULL,
  chofer_nombre TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_distancia_km NUMERIC NOT NULL,
  total_bultos INTEGER NOT NULL,
  total_conduces INTEGER NOT NULL,
  tiempo_estimado_min NUMERIC NOT NULL,
  combustible_galones NUMERIC NOT NULL,
  combustible_costo NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for querying by driver and date
CREATE INDEX IF NOT EXISTS choferes_budget_chofer_id_idx ON choferes_budget(chofer_id);
CREATE INDEX IF NOT EXISTS choferes_budget_fecha_idx ON choferes_budget(fecha);
