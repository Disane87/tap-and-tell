# Multi-Event Support

Host multiple guestbooks for different events.

## Features

- Create/manage multiple events
- Unique URL per event (`/event/[slug]`)
- Event-specific settings (name, date, theme)
- Separate entry storage per event
- Event selection in admin

## Implementation

- Event schema (id, slug, name, date, settings)
- Update entry schema with `eventId`
- Dynamic routes `/event/[slug]`
- Event management in admin panel
- Default event for root URL
