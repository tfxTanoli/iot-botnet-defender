-- ==========================================
-- IOT BOTNET DEFENDER - SUPABASE SCHEMA
-- ==========================================
-- Run this entire script in your Supabase SQL Editor.
-- It will create all necessary tables and enforce Row Level Security (RLS)
-- so users can only access their own data.

-- 1. Botnet Results Table (Stores the detection logs and analysis results)
CREATE TABLE public.botnet_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    ip text NOT NULL,
    prediction text NOT NULL,
    confidence numeric NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Traffic Overview Table (Stores aggregated data for the dashboard bar chart)
CREATE TABLE public.traffic_overview (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    name text NOT NULL, -- e.g., 'Mon', 'Tue'
    normal integer DEFAULT 0 NOT NULL,
    attacks integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Activity History Table (Stores the recent actions for the history logs)
CREATE TABLE public.activity_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    action text NOT NULL,
    details text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Datasets Table (Tracks user uploaded datasets)
CREATE TABLE public.datasets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    filename text NOT NULL,
    size_bytes bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Active Threats Table (Tracks ongoing threats requiring attention)
CREATE TABLE public.active_threats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    status text NOT NULL DEFAULT 'active', -- 'active' or 'resolved'
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- SECURING TABLES WITH ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.botnet_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_threats ENABLE ROW LEVEL SECURITY;

-- Create Policies for botnet_results
CREATE POLICY "Users can view their own botnet results" ON public.botnet_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own botnet results" ON public.botnet_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create Policies for traffic_overview
CREATE POLICY "Users can view their own traffic overview" ON public.traffic_overview FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own traffic overview" ON public.traffic_overview FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create Policies for activity_history
CREATE POLICY "Users can view their own activity history" ON public.activity_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity history" ON public.activity_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create Policies for datasets
CREATE POLICY "Users can view their own datasets" ON public.datasets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own datasets" ON public.datasets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create Policies for active_threats
CREATE POLICY "Users can view their own active threats" ON public.active_threats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own active threats" ON public.active_threats FOR INSERT WITH CHECK (auth.uid() = user_id);
