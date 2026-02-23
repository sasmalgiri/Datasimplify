'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PersonaId } from './types';

interface PersonaStore {
  persona: PersonaId | null;
  onboardingCompleted: boolean;

  setPersona: (persona: PersonaId) => void;
  clearPersona: () => void;
  setOnboardingCompleted: (completed: boolean) => void;

  /** Persist persona to Supabase user_profiles.preferences */
  syncToSupabase: () => Promise<void>;
  /** Hydrate store from Supabase user_profiles.preferences */
  loadFromSupabase: () => Promise<void>;
}

export const usePersonaStore = create<PersonaStore>()(
  persist(
    (set, get) => ({
      persona: null,
      onboardingCompleted: false,

      setPersona: (persona) => set({ persona }),
      clearPersona: () => set({ persona: null, onboardingCompleted: false }),
      setOnboardingCompleted: (completed) =>
        set({ onboardingCompleted: completed }),

      syncToSupabase: async () => {
        const { persona, onboardingCompleted } = get();
        try {
          await fetch('/api/user/preferences', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              preferences: { persona, onboardingCompleted },
            }),
          });
        } catch {
          // Non-blocking — localStorage is the primary store
        }
      },

      loadFromSupabase: async () => {
        try {
          const res = await fetch('/api/user/preferences');
          if (res.ok) {
            const { preferences } = await res.json();
            if (preferences?.persona) {
              set({
                persona: preferences.persona,
                onboardingCompleted: preferences.onboardingCompleted ?? false,
              });
            }
          }
        } catch {
          // Fallback to whatever is in localStorage
        }
      },
    }),
    {
      name: 'crk-persona',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      partialize: (state) => ({
        persona: state.persona,
        onboardingCompleted: state.onboardingCompleted,
      }),
    },
  ),
);
