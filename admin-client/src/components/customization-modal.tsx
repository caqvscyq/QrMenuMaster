import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { MenuItem } from '@shared/schema';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  onAddToCart: (customizations: any, specialInstructions: string, quantity: number) => void;
}

export function CustomizationModal({ isOpen, onClose, item, onAddToCart }: CustomizationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, any>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!isOpen) return null;

  // Parse customization options from JSON string if needed
  const customizationOptions = (() => {
    if (!item.customizationOptions) return [];
    try {
      return typeof item.customizationOptions === 'string'
        ? JSON.parse(item.customizationOptions)
        : item.customizationOptions;
    } catch (error) {
      console.error('Error parsing customization options:', error);
      return [];
    }
  })();

  const handleCustomizationChange = (optionId: string, value: any) => {
    setSelectedCustomizations(prev => ({
      ...prev,
      [optionId]: value
    }));
  };

  const calculateTotalPrice = () => {
    let basePrice = parseFloat(item.price);
    let customizationPrice = 0;

    if (customizationOptions) {
      customizationOptions.forEach(option => {
        const selectedValue = selectedCustomizations[option.id];
        
        if (option.type === 'checkbox' && selectedValue) {
          customizationPrice += option.price || 0;
        } else if (option.type === 'radio' && selectedValue && option.options) {
          const selectedOption = option.options.find(opt => opt.id === selectedValue);
          if (selectedOption) {
            customizationPrice += selectedOption.price || 0;
          }
        }
      });
    }

    return (basePrice + customizationPrice) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(selectedCustomizations, specialInstructions, quantity);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{item.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Item Image and Info */}
          <div className="flex items-center space-x-4">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h3 className="font-medium text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
              <p className="text-primary font-semibold">${item.price}</p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">數量</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Customization Options */}
          {customizationOptions?.map((option) => (
            <div key={option.id} className="space-y-3">
              <h4 className="font-medium text-gray-900">{option.name}</h4>
              
              {option.type === 'radio' && option.options ? (
                <div className="space-y-2">
                  {option.options.map((radioOption) => (
                    <label key={radioOption.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={option.id}
                        value={radioOption.id}
                        checked={selectedCustomizations[option.id] === radioOption.id}
                        onChange={(e) => handleCustomizationChange(option.id, e.target.value)}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="flex-1 text-gray-700">{radioOption.name}</span>
                      {radioOption.price > 0 && (
                        <span className="text-sm text-gray-500">+${radioOption.price}</span>
                      )}
                    </label>
                  ))}
                </div>
              ) : option.type === 'checkbox' ? (
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCustomizations[option.id] || false}
                    onChange={(e) => handleCustomizationChange(option.id, e.target.checked)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="flex-1 text-gray-700">{option.name}</span>
                  {option.price && option.price > 0 && (
                    <span className="text-sm text-gray-500">+${option.price}</span>
                  )}
                </label>
              ) : null}
            </div>
          ))}

          {/* Special Instructions */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">特殊要求</h4>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="請輸入特殊要求..."
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            加入購物車 - ${calculateTotalPrice().toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
