# Plan 41: Analytics & Statistics System

## Overview

A comprehensive analytics system for tracking user interactions, engagement metrics, and business insights. Essential for enterprise customers who need visibility into guestbook performance and guest behavior.

## Goals

1. **Track user interactions** (page views, clicks, form submissions)
2. **Measure engagement** (time on page, completion rates, bounce rates)
3. **Provide actionable insights** (popular times, device breakdown, geographic data)
4. **Support enterprise reporting** (exportable data, API access)
5. **Respect privacy** (GDPR-compliant, anonymization options)

---

## Phase 1: Event Tracking Infrastructure

### 1.1 Database Schema

Create analytics tables with time-series optimization:

```sql
-- Core events table (partitioned by month for performance)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(12) NOT NULL REFERENCES tenants(id),
  guestbook_id VARCHAR(12) REFERENCES guestbooks(id),

  -- Event identification
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(30) NOT NULL,

  -- Session tracking (anonymous)
  session_id VARCHAR(64) NOT NULL,
  visitor_id VARCHAR(64), -- Hashed, for returning visitor detection

  -- Context
  page_path VARCHAR(255),
  referrer VARCHAR(500),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- Device & Location (anonymized)
  device_type VARCHAR(20), -- mobile, tablet, desktop
  browser VARCHAR(50),
  os VARCHAR(50),
  country_code CHAR(2),
  region VARCHAR(100),

  -- Event-specific data (JSONB for flexibility)
  properties JSONB DEFAULT '{}',

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_events_tenant_time (tenant_id, created_at DESC),
  INDEX idx_events_guestbook_time (guestbook_id, created_at DESC),
  INDEX idx_events_type (event_type, created_at DESC),
  INDEX idx_events_session (session_id)
);

-- Aggregated daily stats (materialized for fast queries)
CREATE TABLE analytics_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(12) NOT NULL REFERENCES tenants(id),
  guestbook_id VARCHAR(12) REFERENCES guestbooks(id),
  date DATE NOT NULL,

  -- Traffic metrics
  page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  sessions INT DEFAULT 0,

  -- Engagement metrics
  entries_created INT DEFAULT 0,
  entries_with_photo INT DEFAULT 0,
  form_starts INT DEFAULT 0,
  form_completions INT DEFAULT 0,
  avg_time_on_page_seconds INT,
  bounce_rate DECIMAL(5,2),

  -- Device breakdown
  mobile_visits INT DEFAULT 0,
  tablet_visits INT DEFAULT 0,
  desktop_visits INT DEFAULT 0,

  -- Source breakdown
  direct_visits INT DEFAULT 0,
  nfc_visits INT DEFAULT 0,
  qr_visits INT DEFAULT 0,
  link_visits INT DEFAULT 0,

  -- Peak hours (JSON array of 24 hourly counts)
  hourly_distribution JSONB DEFAULT '[]',

  UNIQUE(tenant_id, guestbook_id, date)
);

-- Session details for funnel analysis
CREATE TABLE analytics_sessions (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(12) NOT NULL REFERENCES tenants(id),
  guestbook_id VARCHAR(12) REFERENCES guestbooks(id),
  visitor_id VARCHAR(64),

  -- Session info
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,

  -- Journey
  entry_page VARCHAR(255),
  exit_page VARCHAR(255),
  page_count INT DEFAULT 1,

  -- Conversion
  converted BOOLEAN DEFAULT FALSE, -- Created an entry
  form_step_reached INT DEFAULT 0,

  -- Source
  source VARCHAR(20), -- nfc, qr, direct, referral
  referrer VARCHAR(500),

  -- Device
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  country_code CHAR(2)
);
```

### 1.2 Event Types to Track

| Category | Event Type | Properties | Description |
|----------|------------|------------|-------------|
| **Page** | `page_view` | `path`, `title` | User viewed a page |
| **Page** | `page_exit` | `path`, `time_spent` | User left the page |
| **Form** | `form_start` | `step` | User opened the form |
| **Form** | `form_step_complete` | `step`, `duration` | Completed a form step |
| **Form** | `form_abandon` | `step`, `duration` | Left form without submitting |
| **Form** | `form_submit` | `has_photo`, `fields_filled` | Submitted an entry |
| **Entry** | `entry_view` | `entry_id` | Viewed an entry detail |
| **Entry** | `entry_share` | `entry_id`, `method` | Shared an entry |
| **Slideshow** | `slideshow_start` | - | Started slideshow |
| **Slideshow** | `slideshow_exit` | `duration`, `slides_viewed` | Exited slideshow |
| **Export** | `pdf_export` | `entry_count` | Exported PDF |
| **QR** | `qr_scan` | `event_name` | Scanned QR code |
| **NFC** | `nfc_tap` | `event_name` | Tapped NFC tag |
| **Admin** | `settings_change` | `setting_key` | Changed a setting |
| **Admin** | `entry_moderate` | `action`, `entry_id` | Moderated an entry |

### 1.3 Client-Side Tracking Composable

