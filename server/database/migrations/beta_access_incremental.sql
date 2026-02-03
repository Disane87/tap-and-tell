-- Beta Access System Migration
-- Adds beta_invites table, waitlist table, and extends users/tenants

-- Add new columns to users table (if not exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='beta_invite_id') THEN
    ALTER TABLE users ADD COLUMN beta_invite_id varchar(24);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_founder') THEN
    ALTER TABLE users ADD COLUMN is_founder boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='beta_participant') THEN
    ALTER TABLE users ADD COLUMN beta_participant boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_admin') THEN
    ALTER TABLE users ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add new columns to tenants table (if not exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='plan_expires_at') THEN
    ALTER TABLE tenants ADD COLUMN plan_expires_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='plan_granted_reason') THEN
    ALTER TABLE tenants ADD COLUMN plan_granted_reason text;
  END IF;
END $$;

-- Create beta_invites table
CREATE TABLE IF NOT EXISTS beta_invites (
  id varchar(24) PRIMARY KEY NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  source text DEFAULT 'manual' NOT NULL,
  granted_plan text DEFAULT 'pro' NOT NULL,
  is_founder boolean DEFAULT false NOT NULL,
  note text,
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  accepted_by_user_id varchar(24) REFERENCES users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for beta_invites (if not exist)
CREATE INDEX IF NOT EXISTS idx_beta_invites_token ON beta_invites USING btree (token);
CREATE INDEX IF NOT EXISTS idx_beta_invites_email ON beta_invites USING btree (email);

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id varchar(24) PRIMARY KEY NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  use_case text,
  source text,
  referred_by_user_id varchar(24) REFERENCES users(id),
  referral_code text UNIQUE,
  position serial NOT NULL,
  priority integer DEFAULT 0 NOT NULL,
  status text DEFAULT 'waiting' NOT NULL,
  invited_at timestamp with time zone,
  registered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for waitlist (if not exist)
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist USING btree (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist USING btree (referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist USING btree (status);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist USING btree (priority);
