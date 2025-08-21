'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ResetPasswordForm() {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    const cleanedPhone = formData.phone.replace(/[\s.-]/g, '').trim();
    const phoneRegex = /^\+228[1-9]\d{7}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      setMessage('Numéro invalide');
      setIsLoading(false);
      return;
    }

    if (!formData.phone || !formData.password) {
      setMessage('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanedPhone, password: formData.password }),
      });

      const data = await res.json();
      setMessage(data.message);
    } catch {
      setMessage('Erreur serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <i className="ri-shield-check-line text-2xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">AssurAuto</h1>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Réinitialiser votre mot de passe
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              connectez-vous
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {message && (
            <div className={`mb-4 p-4 rounded border-l-4 ${message.includes('succès') ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
              <div className="flex">
                <i className={`ri-${message.includes('succès') ? 'checkbox-circle-line text-green-400' : 'error-warning-line text-red-400'} mr-2`}></i>
                <p className={`text-sm ${message.includes('succès') ? 'text-green-700' : 'text-red-700'}`}>{message}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <i className="ri-phone-line text-gray-400"></i>
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="+228 91 23 45 67"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <i className="ri-lock-line text-gray-400"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Nouveau mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Réinitialisation...
                </div>
              ) : (
                'Réinitialiser'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}