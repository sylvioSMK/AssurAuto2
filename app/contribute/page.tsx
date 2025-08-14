'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContributePage() {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('FLOOZ');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Validation côté client
    if (!amount || !phoneNumber || !network) {
      setError('Tous les champs sont requis.');
      setLoading(false);
      return;
    }

    // identifiant unique pour PayGate
    const identifier = `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          phoneNumber,
          network,
          identifier,
          description: 'Contribution sur site',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.status === 0) {
          setMessage(
            `Transaction initiée ! Un SMS a été envoyé à ${phoneNumber}. Veuillez confirmer le paiement sur votre mobile money.`
          );
          setAmount('');
          setPhoneNumber('');
        } else {
          setError(`Erreur PayGate: ${getStatusMessage(data.status)}`);
        }
      } else {
        setError(data.message || 'Échec de l’initiation du paiement.');
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = (status: number) => {
    const messages: Record<number, string> = {
      2: 'Clé API invalide.',
      4: 'Paramètres invalides.',
      6: 'Transaction en double détectée.',
      0: 'Succès',
    };
    return messages[status] || 'Erreur inconnue.';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f9fc', fontFamily: 'Segoe UI, Arial, sans-serif', padding: '2rem', textAlign: 'center', position: 'relative' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '480px' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#1a1a1a' }}>Contribuez via Mobile Money</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Faites un don ou un paiement sécurisé via Flooz ou Tmoney.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Montant */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>Montant (FCFA)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 5000" min="50" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' }} />
          </div>

          {/* Numéro */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>Numéro de téléphone</label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="90 00 00 00" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' }} />
          </div>

          {/* Réseau */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>Réseau</label>
            <select value={network} onChange={(e) => setNetwork(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', backgroundColor: 'white', boxSizing: 'border-box' }}>
              <option value="FLOOZ">Flooz</option>
              <option value="TMONEY">Tmoney (Yas Togo)</option>
            </select>
          </div>

          {/* Bouton Payer */}
          <button type="submit" disabled={loading} style={{ padding: '0.75rem', backgroundColor: loading ? '#5a5a5a' : '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', transition: 'background-color 0.2s' }}>
            {loading ? 'En cours...' : 'Payer maintenant'}
          </button>
        </form>

        {message && <p style={{ color: 'green', marginTop: '1.2rem', padding: '0.75rem', backgroundColor: '#f0fff4', borderRadius: '8px', fontSize: '0.95rem' }}>{message}</p>}
        {error && <p style={{ color: 'red', marginTop: '1.2rem', padding: '0.75rem', backgroundColor: '#fff5f5', borderRadius: '8px', fontSize: '0.95rem' }}>{error}</p>}
      </div>

      {/* Bouton retour */}
      <button onClick={() => router.push('/dashboard')} style={{ position: 'absolute', bottom: '2rem', left: '2rem', padding: '0.7rem 1.2rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s ease', boxShadow: '0 2px 6px rgba(220, 53, 69, 0.3)' }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
      >
        ← Retour au Dashboard
      </button>

      <p style={{ marginTop: '1.5rem', color: '#aaa', fontSize: '0.85rem' }}>
        &copy; {new Date().getFullYear()} Votre Site. Tous droits réservés.
      </p>
    </div>
  );
}
