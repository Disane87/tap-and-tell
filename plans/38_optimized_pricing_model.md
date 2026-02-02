# Plan 38: Optimized Pricing Model

## Executive Summary

**Goal**: Design a pricing model that maximizes conversions while remaining profitable.

**Recommended Strategy**: Hybrid guestbook-based model with Event Pass option
- **Free**: 1 guestbook, 150 entries, watermarked PDF, branding
- **Starter** ($4/mo or $40/yr): 3 guestbooks, unlimited entries, no branding/watermarks
- **Pro** ($10/mo or $100/yr): Unlimited guestbooks, team collaboration, analytics, custom domain
- **Event Pass** ($12 one-time): 1 guestbook, 90-day active period, then read-only archive

**Key Insights**:
- 150-entry free tier balances generosity with upgrade pressure
- $4 Starter price is impulse-purchase territory
- Event Pass captures "wedding-only" segment without subscription friction
- 17% annual discount incentivizes yearly commitments
- Projected 18% conversion rate → ~$1,062 MRR at 1,000 users

**Next Steps**: Database schema updates → Stripe integration → Frontend UI → Conversion optimization

---

## Context

The current pricing model (Plan 28) has these tiers:
- **Free**: 1 home, 50 entries, basic customization, branding
- **Home** ($5/mo or $48/yr): 1 home, unlimited entries, full customization
- **Family** ($12/mo or $99/yr): 5 homes, everything from Home
- **Enterprise**: Custom pricing, unlimited homes, API, SSO, white-label

**Problem**: This model has several conversion barriers:
1. Free tier is too limited (50 entries fills up fast at events)
2. Jump from Free → Home requires payment before users see full value
3. No event-specific pricing (weddings are one-time use cases)
4. Entry limits don't match real usage patterns

## Proposed Pricing Strategy

### Core Principles

1. **Balanced free tier** — Let users experience value, but not unlimited (150 entries is generous for trials)
2. **Event-focused pricing** — Align pricing with actual use cases (one-time events vs permanent guestbooks)
3. **Remove friction** — No payment required until users hit real limits
4. **Predictable costs** — Clear, simple pricing with no surprises
5. **Event Pass as differentiation** — This is our killer feature for the wedding/event market

### User Decision: Hybrid Model (Guestbook-Limits + Event Pass)

Based on user feedback, the recommended model is:
- **Guestbook-based limits** for subscription tiers (simple, predictable)
- **Event Pass** as a one-time purchase option (captures event-only segment)
- **150 entry limit on Free tier** (generous for testing, but creates upgrade pressure)

### Final Tier Structure

#### **Free Tier** (The Hook)
- **1 guestbook** (permanent or event)
- **150 entries maximum**
- **Full customization** (colors, themes, welcome message)
- **Moderation** ✓
- **Slideshow mode** ✓
- **Photo uploads** ✓
- **PDF export** ✓ (watermarked with "Created with Tap & Tell")
- **Branding**: "Powered by Tap & Tell" badge on guest-facing pages
- **Support**: Community/documentation

**Rationale**: 150 entries is enough for most people to test the product thoroughly (small event or home use), but creates natural upgrade pressure for larger events. The watermarked PDF and branding provide additional upgrade incentives.

#### **Starter** — $4/month or $40/year (save $8 — 17% discount)
- **3 guestbooks**
- **Unlimited entries per guestbook**
- Everything from Free
- **Remove branding** ✓
- **No watermarks on PDF** ✓
- **Email support**

**Rationale**: Affordable entry point for users who need multiple guestbooks (e.g., home + birthday + holiday party). $4/month is still impulse-purchase territory while providing better margin than $3.

#### **Pro** — $10/month or $100/year (save $20 — 17% discount)
- **Unlimited guestbooks**
- **Unlimited entries**
- Everything from Starter
- **Team collaboration** (5 members)
- **Analytics** (entry trends, popular times, guest demographics)
- **Custom domain** (CNAME support)
- **Priority support**

**Rationale**: For power users, venues, event planners, or hosts managing many events. Analytics and team features justify the jump. $10/month is still very competitive vs alternatives.

