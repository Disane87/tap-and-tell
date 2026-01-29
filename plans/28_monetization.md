# Monetization Strategy

Revenue model for Tap & Tell SaaS.

## Pricing Tiers

### Free Tier
- 1 home (tenant)
- Up to 50 entries
- Basic customization (name only)
- Community support
- "Powered by Tap & Tell" branding

### Home Plan - $5/month or $48/year
- 1 home (tenant)
- Unlimited entries
- Full customization (colors, logo, welcome message)
- Entry moderation
- Export to PDF
- Remove branding
- Email support

### Family Plan - $12/month or $99/year
- Up to 5 homes (tenants)
- Everything in Home Plan
- Priority support
- Analytics dashboard
- Custom domain support

### Enterprise - Custom pricing
- Unlimited homes
- SSO/SAML
- API access
- Dedicated support
- SLA guarantee
- White-label option

## Feature Matrix

| Feature | Free | Home | Family | Enterprise |
|---------|------|------|--------|------------|
| Homes | 1 | 1 | 5 | Unlimited |
| Entries | 50 | Unlimited | Unlimited | Unlimited |
| Customization | Basic | Full | Full | Full |
| Moderation | No | Yes | Yes | Yes |
| Export PDF | No | Yes | Yes | Yes |
| Analytics | No | Basic | Advanced | Advanced |
| Branding removal | No | Yes | Yes | Yes |
| Custom domain | No | No | Yes | Yes |
| API access | No | No | No | Yes |
| Support | Community | Email | Priority | Dedicated |

## Payment Integration

### Stripe
- Subscription billing
- Payment methods: Card, Apple Pay, Google Pay
- Automatic invoicing
- Proration for upgrades/downgrades
- Webhook handling for events

### Subscription Schema
```typescript
interface Subscription {
  id: string
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  plan: 'free' | 'home' | 'family' | 'enterprise'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}
```

## Billing Pages

```
/pricing                    # Public pricing page
/dashboard/billing          # Manage subscription
/dashboard/billing/upgrade  # Upgrade plan
/dashboard/billing/invoices # View invoices
```

## API Routes

```
POST /api/billing/checkout      # Create checkout session
POST /api/billing/portal        # Create customer portal session
POST /api/webhooks/stripe       # Handle Stripe webhooks
GET  /api/billing/subscription  # Get current subscription
```

## Implementation Steps

1. Create Stripe account and get API keys
2. Define products and prices in Stripe
3. Add subscription schema to database
4. Create pricing page
5. Implement checkout flow
6. Handle Stripe webhooks
7. Add plan limits enforcement
8. Create billing management UI
9. Implement upgrade/downgrade flow
10. Add usage tracking for limits

## Revenue Projections

### Assumptions
- 1000 registered users
- 10% conversion to paid (100 users)
- 70% Home, 25% Family, 5% Enterprise

### Monthly Revenue
- Home: 70 × $5 = $350
- Family: 25 × $12 = $300
- Enterprise: 5 × $50 (avg) = $250
- **Total: ~$900/month**

## Marketing & Growth

### Acquisition Channels
- SEO (wedding guestbook, digital guestbook, NFC guestbook)
- Social media (Pinterest, Instagram)
- Wedding/event blogs
- Product Hunt launch
- Referral program

### Retention
- Email onboarding sequence
- Feature announcement emails
- Usage milestone celebrations
- Annual plan discount (2 months free)

## Future Revenue Streams

- NFC tag sales (physical product)
- Premium templates/themes
- Professional setup service
- API access for integrations
- White-label licensing
