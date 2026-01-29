# User Registration

Owner registration and authentication system.

## User Types

- **Owner**: Creates and manages tenants (homes)
- **Guest**: No account, just leaves entries

## User Schema

```typescript
interface User {
  id: string
  email: string
  passwordHash: string
  name: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface Session {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
}
```

## Features

### Registration
- Email + password registration
- Email verification (optional for MVP)
- Terms of service acceptance
- Welcome email

### Login
- Email + password login
- "Remember me" option
- Password reset flow
- Session management

### Account Management
- Update profile (name, email)
- Change password
- Delete account
- View active sessions

## Pages

```
/register           # New user registration
/login              # User login
/forgot-password    # Request password reset
/reset-password     # Set new password
/account            # Account settings
/account/sessions   # Manage active sessions
```

## API Routes

```
POST /api/auth/register     # Create account
POST /api/auth/login        # Login
POST /api/auth/logout       # Logout
POST /api/auth/refresh      # Refresh token
POST /api/auth/forgot       # Request reset
POST /api/auth/reset        # Reset password
GET  /api/auth/me           # Get current user
PUT  /api/auth/me           # Update profile
DELETE /api/auth/me         # Delete account
```

## Security

- Password hashing with bcrypt/argon2
- HTTP-only cookies for sessions
- CSRF protection
- Rate limiting on auth endpoints
- Secure password requirements (min 8 chars)

## Implementation Steps

1. Add user and session schemas to database
2. Install `bcrypt` or `argon2` for password hashing
3. Create registration API and page
4. Create login API and page
5. Implement session middleware
6. Add password reset flow
7. Create account settings page
8. Add email verification (optional)
