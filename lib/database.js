
// // Configuration et connexion à la base de données MySQL pour XAMPP - AssurAuto
// import mysql from 'mysql2/promise';

// // Configuration XAMPP par défaut
// // const dbConfig = {
// //   host: process.env.DB_HOST || 'localhost',
// //   port: process.env.DB_PORT || 3306,
// //   user: process.env.DB_USER || 'root',
// //   password: process.env.DB_PASSWORD || '', // XAMPP par défaut = pas de mot de passe
// //   database: process.env.DB_NAME || 'assurauto',
// //   charset: 'utf8mb4',
// //   timezone: '+00:00',
// //   acquireTimeout: 60000,
// //   timeout: 60000,
// //   reconnect: true,
// //   multipleStatements: true // Permet d'exécuter plusieurs requêtes
// // };

// // Pool de connexions optimisé pour XAMPP
// let pool;

// try {
//   pool = mysql.createPool({
//     ...dbConfig,
//     waitForConnections: true,
//     connectionLimit: 5, // Réduit pour XAMPP local
//     queueLimit: 0,
//     acquireTimeout: 60000,
//     timeout: 60000
//   });

//   console.log('🔗 Pool de connexions MySQL XAMPP créé avec succès');
// } catch (error) {
//   console.error('❌ Erreur lors de la création du pool MySQL:', error);
// }

// // Fonction pour exécuter des requêtes
// export async function executeQuery(query, params = []) {
//   try {
//     const [results] = await pool.execute(query, params);
//     return results;
//   } catch (error) {
//     console.error('Erreur lors de l\'exécution de la requête:', error);
//     throw error;
//   }
// }

// // Fonction pour démarrer une transaction
// export async function executeTransaction(queries) {
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const results = [];
//     for (const { query, params } of queries) {
//       const [result] = await connection.execute(query, params);
//       results.push(result);
//     }

//     await connection.commit();
//     return results;
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }

// // Classes pour la gestion des données

// // Gestion des utilisateurs
// export class UserManager {
//   static async createUser(userData) {
//     const { email, passwordHash, firstName, lastName, phone } = userData;
//     const query = `
//       INSERT INTO users (email, password_hash, first_name, last_name, phone)
//       VALUES (?, ?, ?, ?, ?)
//     `;

//     try {
//       const result = await executeQuery(query, [email, passwordHash, firstName, lastName, phone]);
//       return result.insertId;
//     } catch (error) {
//       if (error.code === 'ER_DUP_ENTRY') {
//         throw new Error('Cette adresse email est déjà utilisée');
//       }
//       throw error;
//     }
//   }

//   static async getUserByEmail(email) {
//     const query = `
//       SELECT u.*, us.total_balance, us.monthly_contribution, ust.preferred_payment_method
//       FROM users u
//       LEFT JOIN user_savings us ON u.id = us.user_id
//       LEFT JOIN user_settings ust ON u.id = ust.user_id
//       WHERE u.email = ? AND u.is_active = TRUE
//     `;

//     const results = await executeQuery(query, [email]);
//     return results[0] || null;
//   }

//   static async getUserById(userId) {
//     const query = `
//       SELECT u.*, us.total_balance, us.monthly_contribution, ust.preferred_payment_method
//       FROM users u
//       LEFT JOIN user_savings us ON u.id = us.user_id
//       LEFT JOIN user_settings ust ON u.id = ust.user_id
//       WHERE u.id = ? AND u.is_active = TRUE
//     `;

//     const results = await executeQuery(query, [userId]);
//     return results[0] || null;
//   }

//   static async updateLastLogin(userId) {
//     const query = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;
//     await executeQuery(query, [userId]);
//   }
// }

// // Gestion des véhicules
// export class VehicleManager {
//   static async createVehicle(vehicleData) {
//     const { userId, model, brand, year, licensePlate, vin, color } = vehicleData;
//     const query = `
//       INSERT INTO vehicles (user_id, model, brand, year, license_plate, vin, color)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `;

//     const result = await executeQuery(query, [userId, model, brand, year, licensePlate, vin, color]);
//     return result.insertId;
//   }

//   static async getUserVehicles(userId) {
//     const query = `
//       SELECT * FROM vehicles
//       WHERE user_id = ?
//       ORDER BY date_created DESC
//     `;

//     return await executeQuery(query, [userId]);
//   }
// }

// // Gestion des assurances
// export class InsuranceManager {
//   static async createInsurance(insuranceData) {
//     const { userId, vehicleId, insuranceTypeId, policyNumber, startDate, expirationDate, estimatedCost, actualCost } = insuranceData;
//     const query = `
//       INSERT INTO insurances (user_id, vehicle_id, insurance_type_id, policy_number, start_date, expiration_date, estimated_cost, actual_cost)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const result = await executeQuery(query, [userId, vehicleId, insuranceTypeId, policyNumber, startDate, expirationDate, estimatedCost, actualCost]);
//     return result.insertId;
//   }

