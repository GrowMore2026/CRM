-- Run this in your Supabase SQL Editor to create the notifications table

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  "userId" text REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  "isRead" boolean DEFAULT false,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- Note: Ensure that the 'users' table exists and its primary key is 'id' of type 'text'.
