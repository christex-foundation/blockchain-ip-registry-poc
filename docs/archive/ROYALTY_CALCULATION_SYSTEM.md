# Royalty Calculation System

This document explains how the IP OnChain platform calculates and distributes royalties based on usage data from various sources.

## Overview

The royalty system simulates real-world music industry revenue streams by tracking usage events from different platforms and calculating earnings based on industry-standard rates. This provides realistic metrics for intellectual property portfolio management.

## Revenue Stream Categories

### 1. Performance Royalties (60% of events)
**Sources**: Streaming platforms, radio stations
- **Streaming**: Spotify, Apple Music, YouTube Music, Tidal, Deezer
- **Radio**: FM radio, internet radio, satellite radio

**Revenue Rates**:
- Streaming: $0.001 - $0.003 per stream (0.001 - 0.003 SOL)
- Radio: $0.01 - $0.03 per play (0.01 - 0.03 SOL)

### 2. Mechanical Royalties (20% of events)
**Sources**: Digital downloads, physical sales
- **Platforms**: iTunes, Amazon Music, Bandcamp, Beatport

**Revenue Rates**:
- Downloads: $0.50 - $1.00 per unit (0.50 - 1.00 SOL)

### 3. Synchronization Royalties (5% of events)
**Sources**: Commercial usage in media
- **Types**: TV commercials, film soundtracks, YouTube content, podcasts

**Revenue Rates**:
- Sync deals: $50 - $250 per placement (50 - 250 SOL)

## Calculation Engine

### Real-Time Processing
1. **Usage Event Ingestion**: Platform reports are received via `/api/usage-events`
2. **Automatic Calculation**: Each event triggers royalty recalculation via `/api/royalties/calculate`
3. **Category Breakdown**: Earnings are separated by performance, mechanical, and sync
4. **Dashboard Updates**: Metrics refresh to show current totals and trends

### Earnings Formula
```typescript
// For each work
const earnings = {
  performance: sum(streams + radio_plays) * respective_rates,
  mechanical: sum(downloads) * download_rates,
  sync: sum(sync_deals) * sync_rates,
  total: performance + mechanical + sync
}

// Per contributor
const contributorEarnings = (totalEarnings * contributorShare) / 100
```

## Mock Data Simulation

### What the "Generate Mock Data" Button Does

The mock data generator simulates realistic usage reporting that would come from external platforms in a real IP management system.

#### Simulation Parameters
- **Time Period**: 30 days of historical data (configurable)
- **Event Frequency**: ~8 events per day per work (configurable)
- **Platform Distribution**: Weighted realistic distribution
- **Revenue Rates**: Industry-standard rates per platform type

#### Realistic Patterns Simulated

1. **Platform Popularity**:
   - Spotify dominates streaming (largest user base)
   - iTunes leads downloads
   - Sync deals are rare but high-value

2. **Time-Based Accumulation**:
   - Older works have accumulated more plays over time
   - Recent works show growth patterns
   - Seasonal variations in certain platforms

3. **Work Complexity Correlation**:
   - Works with more contributors often represent higher-budget productions
   - Higher complexity = potentially higher earning potential
   - Professional collaborations tend to perform better

#### Generated Event Examples
```json
{
  "workId": "uuid",
  "eventType": "stream",
  "platform": "spotify",
  "playCount": 1247,
  "revenueAmount": 2.8943,
  "periodStart": "2024-01-15T00:00:00Z",
  "periodEnd": "2024-01-16T00:00:00Z"
}
```

## Database Schema

### Usage Events Table
```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY,
  work_id UUID REFERENCES works(id),
  event_type VARCHAR(50) CHECK (event_type IN ('stream', 'download', 'radio', 'sync')),
  platform VARCHAR(100),
  play_count INTEGER,           -- For streams/radio
  unit_count INTEGER,           -- For downloads
  revenue_amount DECIMAL(10,4), -- In SOL
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  reported_at TIMESTAMP
);
```

### Royalty Earnings Table
```sql
CREATE TABLE royalty_earnings (
  id UUID PRIMARY KEY,
  work_id UUID UNIQUE REFERENCES works(id),
  total_earnings DECIMAL(10,4),
  performance_earnings DECIMAL(10,4),  -- Streams + radio
  mechanical_earnings DECIMAL(10,4),   -- Downloads
  sync_earnings DECIMAL(10,4),         -- Commercial usage
  last_calculated_at TIMESTAMP
);
```

## API Endpoints

### Data Ingestion
- **POST** `/api/usage-events` - Receive usage reports from platforms
- **POST** `/api/royalties/calculate` - Trigger recalculation for specific works

### Data Retrieval
- **GET** `/api/royalties/earnings?workId=xxx` - Get earnings for specific work
- **GET** `/api/royalties/trends?period=monthly` - Get trend analysis

### Testing & Simulation
- **POST** `/api/mock-usage` - Generate realistic mock data for testing

## Dashboard Metrics

### Primary Metrics
1. **Total Royalties**: Sum of all earnings across all works
2. **Active Contributors**: Unique wallet addresses receiving royalties
3. **Average Performance**: Average earnings per work
4. **Portfolio Breakdown**: Distribution across performance/mechanical/sync

### Dynamic Trends
- **Monthly Trends**: Compare last 30 days vs previous 30 days
- **Weekly Trends**: Compare last 7 days vs previous 7 days
- **Growth Indicators**: Real percentage changes, not hardcoded values

## Real-World Integration

### External Data Sources (Future Implementation)
In a production environment, usage data would come from:

1. **Streaming Platforms**: Spotify for Artists, Apple Music for Artists API
2. **Radio Monitoring**: Musicmatch, SESAC, BMI reporting
3. **Download Platforms**: iTunes Connect, Amazon Music reporting
4. **Sync Licensing**: Manual entry from licensing deals

### Reporting Cycles
- **Streaming**: Monthly reports (industry standard)
- **Radio**: Weekly to monthly depending on station
- **Downloads**: Monthly or quarterly
- **Sync**: Per-deal basis

## Testing the System

### Quick Test Flow
1. Register a new work with contributors
2. Click "Generate Mock Data" on dashboard
3. Observe realistic metrics appear based on:
   - Work age (older = more accumulated earnings)
   - Contributor count (more = potentially higher complexity)
   - Platform distribution (streaming-heavy, realistic sync deals)

### Expected Results
- **New Work**: 0.5 - 5 SOL total earnings over 30 days
- **Older Work**: 5 - 50 SOL accumulated over longer periods
- **High-Contributor Work**: Higher average due to complexity factor

### Trend Verification
- Generate data, note metrics
- Generate more data for same works
- Verify trends show realistic growth percentages

## Technical Architecture

### Data Flow
```
External Platforms → Usage Events API → Calculation Engine → Database → Dashboard
     ↓
Mock Generator → (simulates above flow)
```

### Calculation Triggers
1. **New Usage Events**: Automatic recalculation on ingestion
2. **Manual Refresh**: Dashboard button triggers recalculation
3. **Scheduled**: Could add periodic recalculation for batch processing

### Performance Considerations
- Indexed by work_id for fast lookup
- Earnings stored separately from events for quick dashboard loading
- Batch processing for large usage event imports

This system provides a realistic foundation for understanding how IP royalty management works in practice, with industry-standard rates and realistic usage patterns.