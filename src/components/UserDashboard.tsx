import { useState, useEffect } from 'react';
import { RecipeCard } from './RecipeCard';
import { RecipeModal } from './RecipeModal';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { FeaturesSection } from './FeaturesSection';
import { ChefHat, LogOut, User } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import logo from '../logo.png';
interface Recipe {
  key: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  chef?: string;
  averageRating?: number;
  totalRatings?: number;
  totalComments?: number;
}

interface UserDashboardProps {
  onLogout: () => void;
  user: any;
}

const categories = [
  'Todas',
  'Pasta',
  'Ensaladas',
  'Postres',
  'Carnes',
  'Guisos',
  'Sopas',
  'Otros',
];

// Configuración personalizable
const APP_CONFIG = {
  name: 'RecetasApp', // Cambia este nombre
  logo: logo, // Tu logo importado desde src/logo.png
  heroTitle: 'Explora el Mundo de la Cocina',
  heroSubtitle: 'Descubre recetas increíbles, calcula porciones y aprende de los mejores chefs',
  footerText: '© 2025 RecetasApp. Todas las recetas con amor.',
};

export function UserDashboard({ onLogout, user }: UserDashboardProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-dd414dcc/recipes`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar recetas');
      }

      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory =
      selectedCategory === 'Todas' || recipe.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              {APP_CONFIG.logo ? (
                <img 
                  src={APP_CONFIG.logo} 
                  alt={APP_CONFIG.name}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <span>{user.user_metadata?.name || user.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-amber-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mb-4">{APP_CONFIG.heroTitle}</h2>
          <p className="text-orange-50 max-w-2xl mx-auto">
            {APP_CONFIG.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </section>

      {/* Recipes Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando recetas...</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontraron recetas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.key}
                recipe={recipe}
                onClick={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>{APP_CONFIG.footerText}</p>
        </div>
      </footer>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => {
            setSelectedRecipe(null);
            fetchRecipes(); // Refresh recipes to update ratings and comments count
          }}
        />
      )}
    </div>
  );
}