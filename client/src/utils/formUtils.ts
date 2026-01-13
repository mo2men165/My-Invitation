export const formUtils = {
    // Debounced validation function
    createDebouncedValidator: <T extends (...args: any[]) => any>(
      validationFn: T,
      delay: number = 300
    ) => {
      let timeoutId: NodeJS.Timeout;
    
      return (...args: Parameters<T>): Promise<ReturnType<T>> => {
        clearTimeout(timeoutId);
        return new Promise((resolve) => {
          timeoutId = setTimeout(() => {
            resolve(validationFn(...args));
          }, delay);
        });
      };
    },    
  
    // Check if form has any data entered
    hasFormData: (form: any): boolean => {
      return Object.values(form).some(value => {
        if (typeof value === 'string') {
          return value.trim() !== '';
        }
        if (typeof value === 'number') {
          return value !== 100 && value !== 0; // Default values
        }
        if (typeof value === 'boolean') {
          return value !== true; // Default QR code value
        }
        return false;
      });
    },
  
    // Generate form field key for React keys
    generateFieldKey: (fieldName: string, index?: number): string => {
      return index !== undefined ? `${fieldName}-${index}` : fieldName;
    },
  
    // Sanitize form input
    sanitizeInput: (input: string): string => {
      return input.trim().replace(/\s+/g, ' ');
    },

    // Get display city - returns customCity if city is 'اخري', otherwise returns city
    getDisplayCity: (city: string, customCity?: string): string => {
      if (city === 'اخري' && customCity) {
        return customCity;
      }
      return city;
    }
  };
  