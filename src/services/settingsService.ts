import type { StoreSettings } from '../config/storeConfig';
import { apiRequest } from './apiClient';

export async function fetchServerSettings() {
  return apiRequest<StoreSettings | null>('/settings');
}

export async function saveServerSettings(settings: StoreSettings) {
  return apiRequest<StoreSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}
