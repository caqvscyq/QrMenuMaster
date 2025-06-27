/**
 * Utility functions for calculating customization prices
 */

export interface CustomizationOption {
  id: string;
  name: string;
  type: 'radio' | 'checkbox';
  price?: number;
  options?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export interface SelectedCustomizations {
  [optionId: string]: string | boolean;
}

/**
 * Calculate the total price adjustment from customizations
 */
export function calculateCustomizationPrice(
  customizationOptions: CustomizationOption[],
  selectedCustomizations: SelectedCustomizations
): number {
  let customizationPrice = 0;

  if (!customizationOptions || !selectedCustomizations) {
    return 0;
  }

  customizationOptions.forEach(option => {
    const selectedValue = selectedCustomizations[option.id];
    
    if (option.type === 'checkbox' && selectedValue) {
      // For checkbox options, add the option price if selected
      customizationPrice += option.price || 0;
    } else if (option.type === 'radio' && selectedValue && option.options) {
      // For radio options, find the selected option and add its price
      const selectedOption = option.options.find(opt => opt.id === selectedValue);
      if (selectedOption) {
        customizationPrice += selectedOption.price || 0;
      }
    }
  });

  return customizationPrice;
}

/**
 * Calculate the total price for a menu item including customizations
 */
export function calculateItemTotalPrice(
  basePrice: number,
  quantity: number,
  customizationOptions: CustomizationOption[],
  selectedCustomizations: SelectedCustomizations
): number {
  const customizationPrice = calculateCustomizationPrice(customizationOptions, selectedCustomizations);
  return (basePrice + customizationPrice) * quantity;
}

/**
 * Format customizations for display
 */
export function formatCustomizationsForDisplay(
  customizationOptions: CustomizationOption[],
  selectedCustomizations: SelectedCustomizations
): string[] {
  const displayItems: string[] = [];

  if (!customizationOptions || !selectedCustomizations) {
    return displayItems;
  }

  customizationOptions.forEach(option => {
    const selectedValue = selectedCustomizations[option.id];
    
    if (option.type === 'checkbox' && selectedValue) {
      displayItems.push(option.name);
    } else if (option.type === 'radio' && selectedValue && option.options) {
      const selectedOption = option.options.find(opt => opt.id === selectedValue);
      if (selectedOption) {
        displayItems.push(`${option.name}: ${selectedOption.name}`);
      }
    }
  });

  return displayItems;
}

/**
 * Validate customizations against available options
 */
export function validateCustomizations(
  customizationOptions: CustomizationOption[],
  selectedCustomizations: SelectedCustomizations
): boolean {
  if (!customizationOptions || !selectedCustomizations) {
    return true;
  }

  for (const option of customizationOptions) {
    const selectedValue = selectedCustomizations[option.id];
    
    if (option.type === 'radio' && selectedValue && option.options) {
      // For radio options, ensure the selected value exists in the options
      const validOption = option.options.find(opt => opt.id === selectedValue);
      if (!validOption) {
        return false;
      }
    } else if (option.type === 'checkbox' && selectedValue !== undefined) {
      // For checkbox options, ensure the value is boolean
      if (typeof selectedValue !== 'boolean') {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get default customizations (first radio option selected, checkboxes unchecked)
 */
export function getDefaultCustomizations(
  customizationOptions: CustomizationOption[]
): SelectedCustomizations {
  const defaultCustomizations: SelectedCustomizations = {};

  if (!customizationOptions) {
    return defaultCustomizations;
  }

  customizationOptions.forEach(option => {
    if (option.type === 'radio' && option.options && option.options.length > 0) {
      // Select the first option for radio buttons
      defaultCustomizations[option.id] = option.options[0].id;
    } else if (option.type === 'checkbox') {
      // Uncheck checkboxes by default
      defaultCustomizations[option.id] = false;
    }
  });

  return defaultCustomizations;
}
