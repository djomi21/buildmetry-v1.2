import { useState, useEffect } from 'react';
import { fetchData } from '../services/dataService';

export const useAppData = () => {
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          fetchedCustomers,
          fetchedProjects,
          fetchedEstimates,
          fetchedInvoices
        ] = await Promise.all([
          fetchData('customers'),
          fetchData('projects'),
          fetchData('estimates'),
          fetchData('invoices')
        ]);

        setCustomers(fetchedCustomers);
        setProjects(fetchedProjects);
        setEstimates(fetchedEstimates);
        setInvoices(fetchedInvoices);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    customers,
    projects,
    estimates,
    invoices,
    loading,
    error
  };
};