#### **Event Pass** — $12 one-time
- **1 guestbook** (event type, 90-day active period)
- **Unlimited entries during active period**
- **Full customization**
- **No branding**
- **PDF export** (no watermark)
- **Email support during event period**
- **After 90 days**: Converts to **read-only archive** (view entries, slideshow, download PDF — no new entries)

**Rationale**: Perfect for weddings, birthdays, or one-time events. Users pay once, get full features during the event, then the guestbook becomes a permanent archive. This captures the "I only need this for my wedding" segment without forcing them into a subscription. The read-only archive provides lasting value without ongoing costs.

### Why Guestbook-Based Model Wins

**Advantages**:
- Simple to understand ("I need 3 guestbooks → Starter plan")
- Predictable costs for users
- Predictable MRR for business
- No surprise bills (unlike usage-based)
- Aligns with product structure (guestbooks are core entities)

**Event Pass complements this perfectly**:
- Solves "I only need this once" problem
- No subscription friction
- Higher one-time price point ($12 vs $4/mo first month)
- Creates urgency (90-day active period)

## Feature Gate Strategy (FINAL)

| Feature | Free | Starter ($4/mo) | Pro ($10/mo) | Event Pass ($12) |
|---------|------|-----------------|--------------|------------------|
| Guestbooks | 1 | 3 | ∞ | 1 (90 days active) |
| Entries per GB | **150 max** | ∞ | ∞ | ∞ (during active) |
| Customization | Full | Full | Full | Full |
| Moderation | ✓ | ✓ | ✓ | ✓ |
| Slideshow | ✓ | ✓ | ✓ | ✓ |
| PDF Export | Watermarked | Clean | Clean | Clean |
| Branding Removal | ✗ | ✓ | ✓ | ✓ |
| Team Members | 1 | 1 | 5 | 1 |
| Analytics | ✗ | ✗ | ✓ | ✗ |
| Custom Domain | ✗ | ✗ | ✓ | ✗ |
| Support | Docs | Email | Priority | Email (90 days) |
| After Expiry | — | — | — | Read-only archive |

## Revenue Projections (UPDATED)

### Assumptions
- 1000 registered users (first 6 months post-launch)
- **18% conversion to paid** — higher than industry average due to:
  - 150-entry free tier is generous but limited
  - Event Pass removes subscription friction for one-time users
  - Clear upgrade paths with visible value (branding, PDF watermark)
- **User Mix**: 45% Starter, 35% Pro, 15% Event Pass, 5% remain on Free long-term

### Monthly Recurring Revenue (MRR)

#### Subscription Users (180 paid users)
- **Starter**: 81 users × $4 = **$324/month**
- **Pro**: 63 users × $10 = **$630/month**
- **Event Pass**: 27 users × $12 = **$324** (one-time, ~$108/month amortized over 3 months)
- **Total MRR**: **$954/month** (recurring) + **$108/month** (Event Pass amortized)
- **Effective MRR**: **~$1,062/month**

### Annual Revenue (ARR)

**Year 1 Projection**:
- Assuming 30% choose annual plans (17% discount):
  - Annual subscribers: 54 users (30% of 180)
  - Monthly subscribers: 126 users (70% of 180)
- Monthly recurring: $672/month × 12 = **$8,064**
- Annual upfront: 54 users × avg $70 = **$3,780**
- Event Pass: 27 per quarter × 4 = **108 × $12 = $1,296**
- **Total Year 1 ARR**: **~$13,140**

### Growth Scenarios (Year 1)

| Scenario | Users | Conversion | MRR | ARR (Year 1) |
|----------|-------|------------|-----|--------------|
| Conservative | 1,000 | 15% | $880 | ~$10,560 |
| **Realistic** | **1,000** | **18%** | **$1,062** | **~$13,140** |
| Moderate | 3,000 | 20% | $3,540 | ~$42,480 |
| Optimistic | 10,000 | 22% | $13,200 | ~$158,400 |

### Break-Even Analysis

**Estimated Monthly Costs**:
- Hosting (Vercel Pro): $20/month
- Database (Postgres): $25/month
- Email (Resend): $20/month (up to 50k emails)
- Storage (Vercel Blob): $10/month (estimate)
- Misc (domain, monitoring): $10/month
- **Total**: ~$85/month

