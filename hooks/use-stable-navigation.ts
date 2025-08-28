import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';

export function useStableNavigation() {
  const router = useRouter();
  const navigationRef = useRef<{
    path: string;
    timestamp: number;
  }>({ path: '', timestamp: 0 });

  const navigate = useCallback((path: string) => {
    const now = Date.now();
    const lastNavigation = navigationRef.current;
    
    // Evitar navegações duplicadas em um curto período
    if (lastNavigation.path === path && now - lastNavigation.timestamp < 500) {
      return;
    }

    // Evitar navegação para a mesma rota
    if (typeof window !== 'undefined' && window.location.pathname === path) {
      return;
    }

    // Atualizar referência
    navigationRef.current = { path, timestamp: now };
    
    router.push(path);
  }, [router]);

  const replace = useCallback((path: string) => {
    const now = Date.now();
    const lastNavigation = navigationRef.current;
    
    // Evitar navegações duplicadas em um curto período
    if (lastNavigation.path === path && now - lastNavigation.timestamp < 500) {
      return;
    }

    // Atualizar referência
    navigationRef.current = { path, timestamp: now };
    
    router.replace(path);
  }, [router]);

  return { navigate, replace };
}
