'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { useState, useEffect } from 'react';
import { store } from '@/store';
import { fetchMe } from '@/store/slices/authSlice';
import Cookies from 'js-cookie';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (token) {
      store.dispatch(fetchMe());
    }
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  );

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>{children}</AuthInitializer>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
