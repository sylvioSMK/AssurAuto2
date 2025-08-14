'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-blue-600">Système de Pointage</h1>
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors cursor-pointer">
                Pointage
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors cursor-pointer">
                Tableau de Bord
              </Link>
              <Link href="/calendar" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors cursor-pointer">
                Calendrier
              </Link>
              <Link href="/reports" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors cursor-pointer">
                Rapports
              </Link>
            </nav>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>
    </header>
  );
}