//   static async getUserInsurances(userId) {
//     const query = `
//       SELECT 
//         i.*,
//         it.name as type_name,
//         it.code as type_code,
//         CONCAT(v.brand, ' ', v.model) as vehicle_name,
//         v.year as vehicle_year,
//         DATEDIFF(i.expiration_date, CURDATE()) as days_until_expiry
//       FROM insurances i
//       JOIN insurance_types it ON i.insurance_type_id = it.id
//       JOIN vehicles v ON i.vehicle_id = v.id
//       WHERE i.user_id = ?
//       ORDER BY i.expiration_date ASC
//     `;

//     return await executeQuery(query, [userId]);
//   }

//   static async getInsuranceById(insuranceId, userId = null) {
//     let query = `
//       SELECT 
//         i.*,
//         it.name as type_name,
//         it.code as type_code,
//         CONCAT(v.brand, ' ', v.model) as vehicle_name,
//         v.year as vehicle_year,
//         DATEDIFF(i.expiration_date, CURDATE()) as days_until_expiry
//       FROM insurances i
//       JOIN insurance_types it ON i.insurance_type_id = it.id
//       JOIN vehicles v ON i.vehicle_id = v.id
//       WHERE i.id = ?
//     `;

//     const params = [insuranceId];

//     if (userId) {
//       query += ' AND i.user_id = ?';
//       params.push(userId);
//     }

//     const results = await executeQuery(query, params);
//     return results[0] || null;
//   }

//   static async updateInsuranceStatus(insuranceId, status) {
//     const query = `UPDATE insurances SET status = ? WHERE id = ?`;
//     await executeQuery(query, [status, insuranceId]);
//   }

//   static async getExpiringInsurances(days = 7) {
//     const query = `
//       SELECT 
//         i.*,
//         it.name as type_name,
//         CONCAT(u.first_name, ' ', u.last_name) as user_name,
//         u.email as user_email,
//         CONCAT(v.brand, ' ', v.model) as vehicle_name,
//         DATEDIFF(i.expiration_date, CURDATE()) as days_until_expiry
//       FROM insurances i
//       JOIN insurance_types it ON i.insurance_type_id = it.id
//       JOIN users u ON i.user_id = u.id
//       JOIN vehicles v ON i.vehicle_id = v.id
//       WHERE DATEDIFF(i.expiration_date, CURDATE()) <= ? 
//       AND DATEDIFF(i.expiration_date, CURDATE()) >= 0
//       AND i.status IN ('active', 'expiring_soon')
//       ORDER BY i.expiration_date ASC
//     `;

//     return await executeQuery(query, [days]);
//   }
// }

// // Gestion des types d'assurance
// export class InsuranceTypeManager {
//   static async getAllTypes() {
//     const query = `SELECT * FROM insurance_types WHERE is_active = TRUE ORDER BY name`;
//     return await executeQuery(query);
//   }

//   static async getTypeById(typeId) {
//     const query = `SELECT * FROM insurance_types WHERE id = ? AND is_active = TRUE`;
//     const results = await executeQuery(query, [typeId]);
//     return results[0] || null;
//   }
// }

// // Gestion des transactions
// export class TransactionManager {
//   static async createTransaction(transactionData) {
//     const { userId, type, amount, paymentMethod, referenceNumber, insuranceId, description } = transactionData;
//     const query = `
//       INSERT INTO transactions (user_id, type, amount, payment_method, reference_number, insurance_id, description, status)
//       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
//     `;

//     const result = await executeQuery(query, [userId, type, amount, paymentMethod, referenceNumber, insuranceId, description]);
//     return result.insertId;
//   }

//   static async getUserTransactions(userId, limit = 50) {
//     const query = `
//       SELECT 
//         t.*,
//         CASE 
//           WHEN t.insurance_id IS NOT NULL THEN it.name
//           ELSE NULL
//         END as insurance_type
//       FROM transactions t
//       LEFT JOIN insurances i ON t.insurance_id = i.id
//       LEFT JOIN insurance_types it ON i.insurance_type_id = it.id
//       WHERE t.user_id = ?
//       ORDER BY t.date_created DESC
//       LIMIT ?
//     `;

//     return await executeQuery(query, [userId, limit]);
//   }

//   static async getTotalContributions(userId) {
//     const query = `
//       SELECT COALESCE(SUM(amount), 0) as total
//       FROM transactions
//       WHERE user_id = ? AND type = 'contribution' AND status = 'completed'
//     `;

//     const results = await executeQuery(query, [userId]);
//     return results[0]?.total || 0;
//   }

//   static async getTotalWithdrawals(userId) {
//     const query = `
//       SELECT COALESCE(SUM(amount), 0) as total
//       FROM transactions
//       WHERE user_id = ? AND type IN ('withdrawal', 'payment') AND status = 'completed'
//     `;

//     const results = await executeQuery(query, [userId]);
//     return results[0]?.total || 0;
//   }
// }

// // Gestion de l'épargne
// export class SavingsManager {
//   static async getUserSavings(userId) {
//     const query = `SELECT * FROM user_savings WHERE user_id = ?`;
//     const results = await executeQuery(query, [userId]);
//     return results[0] || null;
//   }

