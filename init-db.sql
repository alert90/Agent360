-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS agent360;

-- Use the agent360 database
\c agent360;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- The tables will be created by Drizzle ORM migrations
-- This file is mainly for Docker initialization