**Break-even**: ~80 paid users (mix of Starter/Pro)
**Projected**: 180 paid users → **12.5x margin**

## Conversion Optimization Strategy

### Critical Upgrade Triggers (In-App)

#### 1. Entry Limit Warning (Free Tier)
- At **120/150 entries**: Show banner "You're approaching your entry limit. Upgrade to Starter for unlimited entries ($4/mo)"
- At **150/150 entries**: Block new entries, show interstitial: "You've reached your entry limit. Upgrade now or entries won't be saved."
- Include testimonial: "I upgraded after my housewarming party hit 80 entries. Best $4/month I spend!" — Sarah M.

#### 2. PDF Export (Free Tier)
- When clicking "Export PDF", show preview with watermark
- Modal: "Remove watermark and branding for $4/month. Your guests deserve a professional keepsake."
- One-click upgrade button

#### 3. Branding Badge (Free Tier)
- Guest-facing pages show "Powered by Tap & Tell" badge at bottom
- Owner sees tooltip on hover: "Remove this badge with Starter ($4/mo)"
- A/B test: make badge more prominent vs subtle

#### 4. Multiple Guestbooks (Free → Starter)
- When user tries to create 2nd guestbook: "Upgrade to Starter ($4/mo) to manage 3 guestbooks"
- Show use cases: "Perfect for: Home + Birthday + Holiday Party"

#### 5. Event Pass Promotion (New Users)
- When creating first guestbook, ask: "Is this for a one-time event?"
  - If yes: Highlight Event Pass option: "$12 one-time, no subscription. Active for 90 days, then becomes a permanent archive."
  - Show comparison table: Event Pass vs Starter (monthly)

#### 6. Analytics Teaser (Starter → Pro)
- Show blurred analytics dashboard with overlay: "See when your guests are most active. Upgrade to Pro for $10/mo."
- Preview: "143 entries this week" (blurred chart)

#### 7. Team Collaboration (Starter → Pro)
- When user tries to invite a 2nd member: "Upgrade to Pro ($10/mo) to collaborate with up to 5 team members"
- Use case: "Perfect for wedding planners, event venues, or large families"

### Email Conversion Sequences

#### Onboarding Email Sequence (Free Users)
1. **Day 0** (immediately): Welcome email, setup tips
2. **Day 3**: "3 ways to customize your guestbook" (showcase features)
3. **Day 7**: "Did you know? Tap & Tell supports NFC tags" (share link to recommended tags)
4. **Day 14**: "You're at 45/150 entries! Upgrade for unlimited" (personalized based on usage)
5. **Day 30**: "Remove branding for just $4/month" (social proof, testimonials)

#### Event Pass Follow-Up (Post-Event)
- **60 days**: "Your event pass expires in 30 days. It will become a read-only archive."
- **85 days**: "Last chance to add entries! Upgrade to Pro to keep it active forever."
- **95 days** (post-expiry): "Your guestbook is now archived. Upgrade to Pro anytime to reactivate."

### Landing Page Conversion Elements

#### Pricing Page (`/pricing`)
- **Hero**: "Start Free. Upgrade When You're Ready."
- **Plan Comparison Table** (highlight Starter as "Most Popular")
- **FAQ Section**:
  - "What happens when I hit 150 entries on Free?"
  - "Can I upgrade from Free anytime?" (Yes, instantly)
  - "What happens to my Event Pass after 90 days?" (Read-only archive)
- **Testimonials** (social proof)
- **Calculator**: "How many entries do you expect?" → Recommends plan

