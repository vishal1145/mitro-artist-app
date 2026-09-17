import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { kycApi } from '@services/api';
import type { BankAccount, KycStatus } from '@app-types/api';
import { AuthError } from '@utils/errorHandler';

/**
 * The signed-in artist's KYC verification state (`GET /api/artist/kyc`).
 * `retry: false` for the same reason as `useProfile` — the axios interceptor
 * already handles the one realistic failure (an expired token).
 */
export const useKyc = (): UseQueryResult<KycStatus, Error> =>
  useQuery({
    queryKey: queryKeys.kyc.status(),
    queryFn: async () => {
      const result = await kycApi.getStatus();
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 60_000,
    retry: false,
  });

/**
 * The linked payout bank account, or `null` when none is on file. Never throws
 * on a missing account — the service maps a 404 to `null`.
 */
export const useBankAccount = (): UseQueryResult<BankAccount | null, Error> =>
  useQuery({
    queryKey: queryKeys.kyc.bankAccount(),
    queryFn: async () => {
      const result = await kycApi.getBankAccount();
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 60_000,
    retry: false,
  });
