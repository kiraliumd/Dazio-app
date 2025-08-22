import { useState, useEffect, useCallback, useRef } from 'react';
import { getActiveEquipmentCategories, type EquipmentCategory } from '@/lib/database/equipment-categories';

export function useEquipmentCategories() {
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Criar novo controller para esta requisição
      abortControllerRef.current = new AbortController()

      setLoading(true);
      setError(null);
      const data = await getActiveEquipmentCategories();
      
      if (abortControllerRef.current.signal.aborted) return
      
      setCategories(data);
      setHasLoaded(true);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao carregar categorias:", err); } }
        setError("Erro ao carregar categorias");
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Carregar categorias apenas uma vez na montagem
  useEffect(() => {
    if (!hasLoaded) {
      loadCategories();
    }
  }, [hasLoaded, loadCategories]);

  // Escutar mudanças nas categorias
  useEffect(() => {
    const handleCategoriesChanged = () => {
      loadCategories();
    };

    window.addEventListener('categoriesChanged', handleCategoriesChanged);
    return () => {
      window.removeEventListener('categoriesChanged', handleCategoriesChanged);
    };
  }, [loadCategories]);

  const refreshCategories = useCallback(() => {
    loadCategories();
  }, [loadCategories]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []);

  return {
    categories,
    loading,
    error,
    refreshCategories,
  };
} 