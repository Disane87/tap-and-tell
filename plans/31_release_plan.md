# Release Plan – MemoryTap

This document defines the phased release strategy for MemoryTap,
covering SaaS, self-hosted deployments, and physical NFC-enabled products.

The goal is to balance:
- Commercial viability
- Community trust
- Technical stability
- Incremental delivery

This is a living document and will evolve over time.

---

## Release Philosophy

- Release early, but intentionally
- Keep the core identical across SaaS and self-hosted
- Monetize convenience, operation, and physical products
- Never lock functionality behind artificial paywalls
- Be explicit about responsibilities and limitations

---

## Phase 0 – Internal Alpha (Private)

### Goals
- Validate core guestbook flow
- Validate NFC → browser → entry flow
- Establish development workflow and documentation discipline

### Scope
- Basic guest entry (name, message, photo)
- Single guestbook instance
- No authentication
- No admin UI
- Local or simple hosted storage

### Distribution
- Not public
- Developer-only
- Manual setup

### Exit Criteria
- Stable local build
- Core user flow works on mobile devices
- Plans and documentation are in sync
- Project memory established

---

## Phase 1 – Community Preview (Self-Hosted)

### Goals
- Enable technically inclined users to self-host
- Gather early feedback from the community
- Validate Docker-based deployment

### Scope
- Open Core released
- Self-hosted Docker setup
- NFC provisioning via URL
- Basic configuration via environment variables
- Minimal documentation

### Distribution
- Public Git repository
- Docker Compose
- No guarantees, no SLA

### Explicit Limitations
- No automated updates
- No support obligations
- No managed backups

### Exit Criteria
- Self-hosted deployment documented and reproducible
- Community feedback collected
- No critical security issues

---

## Phase 2 – Hosted Beta (SaaS)

### Goals
- Validate demand for hosted convenience
- Test operational aspects (hosting, backups, updates)
- Establish pricing expectations

### Scope
- Hosted version of the core application
- Automatic updates
- Managed storage
- Claim-based NFC onboarding
- Basic abuse protection

### Distribution
- Invite-only or limited public beta
- No long-term guarantees yet

### Monetization
- Free tier or trial
- Early adopter pricing

### Exit Criteria
- Stable hosted operation
- Acceptable support load
- Clear operational cost understanding

---

## Phase 3 – Physical Product Launch (NFC + 3D Print)

### Goals
- Introduce physical NFC-enabled products
- Combine digital and physical experience
- Validate logistics and provisioning workflow

### Scope
- 3D printable designs (STL) released to the community
- Documentation for DIY NFC provisioning
- Official pre-printed and pre-provisioned products sold by the project
- Claim-code-based device activation

### Product Types
- Picture frames
- Desk stands
- Wall-mounted objects
- Event-specific designs (optional)

### Licensing
- STL files released under a non-commercial license
- Commercial products sold exclusively by the project

### Exit Criteria
- Reliable provisioning workflow
- Clear separation between DIY and commercial offerings
- Positive user feedback on physical quality

---

## Phase 4 – Public SaaS Launch

### Goals
- Establish MemoryTap as a stable commercial offering
- Scale beyond early adopters
- Formalize operations

### Scope
- Public SaaS availability
- Clear pricing tiers
- Improved admin tooling
- Monitoring and alerting
- Documentation for customers and self-hosters

### Monetization
- Subscription-based pricing
- Optional physical add-ons
- Event or bundle offerings

### Exit Criteria
- Sustainable operating costs
- Predictable onboarding
- Low critical incident rate

---

## Phase 5 – Ecosystem & Extensions (Optional)

### Goals
- Expand without bloating the core
- Enable customization and integrations

### Scope
- Optional plugins or extensions
- Export features (PDF, print)
- Integrations (optional)
- Theming options

### Constraints
- Core remains lean
- Extensions must not fragment the community

---

## Success Metrics (Non-Marketing)

- Guests can leave an entry in under 60 seconds
- Self-hosted users can deploy without manual debugging
- Physical products require no explanation to use
- SaaS users rarely need support for basic usage

---

## Non-Goals

- Competing with social networks
- Data mining or analytics-driven monetization
- Locking users into proprietary formats
- Artificial feature gating

---

## Final Note

MemoryTap is designed to grow sustainably.
Community, self-hosting, SaaS, and physical products are not competing paths,
but complementary ones.

The project succeeds if users feel empowered,
not locked in.
