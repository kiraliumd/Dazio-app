import { useState, useEffect } from 'react';
import { getActiveEquipmentCategories, type EquipmentCategory } from '@/lib/database/equipment-categories';

export function useEquipmentCategories() {
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActiveEquipmentCategories();
      setCategories(data);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      setError("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  // Carregar categorias apenas uma vez na montagem
  useEffect(() => {
    loadCategories();
  }, []); // Array vazio para executar apenas uma vez

  // Escutar mudanças nas categorias
  useEffect(() => {
    const handleCategoriesChanged = () => {
      loadCategories();
    };

    window.addEventListener('categoriesChanged', handleCategoriesChanged);
    return () => {
      window.removeEventListener('categoriesChanged', handleCategoriesChanged);
    };
  }, []); // Array vazio para executar apenas uma vez

  const refreshCategories = () => {
    loadCategories();
  };

  return {
    categories,
    loading,
    error,
    refreshCategories,
  };
} 