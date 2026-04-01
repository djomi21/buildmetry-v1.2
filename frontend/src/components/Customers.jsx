import React from 'react';
import { Link } from 'react-router-dom';

const Customers = ({ customers }) => {
  return (
    <div className="customers">
      <h2>Customers</h2>
      <Link to="/customers/new">Add New Customer</Link>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Customers;
