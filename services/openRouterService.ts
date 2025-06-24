
import { OpenRouterApiKeyEntry } from '../types';
import { OPENROUTER_API_KEYS_LOCAL_STORAGE_KEY, DEFAULT_OPENROUTER_API_KEYS } from '../constants';

export const getOpenRouterApiKeys = (): OpenRouterApiKeyEntry[] => {
  try {
    const storedKeysJson = localStorage.getItem(OPENROUTER_API_KEYS_LOCAL_STORAGE_KEY);
    if (storedKeysJson) {
      const storedKeys = JSON.parse(storedKeysJson) as OpenRouterApiKeyEntry[];
      // Validate structure and ensure one is active
      if (Array.isArray(storedKeys) && storedKeys.every(k => k.id && k.name && k.key)) {
         // Ensure default keys are present if local storage is missing some
        const completeKeys = DEFAULT_OPENROUTER_API_KEYS.map(defaultKey => {
            const foundStoredKey = storedKeys.find(sk => sk.id === defaultKey.id);
            return foundStoredKey ? {...defaultKey, ...foundStoredKey, key: defaultKey.key } : defaultKey; // always use default key value
        });

        const activeKeyExists = completeKeys.some(k => k.isActive);
        if (!activeKeyExists && completeKeys.length > 0) {
          completeKeys[0].isActive = true; // Make the first one active if none are
        }
        // Ensure only one key is active
        let foundActive = false;
        const processedKeys = completeKeys.map(key => {
            if (key.isActive) {
                if (foundActive) {
                    return {...key, isActive: false}; // Deactivate subsequent active keys
                }
                foundActive = true;
            }
            return key;
        });
        // If still no active key (e.g. all were marked false), activate the first one.
        if (!foundActive && processedKeys.length > 0) {
            processedKeys[0].isActive = true;
        }
        localStorage.setItem(OPENROUTER_API_KEYS_LOCAL_STORAGE_KEY, JSON.stringify(processedKeys));
        return processedKeys;
      }
    }
  } catch (error) {
    console.error("Error fetching OpenRouter API keys from localStorage:", error);
  }
  
  // Default fallback or if localStorage is corrupted/empty
  localStorage.setItem(OPENROUTER_API_KEYS_LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_OPENROUTER_API_KEYS));
  return DEFAULT_OPENROUTER_API_KEYS;
};

export const setActiveOpenRouterApiKey = (id: string): OpenRouterApiKeyEntry[] => {
  let keys = getOpenRouterApiKeys(); // Gets current state, potentially initialized
  keys = keys.map(key => ({
    ...key,
    isActive: key.id === id,
  }));
  try {
    localStorage.setItem(OPENROUTER_API_KEYS_LOCAL_STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error("Error saving active OpenRouter API key to localStorage:", error);
  }
  return keys;
};

export const getActiveOpenRouterApiKey = (): OpenRouterApiKeyEntry | null => {
  const keys = getOpenRouterApiKeys();
  return keys.find(key => key.isActive) || null;
};