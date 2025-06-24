
import { HistoryItem } from '../types';
import { HISTORY_LOCAL_STORAGE_KEY } from '../constants';

export const getHistoryItems = (): HistoryItem[] => {
  try {
    const itemsJson = localStorage.getItem(HISTORY_LOCAL_STORAGE_KEY);
    return itemsJson ? JSON.parse(itemsJson) : [];
  } catch (error) {
    console.error("Error fetching history items from localStorage:", error);
    return [];
  }
};

export const saveHistoryItem = (itemData: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem => {
  const currentItems = getHistoryItems();
  const newItem: HistoryItem = {
    ...itemData,
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Simple unique ID
    timestamp: Date.now(),
  };
  currentItems.unshift(newItem); // Add to the beginning of the array

  try {
    localStorage.setItem(HISTORY_LOCAL_STORAGE_KEY, JSON.stringify(currentItems));
  } catch (error) {
    console.error("Error saving history item to localStorage:", error);
    // Optionally, handle quota exceeded or other errors
  }
  return newItem;
};

export const deleteHistoryItem = (id: string): HistoryItem[] => {
  let currentItems = getHistoryItems();
  currentItems = currentItems.filter(item => item.id !== id);
  try {
    localStorage.setItem(HISTORY_LOCAL_STORAGE_KEY, JSON.stringify(currentItems));
  } catch (error) {
    console.error("Error deleting history item from localStorage:", error);
  }
  return currentItems;
};

export const clearAllHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing all history from localStorage:", error);
  }
};