//   static async updateSavings(userId, data) {
//     const { totalBalance, monthlyContribution, autoContribution, contributionDay } = data;
//     const query = `
//       UPDATE user_savings 
//       SET total_balance = ?, monthly_contribution = ?, auto_contribution = ?, contribution_day = ?
//       WHERE user_id = ?
//     `;

//     await executeQuery(query, [totalBalance, monthlyContribution, autoContribution, contributionDay, userId]);
//   }

//   static async suspendSavings(userId, endDate) {
//     const query = `
//       UPDATE user_savings 
//       SET is_suspended = TRUE, suspension_end_date = ?
//       WHERE user_id = ?
//     `;

//     await executeQuery(query, [endDate, userId]);
//   }

//   static async unsuspendSavings(userId) {
//     const query = `
//       UPDATE user_savings 
//       SET is_suspended = FALSE, suspension_end_date = NULL
//       WHERE user_id = ?
//     `;

//     await executeQuery(query, [userId]);
//   }
// }

// // Gestion des alertes
// export class AlertManager {
//   static async createAlert(alertData) {
//     const { userId, insuranceId, type, title, message, alertDate } = alertData;
//     const query = `
//       INSERT INTO alerts (user_id, insurance_id, type, title, message, alert_date)
//       VALUES (?, ?, ?, ?, ?, ?)
//     `;

//     const result = await executeQuery(query, [userId, insuranceId, type, title, message, alertDate]);
//     return result.insertId;
//   }

//   static async getUserAlerts(userId, unreadOnly = false) {
//     let query = `
//       SELECT 
//         a.*,
//         it.name as insurance_type,
//         CONCAT(v.brand, ' ', v.model) as vehicle_name
//       FROM alerts a
//       JOIN insurances i ON a.insurance_id = i.id
//       JOIN insurance_types it ON i.insurance_type_id = it.id
//       JOIN vehicles v ON i.vehicle_id = v.id
//       WHERE a.user_id = ?
//     `;

//     if (unreadOnly) {
//       query += ' AND a.is_read = FALSE';
//     }

//     query += ' ORDER BY a.date_created DESC';

//     return await executeQuery(query, [userId]);
//   }

//   static async markAlertAsRead(alertId, userId) {
//     const query = `UPDATE alerts SET is_read = TRUE WHERE id = ? AND user_id = ?`;
//     await executeQuery(query, [alertId, userId]);
//   }

//   static async markAllAlertsAsRead(userId) {
//     const query = `UPDATE alerts SET is_read = TRUE WHERE user_id = ?`;
//     await executeQuery(query, [userId]);
//   }
// }

// // Gestion des paramètres utilisateur
// export class UserSettingsManager {
//   static async getUserSettings(userId) {
//     const query = `SELECT * FROM user_settings WHERE user_id = ?`;
//     const results = await executeQuery(query, [userId]);
//     return results[0] || null;
//   }

//   static async updateSettings(userId, settings) {
//     const { notificationEmail, notificationSms, alertDaysBefore, preferredPaymentMethod, timezone, language } = settings;
//     const query = `
//       UPDATE user_settings 
//       SET notification_email = ?, notification_sms = ?, alert_days_before = ?, 
//           preferred_payment_method = ?, timezone = ?, language = ?
//       WHERE user_id = ?
//     `;

//     await executeQuery(query, [notificationEmail, notificationSms, alertDaysBefore, preferredPaymentMethod, timezone, language, userId]);
//   }
// }

// // Statistiques du dashboard
// export class DashboardManager {
//   static async getUserDashboardStats(userId) {
//     const query = `SELECT * FROM user_dashboard_stats WHERE user_id = ?`;
//     const results = await executeQuery(query, [userId]);
//     return results[0] || null;
//   }

//   static async getInsuranceDetails(userId) {
//     const query = `
//       SELECT * FROM insurance_details 
//       WHERE user_id = ? 
//       ORDER BY expiration_date ASC
//     `;

//     return await executeQuery(query, [userId]);
//   }
// }

// // Fonction de nettoyage des ressources
// export async function closeDatabaseConnection() {
//   if (pool) {
//     await pool.end();
//     console.log('Connexions MySQL fermées');
//   }
// }

// // Test de connexion
// export async function testDatabaseConnection() {
//   try {
//     const [result] = await pool.execute('SELECT "Connexion MySQL réussie!" as status');
//     console.log('✅', result[0].status);
//     return true;
//   } catch (error) {
//     console.error('❌ Erreur de connexion MySQL:', error.message);
//     return false;
//   }
// }

// export default {
//   pool,
//   executeQuery,
//   executeTransaction,
//   UserManager,
//   VehicleManager,
//   InsuranceManager,
//   InsuranceTypeManager,
//   TransactionManager,
//   SavingsManager,
//   AlertManager,
//   UserSettingsManager,
//   DashboardManager,
//   testDatabaseConnection,
//   closeDatabaseConnection
// };
