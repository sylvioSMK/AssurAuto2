import prisma from "../../lib/prisma";
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { phone, password, type, amount } = req.body;

  try {
    // Vérification utilisateur
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: "Identifiants invalides" });
    }

    // Vérification du type de retrait
    const validTypes = ["moov", "tmoney"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Type de retrait invalide" });
    }

    // Mapping service API PayGate
    const serviceMap = {
      moov: "moovmoney",
      tmoney: "tmoney"
    };

    // Appel API PayGate Global Togo
    const response = await axios.post("https://api.paygateglobal.com/v1/pay", {
      auth_token: process.env.PAYGATE_TOKEN,
      phone_number: phone,
      amount: amount,
      service: serviceMap[type],
      description: "Retrait de fonds"
    });

    // Enregistrer la transaction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "withdrawal",
        amount: parseFloat(amount),
        paymentMethod: type,
        referenceNumber: response.data.reference || `REF-${Date.now()}`,
        description: `Retrait via ${type.toUpperCase()}`,
        status: response.data.status === "success" ? "completed" : "pending"
      }
    });

    // Réponse finale
    res.json({
      success: true,
      message: "Code SMS envoyé",
      data: response.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
