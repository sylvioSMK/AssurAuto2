"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawPage() {
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState("yass");
  const [amount, setAmount] = useState("");
  const router = useRouter();

  // Demande de confirmation dès que la page est chargée
  useEffect(() => {
    const confirmRetrait = window.confirm("Voulez-vous vraiment retirer vos fonds ?");
    if (confirmRetrait) {
      setShowForm(true);
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/retrait", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, type, amount }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Un code de confirmation vous a été envoyé par SMS.");
    } else {
      alert("Erreur : " + data.message);
    }
  };

  if (!showForm) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Retrait de fonds
        </h2>

        <input
          type="text"
          placeholder="Numéro de téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="yass">Yass</option>
          <option value="tmoney">TMoney</option>
        </select>

        <input
          type="number"
          placeholder="Montant"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition"
        >
          Confirmer le retrait
        </button>
      </form>
    </div>
  );
}