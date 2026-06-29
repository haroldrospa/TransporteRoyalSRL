-- Enable realtime for tables that need real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE control_conduces;
ALTER PUBLICATION supabase_realtime ADD TABLE relacion_conduces_fechas;
ALTER PUBLICATION supabase_realtime ADD TABLE conduces;

-- Set replica identity to full for complete row data during updates
ALTER TABLE control_conduces REPLICA IDENTITY FULL;
ALTER TABLE relacion_conduces_fechas REPLICA IDENTITY FULL;
ALTER TABLE conduces REPLICA IDENTITY FULL;