import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  key: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  image: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  chef?: string;
}

interface RecipeFormProps {
  recipe: Recipe | null;
  accessToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = ['Pasta', 'Ensaladas', 'Postres', 'Carnes', 'Guisos', 'Sopas', 'Otros'];
const difficulties = ['Fácil', 'Media', 'Difícil'];
const units = ['gramos', 'kg', 'litros', 'ml', 'tazas', 'cucharadas', 'cucharaditas', 'unidades', 'pizca'];

export function RecipeForm({ recipe, accessToken, onClose, onSuccess }: RecipeFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Pasta',
    difficulty: 'Media',
    image: '',
    prepTime: '',
    cookTime: '',
    servings: 4,
    chef: '',
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: 1, unit: 'gramos' }
  ]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [pizzaCount, setPizzaCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        difficulty: recipe.difficulty,
        image: recipe.image,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        chef: recipe.chef || '',
      });
      setIngredients(
        recipe.ingredients.length > 0 
          ? recipe.ingredients 
          : [{ name: '', quantity: 1, unit: 'gramos' }]
      );
      setInstructions(recipe.instructions.length > 0 ? recipe.instructions : ['']);
      setImagePreview(recipe.image);
    }
  }, [recipe]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'servings' ? (parseInt(value) || (value === '' ? 1 : 0)) : value,
    }));
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...ingredients];
    if (field === 'quantity') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      newIngredients[index][field] = isNaN(numValue) || value === '' ? 1 : numValue;
    } else {
      newIngredients[index][field] = value as any;
      
      // 🍕 Easter egg: detecta cuando alguien escribe "pizza"
      if (field === 'name' && typeof value === 'string' && value.toLowerCase() === 'pizza') {
        setPizzaCount(prev => prev + 1);
        if (pizzaCount + 1 === 3) {
          setTimeout(() => {
            alert('🍕 ¡Alguien tiene hambre de pizza! 🍕');
            setPizzaCount(0);
          }, 300);
        }
      }
    }
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 1, unit: 'gramos' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Intentando subir archivo:', filePath);

      const { data, error: uploadError } = await supabase.storage
        .from('recipes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error de Supabase:', uploadError);
        throw new Error(`Error al subir: ${uploadError.message}`);
      }

      console.log('Imagen subida exitosamente:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('recipes')
        .getPublicUrl(filePath);

      console.log('URL pública:', publicUrl);

      setFormData((prev) => ({ ...prev, image: publicUrl }));
      setImagePreview(publicUrl);
      alert('Imagen subida correctamente');
    } catch (err: any) {
      console.error('Error completo:', err);
      setError(err.message || 'Error al subir la imagen. Verifica la configuración de Storage en Supabase');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const filteredIngredients = ingredients.filter((i) => i.name.trim() !== '');
    const filteredInstructions = instructions.filter((i) => i.trim() !== '');

    if (filteredIngredients.length === 0) {
      setError('Agrega al menos un ingrediente');
      setLoading(false);
      return;
    }

    if (filteredInstructions.length === 0) {
      setError('Agrega al menos una instrucción');
      setLoading(false);
      return;
    }

    const recipeData = {
      ...formData,
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
    };

    try {
      const url = recipe
        ? `https://${projectId}.supabase.co/functions/v1/make-server-dd414dcc/recipes/${recipe.key}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-dd414dcc/recipes`;

      const response = await fetch(url, {
        method: recipe ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la receta');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving recipe:', err);
      setError(err.message || 'Error al guardar la receta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-gray-900 text-xl font-bold">
            {recipe ? 'Editar Receta' : 'Nueva Receta'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-gray-700 mb-2 font-medium">
                Título *
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-gray-700 mb-2 font-medium">
                Categoría *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 mb-2 font-medium">
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="difficulty" className="block text-gray-700 mb-2 font-medium">
                Dificultad *
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prepTime" className="block text-gray-700 mb-2 font-medium">
                Tiempo Prep. *
              </label>
              <input
                id="prepTime"
                type="text"
                name="prepTime"
                value={formData.prepTime}
                onChange={handleInputChange}
                placeholder="15 min"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="cookTime" className="block text-gray-700 mb-2 font-medium">
                Tiempo Cocción *
              </label>
              <input
                id="cookTime"
                type="text"
                name="cookTime"
                value={formData.cookTime}
                onChange={handleInputChange}
                placeholder="30 min"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="servings" className="block text-gray-700 mb-2 font-medium">
                Porciones *
              </label>
              <input
                id="servings"
                type="number"
                name="servings"
                value={formData.servings || ''}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="chef" className="block text-gray-700 mb-2 font-medium">
                Chef (opcional)
              </label>
              <input
                id="chef"
                type="text"
                name="chef"
                value={formData.chef}
                onChange={handleInputChange}
                placeholder="Nombre del chef"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              Imagen de la receta *
            </label>
            
            {imagePreview && (
              <div className="mb-4 relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={() => setImagePreview('')}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setFormData((prev) => ({ ...prev, image: '' }));
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <label className="w-full cursor-pointer">
              <div className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                <Upload className="w-5 h-5" />
                {uploadingImage ? 'Subiendo...' : 'Seleccionar Imagen'}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">Máximo 5MB</p>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-gray-900 font-medium">Ingredientes *</label>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            
            {isMobile ? (
              /* MOBILE VIEW - Vista con tarjetas */
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="space-y-3">
                      {/* Nombre del ingrediente */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Ingrediente
                        </label>
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                          placeholder="Ej: Espagueti, Tomate..."
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        />
                      </div>

                      {/* Cantidad y Unidad */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            value={ingredient.quantity || ''}
                            onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                            placeholder="0"
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Unidad
                          </label>
                          <select
                            value={ingredient.unit}
                            onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                          >
                            {units.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Botón eliminar */}
                      {ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar ingrediente
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* DESKTOP VIEW - Vista horizontal compacta */
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                      placeholder="Nombre del ingrediente"
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      value={ingredient.quantity || ''}
                      onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
                    />
                    <select
                      value={ingredient.unit}
                      onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                      className="w-36 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-gray-900 font-medium">Instrucciones *</label>
              <button
                type="button"
                onClick={addInstruction}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center mt-2 text-sm font-medium">
                    {index + 1}
                  </span>
                  <textarea
                    value={instruction}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    placeholder={`Paso ${index + 1}`}
                    rows={2}
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors h-fit mt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : recipe ? 'Actualizar' : 'Crear Receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}