#### Upgrade Page (`/upgrade`)
- **Current Plan Summary** (show what user has now)
- **Side-by-side comparison** (what they'll get)
- **Instant activation**: "Upgrade now, features active immediately"
- **Money-back guarantee**: "Cancel anytime, no questions asked"

### A/B Testing Ideas

1. **Free tier entry limit**: 150 vs 200 vs unlimited (with other restrictions)
2. **Event Pass pricing**: $12 vs $15 vs $10
3. **Starter pricing**: $4 vs $5
4. **Branding badge prominence**: Subtle vs prominent
5. **PDF watermark style**: "Created with Tap & Tell" vs "Powered by Tap & Tell" vs subtle logo

## Implementation Roadmap

### Phase 1: Database & Backend (Week 1)
1. **Update schema** (`server/database/schema.ts`):
   - Modify `tenants.plan` enum: `free | starter | pro | event_pass`
   - Add `tenants.plan_expires_at` (timestamp, nullable — for Event Pass)
   - Add `tenants.max_guestbooks` (integer, nullable — null = unlimited)
   - Add `tenants.max_entries_per_guestbook` (integer, nullable — null = unlimited)
   - Add `tenants.stripe_customer_id`, `tenants.stripe_subscription_id`

2. **Plan enforcement middleware** (`server/middleware/plan-limits.ts`):
   - Check guestbook count before creating new guestbook
   - Check entry count before creating new entry
   - Return clear error messages with upgrade CTA
   - Handle Event Pass expiry (set guestbook to read-only after 90 days)

3. **Plan utilities** (`server/utils/plans.ts`):
   - `getPlanLimits(plan)` — returns limits object
   - `canCreateGuestbook(tenantId)` — checks count against plan
   - `canCreateEntry(guestbookId)` — checks count against plan
   - `isEventPassExpired(tenant)` — checks expiry date
   - `upgradePlan(tenantId, newPlan)` — handles plan changes

### Phase 2: Stripe Integration (Week 2)
1. **Stripe setup**:
   - Create Stripe account
   - Configure products: Starter (monthly/annual), Pro (monthly/annual), Event Pass (one-time)
   - Get API keys (test + production)

2. **Billing API routes** (`server/routes/api/billing/`):
   - `POST /api/billing/checkout` — Create Stripe checkout session
   - `POST /api/billing/portal` — Redirect to Stripe customer portal
   - `POST /api/webhooks/stripe` — Handle subscription events
   - `GET /api/billing/subscription` — Get current plan details
   - `POST /api/billing/upgrade` — Initiate upgrade flow
   - `POST /api/billing/cancel` — Cancel subscription

3. **Webhook handling** (`server/utils/stripe-webhooks.ts`):
   - `checkout.session.completed` → Activate plan
   - `customer.subscription.updated` → Update plan
   - `customer.subscription.deleted` → Downgrade to free
   - `invoice.payment_failed` → Handle payment failure

### Phase 3: Frontend UI (Week 3)
1. **Pricing page** (`app/pages/pricing.vue`):
   - Hero section: "Start Free. Upgrade When You're Ready."
   - Plan comparison table (Free, Starter, Pro, Event Pass)
   - FAQ section
   - CTA buttons for each plan
   - Social proof (testimonials, user count)

2. **Billing management** (`app/pages/billing.vue`):
   - Current plan display
   - Usage indicators (X of Y guestbooks, entries)
   - Upgrade/downgrade buttons
   - Manage subscription (Stripe portal redirect)
   - Invoice history

3. **Upgrade modals**:
   - Entry limit warning modal (`app/components/billing/EntryLimitWarning.vue`)
   - Guestbook limit modal (`app/components/billing/GuestbookLimitModal.vue`)
   - PDF watermark removal CTA (`app/components/billing/PdfUpgradeModal.vue`)

4. **Plan indicators**:
   - Badge in header showing current plan
   - Usage meters in dashboard
   - "Upgrade" button in appropriate places

### Phase 4: Conversion Optimization (Week 4)
1. **In-app upgrade triggers**:
   - Entry limit warnings at 120/150 and 150/150
   - PDF export watermark removal prompt
   - Branding badge with upgrade tooltip
   - Multiple guestbook creation blocker

2. **Email sequences** (`server/utils/email-templates.ts`):
   - Onboarding sequence (Days 0, 3, 7, 14, 30)
   - Event Pass expiry warnings (60 days, 85 days, 95 days)
   - Usage milestone emails (50 entries, 100 entries)

3. **Analytics tracking**:
   - Track upgrade clicks
   - Track plan comparison views
   - Track conversion funnels
   - A/B test experiment tracking

### Phase 5: Testing & Launch (Week 5)
1. **Testing**:
   - Unit tests for plan enforcement
   - Integration tests for Stripe webhooks
   - E2E tests for upgrade flow
   - Manual testing of all upgrade paths

2. **Documentation**:
   - Update README with pricing info
   - Document Stripe webhook setup
   - Document plan migration scripts

3. **Soft launch**:
   - Enable Stripe test mode
   - Invite beta users
   - Monitor conversions and errors
   - Iterate based on feedback

4. **Production launch**:
   - Switch to Stripe live mode
   - Announce pricing publicly
   - Monitor metrics closely
   - Prepare support responses

## Success Metrics to Track

### Primary Metrics
- **Conversion rate** (Free → Paid): Target 18%, measure weekly
- **MRR growth**: Track monthly, goal $1,000+ by Month 3
- **ARPU** (Average Revenue Per User): $5.90 target (weighted average)
- **Churn rate**: Monthly, target <5%

### Secondary Metrics
- **Time to first paid conversion**: Days from signup to upgrade
- **Plan distribution**: % of users on each plan
- **Upgrade triggers**: Which triggers convert best (PDF, entries, branding)
- **Event Pass conversion**: % of Event Pass users who upgrade to Pro post-expiry

### User Behavior
- Entry count distribution (understand actual usage)
- Guestbook count distribution
- PDF export frequency
- Free tier "sticking points" (where do users drop off?)

## Risk Mitigation

### Potential Issues
1. **Free tier too generous** → Monitor if users stay on Free without upgrading
   - Mitigation: A/B test entry limits (150 vs 100)
2. **Event Pass cannibalization** → Event Pass might reduce Pro subscriptions
   - Mitigation: Strong post-event upsell sequence
3. **Pricing too low** → MRR doesn't cover costs at scale
   - Mitigation: Plan for price increase after 6 months (grandfather existing users)
4. **Churn** → Users sign up for one event, then cancel
   - Mitigation: Annual plans with discount, sticky features (analytics, team)

## Additional Policies & Considerations

### Refund & Cancellation Policy

**Monthly Plans**:
- Cancel anytime, no questions asked
- Access continues until end of current billing period
- No prorated refunds (you keep access for the month you paid)
- Can reactivate anytime at current pricing

**Annual Plans**:
- Full refund within 30 days of purchase (no questions asked)
- After 30 days: No refunds, but can cancel to prevent next year's charge
- Access continues until end of paid period

**Event Pass**:
- Full refund within 7 days of purchase (before first entry is created)
- After first entry: No refunds (product has been used)
- Rationale: One-time purchase for specific events

**Implementation**:
- Add refund request button in billing page
- Auto-approve refunds within policy windows
- Manual review for edge cases
- Track refund rate (target <2%)

### Discount Codes & Promotions

**Launch Promotion** (First 3 months):
- `LAUNCH50` — 50% off first 3 months of Starter/Pro
- `WEDDING2026` — $5 off Event Pass (limited to 100 uses)
- Affiliate with wedding bloggers for custom codes

**Referral Program** (Phase 2):
- Give $5 credit, Get $5 credit
- Credits apply to any paid plan
- Unlimited referrals (capped at $50 credit balance)

**Seasonal Promotions**:
- **Black Friday**: 30% off annual plans (limited time)
- **Valentine's Day**: "Love Stories" discount on Event Pass
- **New Year**: Free month when upgrading to annual

**Implementation**:
- Stripe Promotion Codes API
- Track redemption rates per code
- Auto-expire codes after campaign
- Show active promotions on pricing page

### Non-Profit & Education Discounts

**Eligibility**:
- Registered 501(c)(3) organizations (US) or equivalent
- Accredited educational institutions (schools, universities)
- Community organizations, churches, libraries

**Discount Structure**:
- **40% off Starter/Pro plans** (e.g., Starter: $2.40/mo, Pro: $6/mo)
- **Annual plans only** (no monthly for non-profit pricing)
- **Event Pass**: Not discounted (already one-time, low price)

**Verification Process**:
1. User applies via form: `/apply/nonprofit`
2. Upload proof (EIN letter, school email, official documentation)
3. Manual review (24-48 hour turnaround)
4. Approved → Receive special Stripe coupon code
5. Annual re-verification required

**Marketing Value**:
- Build goodwill in community
- Generate testimonials from schools, churches
- Word-of-mouth in non-profit networks

**Implementation**:
- Add `/apply/nonprofit` form
- Store verification status in `tenants.nonprofit_verified`
- Apply discount at Stripe checkout
- Email template for approval/rejection

### Grandfathering Policy (Future Price Changes)

**Philosophy**: Reward early adopters and loyalty

**Policy**:
- **Existing subscribers** keep their price **forever** (as long as subscription remains active)
- **Cancellation = lose grandfathered price** (re-subscribing gets new price)
- **Upgrades/downgrades**: Keep grandfathered pricing tier equivalent
  - Example: If Starter goes from $4→$5, grandfathered users stay at $4
  - If they upgrade to Pro, they get proportionally discounted Pro price

**Communication**:
- 30-day notice before any price increase
- Email to all users explaining change
- Emphasize grandfathering for existing subscribers
- Show comparison: "Your price: $4/mo (original), New price: $5/mo"

**Price Increase Scenarios**:
- **Likely within 12 months**: Starter $4→$5, Pro $10→$12
- **Rationale**: Once product is proven, capture more value
- **Impact**: New users pay more, existing users locked in

## Competitive Analysis

### Direct Competitors (Digital Guestbooks)

**Research Needed** (before launch):
- [ ] **Joy** (joy.com) — Wedding website + guestbook pricing
- [ ] **Withjoy** (withjoy.com) — Free vs paid tiers
- [ ] **Wedsites** (wedsites.com) — Wedding-specific features
- [ ] **Greenvelope** (greenvelope.com) — Digital invites + guestbook
- [ ] **Guestbook Plus** (various app stores) — Mobile-first competitors

### Adjacent Competitors (Collaboration Boards)
- **Padlet** — ~$8/month for Pro, unlimited boards
- **Kudoboard** — $10+ per board (one-time), group cards
- **Miro/Mural** — Enterprise focus, $8-10/user/month

### Competitive Positioning

**Our Advantages**:
1. **NFC Integration** — Unique differentiator, no competitor does this well
2. **Event Pass** — One-time payment for events vs monthly subscriptions
3. **Read-only archive** — Event Pass becomes permanent keepsake
4. **Generous free tier** — 150 entries vs 50 (or paywall immediately)
5. **Privacy-focused** — Self-hostable, encrypted photos, no data mining

**Pricing Comparison** (estimated):
| Competitor | Free Plan | Paid Plan | Notes |
|------------|-----------|-----------|-------|
| Joy | Limited features | $10-15/mo | Wedding-focused |
| Padlet | 3 boards | $8/mo | General collaboration |
| Kudoboard | None | $10/board | Group cards only |
| **Tap & Tell** | **1 GB, 150 entries** | **$4-10/mo** | **NFC + flexible** |

**Market Gap We're Filling**:
- Most competitors force subscriptions for one-time events
- No competitor offers NFC as a core feature
- Our Event Pass is unique for wedding/birthday market
- Self-hosting option for privacy-conscious users

## Validation Before Launch

- [ ] Survey 50+ potential users on pricing perception
- [ ] Interview 10 beta users about willingness to pay
- [ ] Competitive analysis: Compare to Joy, Withjoy, Padlet pricing
- [ ] Financial modeling: Ensure profitability at 500, 1000, 5000 users
- [ ] Legal review: Terms of service, refund policy, non-profit verification
- [ ] Payment flow testing: Test all upgrade/downgrade scenarios
- [ ] Discount code testing: Verify Stripe promotion codes work correctly

## Critical Files

- `server/database/schema.ts` — Add plan fields
- `server/middleware/plan-limits.ts` — Check limits
- `app/pages/pricing.vue` — Public pricing page
- `app/pages/billing.vue` — Manage subscription
- `server/routes/api/billing/` — Stripe checkout, webhooks
