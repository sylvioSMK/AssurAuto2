'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ApiResponse {
  success: boolean;
  message?: string;
}

export default function WithdrawPage() {
  const [showModal, setShowModal] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Validation du formulaire
  const validateForm = () => {
    const rawPhone = phone.replace(/\s+/g, '').replace(/^\+/, '').replace(/^00228/, '').replace(/^228/, '');

    if (!/^(9[01237]|7[01])[0-9]{6}$/.test(rawPhone)) {
      setErrorMessage("Veuillez entrer un numéro Mobile Money valide au Togo (9X XX XX XX).");
      return false;
    }

    if (!password) {
      setErrorMessage("Le mot de passe est requis.");
      return false;
    }

    if (!type) {
      setErrorMessage("Veuillez sélectionner un type de retrait.");
      return false;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Veuillez entrer un montant supérieur à zéro.");
      return false;
    }

    return true;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!validateForm()) return;

    setIsLoading(true);

    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('228') ? cleanPhone : `228${cleanPhone}`;

    try {
      const res = await fetch("/api/retrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: finalPhone, password, type, amount }),
      });

      const data: ApiResponse = await res.json();

      if (data.success) {
        setSuccessMessage("Un SMS de confirmation vous a été envoyé.");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setErrorMessage(data.message || "Erreur lors du traitement du retrait.");
      }
    } catch (error) {
      setErrorMessage("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Modale de confirmation initiale
  if (showModal) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Confirmer le retrait</h2>
          <p className="text-gray-600 mb-6">Voulez-vous vraiment retirer vos fonds ?</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setShowModal(false);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Oui
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Non
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modale de succès
  if (successMessage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Succès</h2>
          <p className="text-gray-600 mb-6">{successMessage}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // Formulaire principal
  if (!showForm) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center text-gray-800">Retrait de fonds</h2>

        {errorMessage && (
          <div className="text-red-500 text-center p-3 bg-red-100 rounded-lg" role="alert">
            {errorMessage}
          </div>
        )}

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Numéro de téléphone</label>
          <input
            id="phone"
            type="text"
            placeholder="Ex : 90 00 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input
            id="password"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type de retrait</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            <option value="" disabled>Choisissez un réseau</option>
            <option value="yass">Tmoney (Yass)</option>
            <option value="moov">Flooz (Moov)</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Montant</label>
          <input
            id="amount"
            type="number"
            placeholder="Montant"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
            min="0.01"
            step="0.01"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-blue-600 text-white p-3 rounded-lg font-semibold transition ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
        >
          {isLoading ? "En cours..." : "Confirmer le retrait"}
        </button>
      </form>
    </div>
  );
}