Create `useAnalytics` composable:

```typescript
// app/composables/useAnalytics.ts
export function useAnalytics() {
  const sessionId = useSessionId()
  const visitorId = useVisitorId() // Hashed, localStorage-based

  async function track(
    eventType: string,
    properties?: Record<string, unknown>
  ): Promise<void>

  async function trackPageView(path?: string): Promise<void>

  async function trackFormStep(step: number, duration?: number): Promise<void>

  async function trackConversion(hasPhoto: boolean): Promise<void>

  function startSession(): void
  function endSession(): void

  return {
    track,
    trackPageView,
    trackFormStep,
    trackConversion,
    sessionId
  }
}
```

---

## Phase 2: API Endpoints

### 2.1 Event Collection Endpoint

```
POST /api/analytics/events
```

- Accepts batch events for efficiency
- Rate-limited per session
- Validates event types
- Queues for async processing

### 2.2 Analytics Query Endpoints (Authenticated)

```
GET /api/tenants/:uuid/analytics/overview
  ?period=7d|30d|90d|custom
  &start=2024-01-01
  &end=2024-01-31
  &guestbook_id=optional

GET /api/tenants/:uuid/analytics/traffic
  ?period=...
  &granularity=hour|day|week

GET /api/tenants/:uuid/analytics/engagement
  ?period=...

GET /api/tenants/:uuid/analytics/sources
  ?period=...

GET /api/tenants/:uuid/analytics/devices
  ?period=...

GET /api/tenants/:uuid/analytics/geography
  ?period=...

GET /api/tenants/:uuid/analytics/funnel
  ?period=...

GET /api/tenants/:uuid/analytics/export
  ?format=csv|json
  &period=...
```

### 2.3 Real-time Endpoint (WebSocket/SSE)

```
GET /api/tenants/:uuid/analytics/live
```

- Live visitor count
- Recent events stream
- Useful for event displays

---

## Phase 3: Dashboard UI

### 3.1 Analytics Dashboard Page

Route: `/t/:uuid/analytics` or `/g/:id/analytics`

#### Overview Cards
- **Total Visitors** (with trend %)
- **Entries Created** (with trend %)
- **Conversion Rate** (form starts → completions)
- **Avg. Time on Page**

#### Charts
1. **Traffic Over Time** (line chart)
   - Page views vs. unique visitors
   - Filterable by date range

2. **Source Breakdown** (pie/donut chart)
   - NFC taps
   - QR scans
   - Direct links
   - Referrals

3. **Device Distribution** (horizontal bar)
   - Mobile / Tablet / Desktop

4. **Peak Hours Heatmap**
   - Hour × Day of Week matrix
   - Helps optimize event timing

5. **Form Funnel** (funnel chart)
   - Step 1: Basics → Step 2: Favorites → ... → Submitted
   - Shows drop-off at each step

6. **Geographic Map** (optional, enterprise)
   - Visitor locations by country/region

### 3.2 UI Components

```
app/components/analytics/
├── AnalyticsOverview.vue      # KPI cards
├── TrafficChart.vue           # Line chart
├── SourcesChart.vue           # Pie chart
├── DevicesChart.vue           # Bar chart
├── PeakHoursHeatmap.vue       # Heatmap
├── FunnelChart.vue            # Funnel visualization
├── GeographyMap.vue           # Map (enterprise)
├── LiveVisitors.vue           # Real-time counter
├── DateRangePicker.vue        # Period selector
└── AnalyticsExport.vue        # Export button
```

### 3.3 Chart Library

Recommend: **Chart.js** with `vue-chartjs` wrapper
- Lightweight (~60kb)
- Good Vue 3 support
- Sufficient chart types

Alternative: **Apache ECharts** for enterprise features (maps, complex interactions)

---

## Phase 4: Privacy & Compliance

### 4.1 GDPR Compliance

1. **No PII Storage**
   - Visitor IDs are hashed (SHA-256)
   - IP addresses are NOT stored
   - Geographic data limited to country/region level

2. **Data Retention**
   - Raw events: 90 days (configurable)
   - Aggregated stats: 2 years
   - Auto-cleanup via scheduled job

3. **Consent Banner** (optional per tenant)
   - Analytics can be disabled per guestbook
   - Respects Do Not Track (DNT) header

4. **Data Export**
   - Users can request their session data
   - Tenant admins can export all analytics

### 4.2 Anonymization

```typescript
// Visitor ID generation (no cookies, fingerprint-free)
function generateVisitorId(): string {
  // Use localStorage + random salt
  // Hash with SHA-256
  // Rotates monthly for privacy
}

// Session ID (per-visit only)
function generateSessionId(): string {
  // Random UUID per browser tab
  // No cross-session tracking
}
```

---

## Phase 5: Enterprise Features (Business/Enterprise Plans)

### 5.1 Advanced Analytics

- **Cohort Analysis**: Compare visitor groups over time
- **A/B Testing Support**: Track variants in form/landing page
- **Custom Events**: Define tenant-specific events via API
- **Webhook Notifications**: Real-time event forwarding

