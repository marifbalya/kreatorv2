
import { ApiKeyEntry, DisplayCreditType } from '../types';
import { API_KEYS_LOCAL_STORAGE_KEY, ADMIN_CODE_CREDIT_MAP, FEATURE_DISPLAY_COSTS } from '../constants';

const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

const calculateInitialCredit = (type: DisplayCreditType, adminCode?: string): number => {
  if (type === 'free') return 0;
  if (type === 'fixed_1000') return 1000;
  if (type === 'custom' && adminCode) {
    return ADMIN_CODE_CREDIT_MAP[adminCode.toUpperCase()] || 0;
  }
  return 0; // Default or if custom code not found
};

const _getUserManagedApiKeysFromStorage = (): ApiKeyEntry[] => {
  try {
    const itemsJson = localStorage.getItem(API_KEYS_LOCAL_STORAGE_KEY);
    return itemsJson ? JSON.parse(itemsJson).map((k: any) => { // Ensure all fields are present with defaults
        const storedDisplayCreditType = k.displayCreditType as string;
        let validatedDisplayCreditType: DisplayCreditType;

        if (storedDisplayCreditType === 'fixed_1000' || storedDisplayCreditType === 'custom') {
            validatedDisplayCreditType = storedDisplayCreditType;
        } else {
            // Defaults to 'free' if it's 'free', undefined, null, empty, or any other invalid string
            validatedDisplayCreditType = 'free';
        }
        
        const initialCredit = k.initialDisplayCredit !== undefined 
            ? k.initialDisplayCredit 
            : calculateInitialCredit(validatedDisplayCreditType, k.adminCode);
        
        const currentCredit = k.currentDisplayCredit !== undefined
            ? k.currentDisplayCredit
            : initialCredit;

        return {
            id: k.id || generateId(),
            name: k.name || 'Kredit Tanpa Nama',
            key: k.key || '',
            isActive: k.isActive === true, // Default to false if not set or invalid
            isUserManaged: k.isUserManaged !== false, // Default to true
            displayCreditType: validatedDisplayCreditType,
            adminCode: k.adminCode, // Can be undefined
            initialDisplayCredit: initialCredit,
            currentDisplayCredit: currentCredit,
        };
    }) : [];
  } catch (error) {
    console.error("Error fetching user API keys from localStorage:", error);
    return [];
  }
};

const _processAndSaveUserKeys = (currentUserKeys: ApiKeyEntry[]): ApiKeyEntry[] => {
  let keysToProcess = [...currentUserKeys]; 

  let activeKey = keysToProcess.find(k => k.isActive && k.key && k.key.trim() !== "");

  if (!activeKey) {
    const firstValidUserKey = keysToProcess.find(k => k.key && k.key.trim() !== "");
    if (firstValidUserKey) {
      activeKey = firstValidUserKey;
    }
  }

  keysToProcess = keysToProcess.map(k => ({
    ...k,
    isActive: activeKey ? k.id === activeKey.id : false,
  }));

  try {
    localStorage.setItem(API_KEYS_LOCAL_STORAGE_KEY, JSON.stringify(keysToProcess));
  } catch (error) {
    console.error("Error saving processed user API keys to localStorage:", error);
  }
  return keysToProcess;
};

export const getApiKeys = (): ApiKeyEntry[] => {
  const userKeys = _getUserManagedApiKeysFromStorage();
  return _processAndSaveUserKeys(userKeys); 
};

export const saveApiKey = (
  data: { 
    name: string; 
    key: string; 
    displayCreditType: DisplayCreditType; 
    adminCode?: string 
  },
  idToUpdate?: string
): ApiKeyEntry[] => {
  let userKeys = _getUserManagedApiKeysFromStorage();
  const initialCredit = calculateInitialCredit(data.displayCreditType, data.adminCode);

  if (idToUpdate) {
    userKeys = userKeys.map(k => {
      if (k.id === idToUpdate) {
        return { 
          ...k, 
          name: data.name, 
          key: data.key,
          displayCreditType: data.displayCreditType,
          adminCode: data.displayCreditType === 'custom' ? data.adminCode : undefined,
          initialDisplayCredit: initialCredit,
          // When editing, currentDisplayCredit should reflect the new initial value,
          // or retain old if logic dictates (e.g. only name/key change not type/code)
          // For simplicity and to match previous logic, reset current to initial.
          currentDisplayCredit: initialCredit, 
        };
      }
      return k;
    });
  } else {
    const newKey: ApiKeyEntry = {
      id: generateId(),
      name: data.name,
      key: data.key,
      isActive: false, 
      isUserManaged: true,
      displayCreditType: data.displayCreditType,
      adminCode: data.displayCreditType === 'custom' ? data.adminCode : undefined,
      initialDisplayCredit: initialCredit,
      currentDisplayCredit: initialCredit,
    };
    userKeys.push(newKey);
  }
  return _processAndSaveUserKeys(userKeys);
};

export const deleteApiKey = (id: string): ApiKeyEntry[] => {
  let userKeys = _getUserManagedApiKeysFromStorage();
  userKeys = userKeys.filter(k => k.id !== id);
  return _processAndSaveUserKeys(userKeys);
};

export const setActiveApiKey = (id: string): ApiKeyEntry[] => {
  let userKeys = _getUserManagedApiKeysFromStorage();
  const keyToActivate = userKeys.find(k => k.id === id);

  if (keyToActivate && keyToActivate.key && keyToActivate.key.trim() !== "") {
    userKeys = userKeys.map(k => ({
      ...k,
      isActive: k.id === id,
    }));
  } else {
    if (keyToActivate) { 
        console.warn(`Attempted to activate an invalid Kredit: ${keyToActivate.name}.`);
        userKeys = userKeys.map(k => k.id === id ? {...k, isActive: false} : k);
    } else {
        console.warn(`Attempted to activate a non-existent Kredit ID: ${id}.`);
    }
  }
  return _processAndSaveUserKeys(userKeys); 
};

export const getActiveApiKey = (): ApiKeyEntry | null => {
  const keys = getApiKeys(); 
  return keys.find(k => k.isActive && k.key && k.key.trim() !== "") || null;
};

export const deductDisplayCredit = (activeApiKeyId: string, featureKey: keyof typeof FEATURE_DISPLAY_COSTS): ApiKeyEntry[] => {
  let userKeys = _getUserManagedApiKeysFromStorage();
  const cost = FEATURE_DISPLAY_COSTS[featureKey] || 0;

  userKeys = userKeys.map(k => {
    if (k.id === activeApiKeyId && k.displayCreditType !== 'free' && cost > 0) {
      return {
        ...k,
        currentDisplayCredit: Math.max(0, k.currentDisplayCredit - cost), // Prevent negative display credit
      };
    }
    return k;
  });
  
  try {
    localStorage.setItem(API_KEYS_LOCAL_STORAGE_KEY, JSON.stringify(userKeys));
  } catch (error) {
    console.error("Error saving updated display credit to localStorage:", error);
  }
  return userKeys; 
};