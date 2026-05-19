import { useCallback, useEffect, useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import {
  fetchOpenLocationHelpRequestCount,
  LOCATION_HELP_REQUESTS_CHANGED,
} from '../services/locationHelpRequestsService';

export function useLocationHelpRequestCount() {
  const { userProfile } = useSupabase();
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  const refresh = useCallback(async () => {
    if (!isAdmin || !userProfile?.id) {
      setOpenCount(0);
      setLoading(false);
      return;
    }

    try {
      const count = await fetchOpenLocationHelpRequestCount();
      setOpenCount(count);
    } catch (err) {
      console.error('[PEM] Failed to load location help request count:', err);
      setOpenCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, userProfile?.id, userProfile?.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-count when admin navigates (e.g. after logging in or returning from another page)
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  useEffect(() => {
    const onChanged = () => refresh();
    window.addEventListener(LOCATION_HELP_REQUESTS_CHANGED, onChanged);
    return () => window.removeEventListener(LOCATION_HELP_REQUESTS_CHANGED, onChanged);
  }, [refresh]);

  return { openCount, loading, refresh };
}
