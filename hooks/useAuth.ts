'use client';

import { useEffect, useState } from 'react';
import { supabase, UserProfile } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      console.log('🔄 Getting initial user...');
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error('❌ Error fetching user:', error.message);
        setLoading(false);
        return;
      }

      const currentUser = data.user;
      setUser(currentUser);

      if (currentUser) {
        console.log('👤 User found:', currentUser.id);
        await fetchProfile(currentUser.id);
      } else {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`📣 Auth state changed: ${event}`);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('📥 Fetching profile for userId:', userId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile(data);
        console.log('✅ Profile loaded');
      } else if (error?.code === 'PGRST116') {
        console.warn('⚠️ Profile not found, creating new one...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          throw userError || new Error('User not found for profile creation');
        }

        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || 'User',
            role: user.user_metadata?.role || 'user'
          }])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Failed to create profile:', insertError.message);
        } else {
          setProfile(newProfile);
          console.log('✅ New profile created');
        }
      } else if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('❌ Error fetching/creating profile:', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: { full_name: string; role: 'user' | 'seller' }
  ) => {
    console.log('📝 Signing up user...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/signin`
      }
    });

    if (error) {
      console.error('❌ Sign up error:', error.message);
      throw error;
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Signing in user...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Sign in error:', error.message);
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Sign out error:', error.message);
      throw error;
    }

    setUser(null);
    setProfile(null);
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  };
}
