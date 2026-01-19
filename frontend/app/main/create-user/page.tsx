'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    position: ''
  });
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      setLoading(false);
      return;
    }

    try {
      // Call backend API - it handles EVERYTHING
      const response = await api.users.register(formData);

      // ✅ Success case
      let successMsg = '✅ ' + response.message;
      
      setMessage(successMsg);
      
      // Reset form
      setFormData({ 
        name: '', 
        email: '', 
        password: '', 
        phone: '', 
        gender: '', 
        position: '' 
      });
    } catch (err: any) {
      setMessage('❌ ' + (err.message || 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Add New User</h2>

      <form onSubmit={handleRegister}>
        <input
          name="name"
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded mb-4"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded mb-4"
        />

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded mb-4"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select
          name="position"
          value={formData.position}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded mb-4"
        >
          <option value="">Select Position</option>
          <option value="rbi lead">RBI Lead</option>
          <option value="rbi engineer">RBI Engineer</option>
          <option value="tech assistant">Technical Assistant</option>
        </select>

        <input
          name="phone"
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded mb-4"
        />
        
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          className="w-full p-2 border rounded mb-4"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      {message && (
        <p className={`mt-4 whitespace-pre-line ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}