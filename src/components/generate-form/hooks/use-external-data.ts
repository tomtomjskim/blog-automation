import { useEffect } from 'react';
import type { StyleProfile } from '@/lib/types';
import type { CustomStyle } from './use-form-state';

interface UseExternalDataProps {
  setProfiles: (v: StyleProfile[]) => void;
  setKlingConfigured: (v: boolean) => void;
  setCustomStyles: (v: CustomStyle[]) => void;
}

// profiles, klingConfigured, customStyles 3개 외부 데이터를 fetch하는 훅
export function useExternalData({
  setProfiles,
  setKlingConfigured,
  setCustomStyles,
}: UseExternalDataProps) {
  useEffect(() => {
    fetch('/api/style-profile')
      .then(r => r.json())
      .then(setProfiles)
      .catch(() => {});

    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setKlingConfigured(data.kling?.configured || false))
      .catch(() => {});

    fetch('/api/custom-styles')
      .then(r => r.json())
      .then(setCustomStyles)
      .catch(() => {});
  }, [setProfiles, setKlingConfigured, setCustomStyles]);
}