### 5.2 White-Label Reports

- PDF report generation
- Scheduled email reports (daily/weekly/monthly)
- Branded with tenant logo

### 5.3 API Analytics Access

- Full analytics data via API
- Scoped API tokens for analytics
- Rate limits based on plan

---

## Phase 6: Implementation Tasks

### Step 1: Database Setup
- [ ] Create `analytics_events` table
- [ ] Create `analytics_daily_stats` table
- [ ] Create `analytics_sessions` table
- [ ] Set up table partitioning (by month)
- [ ] Create aggregation triggers/jobs

### Step 2: Event Collection
- [ ] Create `POST /api/analytics/events` endpoint
- [ ] Implement event validation
- [ ] Add rate limiting
- [ ] Create async queue for processing

### Step 3: Client Tracking
- [ ] Create `useAnalytics` composable
- [ ] Create `useSessionId` composable
- [ ] Create `useVisitorId` composable
- [ ] Integrate tracking in guest pages
- [ ] Track form wizard steps
- [ ] Track NFC/QR sources

### Step 4: Aggregation
- [ ] Create daily aggregation job (cron)
- [ ] Implement session stitching
- [ ] Calculate derived metrics (bounce rate, etc.)

### Step 5: Query API
- [ ] `GET /api/tenants/:uuid/analytics/overview`
- [ ] `GET /api/tenants/:uuid/analytics/traffic`
- [ ] `GET /api/tenants/:uuid/analytics/engagement`
- [ ] `GET /api/tenants/:uuid/analytics/sources`
- [ ] `GET /api/tenants/:uuid/analytics/devices`
- [ ] `GET /api/tenants/:uuid/analytics/funnel`
- [ ] `GET /api/tenants/:uuid/analytics/export`

### Step 6: Dashboard UI
- [ ] Create analytics page route
- [ ] Implement `AnalyticsOverview` component
- [ ] Implement `TrafficChart` component
- [ ] Implement `SourcesChart` component
- [ ] Implement `DevicesChart` component
- [ ] Implement `PeakHoursHeatmap` component
- [ ] Implement `FunnelChart` component
- [ ] Implement `DateRangePicker` component
- [ ] Implement `AnalyticsExport` component

### Step 7: Privacy
- [ ] Implement visitor ID hashing
- [ ] Add DNT header support
- [ ] Create data retention cleanup job
- [ ] Add analytics toggle in guestbook settings

### Step 8: i18n
- [ ] Add English translations for analytics
- [ ] Add German translations for analytics

### Step 9: Plan Restrictions
- [ ] Free: Basic stats (last 7 days, limited metrics)
- [ ] Home: Full stats (30 days)
- [ ] Family: Extended stats (90 days) + export
- [ ] Enterprise: Full API access + custom events + reports

---

## Data Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Guest Page    │────▶│  /api/analytics │────▶│  Event Queue    │
│  (useAnalytics) │     │    /events      │     │   (in-memory)   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin Dashboard│◀────│  /api/analytics │◀────│ analytics_events│
│   (Charts)      │     │    /overview    │     │     (table)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ Daily Cron Job  │
                                                │ (Aggregation)   │
                                                └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │analytics_daily_ │
                                                │     stats       │
                                                └─────────────────┘
```

---

## Metrics Definitions

| Metric | Definition |
|--------|------------|
| **Page View** | Each page load (includes refreshes) |
| **Unique Visitor** | Distinct visitor IDs per day |
| **Session** | Continuous activity with <30min gaps |
| **Bounce Rate** | Sessions with only 1 page view / Total sessions |
| **Conversion Rate** | Entries created / Form starts |
| **Avg. Time on Page** | Sum of page durations / Page views |
| **Form Completion Rate** | Submissions / Form starts |
| **Drop-off Rate** | (Step N - Step N+1) / Step N |

---

## Security Considerations

1. **Event Validation**: Only accept known event types
2. **Rate Limiting**: Max 100 events/minute per session
3. **No Injection**: Sanitize all string properties
4. **RLS**: Analytics data isolated per tenant
5. **API Auth**: Analytics endpoints require valid JWT
6. **Audit Log**: Track who accessed analytics

---

## Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `chart.js` | Chart rendering | ~60kb |
| `vue-chartjs` | Vue 3 wrapper | ~10kb |
| `date-fns` | Date manipulation | Already installed |

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Infrastructure | 2-3 days |
| Phase 2: API | 1-2 days |
| Phase 3: Dashboard | 3-4 days |
| Phase 4: Privacy | 1 day |
| Phase 5: Enterprise | 2-3 days |
| **Total** | **10-14 days** |

---

## Success Metrics

- [ ] 95% of events captured successfully
- [ ] Dashboard loads in <2 seconds
- [ ] Aggregation job completes in <5 minutes
- [ ] Zero PII in analytics database
- [ ] Export generates in <10 seconds for 90 days
