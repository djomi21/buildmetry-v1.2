// src/utils/calculations.js

export const calcInv = (project) => {
  const { laborCost, materialCost, overheadCost } = project;
  return laborCost + materialCost + overheadCost;
};

export const calcBurden = (project) => {
  const { laborCost, burden } = project;
  return laborCost * burden;
};

export const getBurdenedRate = (project) => {
  const { laborRate, burden } = project;
  return laborRate * (1 + burden);
};

export const fmtUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const todayISO = () => {
  return new Date().toISOString().split('T')[0];
};

export const uid = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
