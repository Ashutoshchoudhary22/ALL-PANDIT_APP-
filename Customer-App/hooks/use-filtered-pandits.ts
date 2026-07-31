import { useMemo } from 'react';

import { filterAndSortPandits } from '@/lib/pandit-filters';
import { usePanditFilters } from '@/providers/PanditFiltersProvider';
import { PublicPanditProfile } from '@/services/pandit-profile.api';

type UseFilteredPanditsOptions = {
  pandits: PublicPanditProfile[];
  serviceName?: string;
  customerLatitude?: number | null;
  customerLongitude?: number | null;
};

export function useFilteredPandits({
  pandits,
  serviceName,
  customerLatitude,
  customerLongitude,
}: UseFilteredPanditsOptions) {
  const { filters } = usePanditFilters();

  return useMemo(
    () =>
      filterAndSortPandits(pandits, filters, {
        serviceName,
        customerLatitude,
        customerLongitude,
      }),
    [pandits, filters, serviceName, customerLatitude, customerLongitude],
  );
}
