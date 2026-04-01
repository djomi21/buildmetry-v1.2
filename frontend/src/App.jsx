import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAppData } from './hooks/useAppData';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Projects from './components/Projects';
import Estimates from './components/Estimates';
import Invoices from './components/Invoices';

function App() {
  const { 
    customers, 
    projects, 
    estimates, 
    invoices, 
    loading, 
    error 
  } = useAppData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers customers={customers} />} />
          <Route path="/projects" element={<Projects projects={projects} />} />
          <Route path="/estimates" element={<Estimates estimates={estimates} />} />
          <Route path="/invoices" element={<Invoices invoices={invoices} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
