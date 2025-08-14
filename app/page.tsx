'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <i className="ri-shield-check-line text-xl text-white"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">AssurAuto</h1>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#services" className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">Services</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">Fonctionnalités</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">Contact</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                Se connecter
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap">
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20car%20insurance%20concept%20with%20digital%20technology%2C%20mobile%20app%20interface%20showing%20insurance%20documents%20and%20payment%20options%2C%20clean%20professional%20office%20environment%2C%20bright%20blue%20and%20white%20color%20scheme%2C%20minimalist%20design%2C%20high-tech%20dashboard%20display&width=1200&height=600&seq=hero1&orientation=landscape')`
          }}
        >
          <div className="absolute inset-0 bg-blue-900/70"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-white mb-6">
              Gérez vos assurances automobiles en toute simplicité
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Ne manquez plus jamais l'échéance de vos assurances. Cotisez intelligemment, 
              recevez des alertes automatiques et gérez votre budget assurance efficacement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center cursor-pointer whitespace-nowrap">
                Commencer gratuitement
              </Link>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors whitespace-nowrap cursor-pointer">
                En savoir plus
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Nos Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une solution complète pour la gestion de vos assurances automobiles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-calendar-check-line text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Suivi des Échéances</h3>
              <p className="text-gray-600">
                Recevez des alertes une semaine avant l'expiration de vos assurances auto, TVM et autres.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Système de Cotisation</h3>
              <p className="text-gray-600">
                Cotisez régulièrement via YAS ou Flooz pour avoir les fonds nécessaires au renouvellement.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-wallet-line text-2xl text-purple-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Gestion des Fonds</h3>
              <p className="text-gray-600">
                Retirez ou suspendez vos fonds selon vos besoins avec des options de blocage temporaire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Fonctionnalités Avancées</h2>
            <p className="text-xl text-gray-600">
              Tout ce dont vous avez besoin pour gérer vos assurances efficacement
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-notification-3-line text-xl text-blue-600"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Alertes Intelligentes</h3>
                    <p className="text-gray-600">
                      Recevez des notifications push et email 7 jours avant l'expiration de vos assurances.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-calculator-line text-xl text-green-600"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Estimation Automatique</h3>
                    <p className="text-gray-600">
                      Le système calcule automatiquement le coût estimé de vos assurances et propose des cotisations adaptées.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-smartphone-line text-xl text-purple-600"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Paiements Mobiles</h3>
                    <p className="text-gray-600">
                      Intégration complète avec YAS et Flooz pour des cotisations rapides et sécurisées.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://readdy.ai/api/search-image?query=Professional%20mobile%20app%20dashboard%20interface%20showing%20insurance%20management%20features%2C%20clean%20modern%20UI%20design%20with%20blue%20and%20white%20colors%2C%20smartphone%20displaying%20financial%20charts%20and%20notification%20alerts%2C%20professional%20business%20environment&width=600&height=400&seq=features1&orientation=landscape"
                alt="Interface de l'application"
                className="rounded-lg shadow-xl w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à simplifier la gestion de vos assurances ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui font déjà confiance à AssurAuto
            pour gérer leurs assurances automobiles en toute sérénité.
          </p>
          <Link href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-2">
                  <i className="ri-shield-check-line text-white"></i>
                </div>
                <h3 className="text-xl font-bold">AssurAuto</h3>
              </div>
              <p className="text-gray-400">
                La solution intelligente pour gérer vos assurances automobiles.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Gestion des échéances</li>
                <li>Système de cotisation</li>
                <li>Alertes automatiques</li>
                <li>Paiements mobiles</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Centre d'aide</li>
                <li>Contact</li>
                <li>FAQ</li>
                <li>Guides</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <p>Email: support@assurauto.com</p>
                <p>Tél: +228 XX XX XX XX</p>
                <div className="flex space-x-4 mt-4">
                  <i className="ri-facebook-fill text-xl cursor-pointer hover:text-blue-400"></i>
                  <i className="ri-twitter-fill text-xl cursor-pointer hover:text-blue-400"></i>
                  <i className="ri-linkedin-fill text-xl cursor-pointer hover:text-blue-400"></i>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AssurAuto. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}