'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../supabase-browser';

export interface UserProfile {
  first_name: string;
  last_name:  string;
  age:        number | null;
  currency:   string;
}

const DEFAULTS: UserProfile = { first_name: '', last_name: '', age: null, currency: 'USD' };

export function useUserProfile() {
  const [profile,  setProfile]  = useState<UserProfile>(DEFAULTS);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error: err } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, age, currency')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cancelled) {
        if (data) setProfile({ ...DEFAULTS, ...data });
        if (err) setError(err.message);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const save = useCallback(async (updates: Partial<UserProfile>) => {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const merged = { ...profile, ...updates };

    const { error: err } = await supabase
      .from('user_profiles')
      .upsert({ user_id: user.id, ...merged, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    setSaving(false);
    if (err) { setError(err.message); return; }
    setProfile(merged);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [profile]);

  return { profile, loading, saving, saved, error, save, setProfile };
}
