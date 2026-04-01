// src/services/dataService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

export const createItem = async (endpoint, item) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create item: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error creating item in ${endpoint}:`, error);
    throw error;
  }
};

export const updateItem = async (endpoint, id, item) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update item: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating item in ${endpoint}:`, error);
    throw error;
  }
};

export const deleteItem = async (endpoint, id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete item: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting item in ${endpoint}:`, error);
    throw error;
  }
};
