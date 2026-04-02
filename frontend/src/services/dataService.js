// dataService.js — thin wrapper that re-exports the main api client.
// All components should import from here (or directly from api.js) rather than
// constructing their own fetch calls.

export { default as api } from '../api';
export { getToken, setToken, clearAuth, getSavedUser, saveUser } from '../api';
