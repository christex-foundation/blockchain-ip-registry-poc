-- Add usage events table to track performance, mechanical, and sync royalties
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('stream', 'download', 'radio', 'sync')),
  platform VARCHAR(100) NOT NULL, -- 'spotify', 'apple_music', 'radio_station_x', 'tv_commercial', etc.
  play_count INTEGER DEFAULT 0, -- For streams/radio plays
  unit_count INTEGER DEFAULT 0, -- For downloads/sales
  revenue_amount DECIMAL(10, 4) NOT NULL, -- Revenue in SOL or other currency
  currency VARCHAR(10) DEFAULT 'SOL',
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add royalty earnings table to track calculated earnings per work
CREATE TABLE IF NOT EXISTS royalty_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  total_earnings DECIMAL(10, 4) NOT NULL DEFAULT 0,
  performance_earnings DECIMAL(10, 4) NOT NULL DEFAULT 0, -- streams, radio
  mechanical_earnings DECIMAL(10, 4) NOT NULL DEFAULT 0, -- downloads, sales
  sync_earnings DECIMAL(10, 4) NOT NULL DEFAULT 0, -- commercial usage
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usage_events_work_id ON usage_events(work_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_period ON usage_events(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_events_reported_at ON usage_events(reported_at);
CREATE INDEX IF NOT EXISTS idx_royalty_earnings_work_id ON royalty_earnings(work_id);

-- Create updated_at trigger for royalty_earnings
CREATE TRIGGER update_royalty_earnings_updated_at BEFORE UPDATE ON royalty_earnings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint to prevent duplicate earnings records per work
ALTER TABLE royalty_earnings ADD CONSTRAINT unique_work_earnings UNIQUE (work_id);