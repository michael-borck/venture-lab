import { invoke } from '@tauri-apps/api/core';

/**
 * Validates an API key format for a specific provider
 * @param {string} provider - The provider name (openai, anthropic, gemini, ollama)
 * @param {string} apiKey - The API key to validate
 * @returns {Promise<{is_valid: boolean, error_message: string|null, masked_key: string}>}
 */
export async function validateApiKey(provider, apiKey) {
  try {
    const result = await invoke('validate_api_key', {
      provider: provider.toLowerCase(),
      apiKey: apiKey
    });
    return result;
  } catch (error) {
    console.error('Failed to validate API key:', error);
    return {
      is_valid: false,
      error_message: error.toString(),
      masked_key: ''
    };
  }
}

/**
 * Example usage in a React component:
 * 
 * const [apiKey, setApiKey] = useState('');
 * const [validation, setValidation] = useState(null);
 * 
 * const handleValidation = async () => {
 *   const result = await validateApiKey('openai', apiKey);
 *   setValidation(result);
 * };
 * 
 * return (
 *   <div>
 *     <input 
 *       type="password" 
 *       value={apiKey} 
 *       onChange={(e) => setApiKey(e.target.value)}
 *       onBlur={handleValidation}
 *     />
 *     {validation && !validation.is_valid && (
 *       <p className="error">{validation.error_message}</p>
 *     )}
 *     {validation && validation.is_valid && (
 *       <p className="success">✓ Valid key: {validation.masked_key}</p>
 *     )}
 *   </div>
 * );
 */

// Real-time validation helper
export function getKeyValidationPattern(provider) {
  switch (provider.toLowerCase()) {
    case 'openai':
      return {
        pattern: /^sk-[a-zA-Z0-9]+$/,
        minLength: 20,
        placeholder: 'sk-...',
        helpText: 'OpenAI API key should start with "sk-" followed by alphanumeric characters'
      };
    case 'anthropic':
      return {
        pattern: /^sk-ant-[a-zA-Z0-9\-_]+$/,
        minLength: 30,
        placeholder: 'sk-ant-...',
        helpText: 'Anthropic API key should start with "sk-ant-" followed by alphanumeric characters'
      };
    case 'gemini':
      return {
        pattern: /^[a-zA-Z0-9\-_]+$/,
        minLength: 20,
        placeholder: 'AIza...',
        helpText: 'Gemini API key should be at least 20 characters (alphanumeric, hyphens, underscores)'
      };
    case 'ollama':
      return {
        pattern: null, // Optional, any format
        minLength: 0,
        placeholder: 'Optional bearer token',
        helpText: 'Ollama can work without authentication or with any bearer token format'
      };
    default:
      return {
        pattern: null,
        minLength: 1,
        placeholder: 'API key',
        helpText: 'Enter your API key'
      };
  }
}

// Client-side pre-validation
export function quickValidateKey(provider, apiKey) {
  const validation = getKeyValidationPattern(provider);
  const trimmedKey = apiKey.trim();
  
  if (!trimmedKey && provider.toLowerCase() === 'ollama') {
    return { valid: true, message: null };
  }
  
  if (!trimmedKey) {
    return { valid: false, message: 'API key cannot be empty' };
  }
  
  if (trimmedKey.length < validation.minLength) {
    return { 
      valid: false, 
      message: `Key is too short (minimum ${validation.minLength} characters)` 
    };
  }
  
  if (validation.pattern && !validation.pattern.test(trimmedKey)) {
    return { 
      valid: false, 
      message: validation.helpText 
    };
  }
  
  return { valid: true, message: null };
}