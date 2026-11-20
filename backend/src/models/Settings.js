const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  academyName: { type: String, default: 'Samurai Martial Arts Academy' },
  tagline: { type: String, default: 'Discipline • Strength • Honor' },
  address: { type: String, default: '742 Evergreen Terrace, Sector 4, Martial Arts Way' },
  phone: { type: String, default: '+1 (555) 234-5678' },
  email: { type: String, default: 'info@samuraiacademy.com' },
  currency: { type: String, default: 'AED' },
  whatsappCountryCode: { type: String, default: '+971' },
  reminderTemplates: {
    upcoming7: {
      type: String,
      default: 'Dear {student_name}, friendly reminder that your {package_name} membership at {academy_name} will expire in 7 days on {expiry_date}. Renewal fee: {amount_due}. Please renew on time!'
    },
    upcoming3: {
      type: String,
      default: 'Dear {student_name}, your membership at {academy_name} expires in 3 days on {expiry_date}. Amount due: {amount_due}. Thank you for training with us!'
    },
    upcoming1: {
      type: String,
      default: 'URGENT: Dear {student_name}, your membership at {academy_name} expires TOMORROW ({expiry_date}). Please renew ({amount_due}) to keep training.'
    },
    onExpiry: {
      type: String,
      default: 'Dear {student_name}, your {package_name} membership at {academy_name} expires TODAY ({expiry_date}). Amount: {amount_due}.'
    },
    expired: {
      type: String,
      default: 'Dear {student_name}, your membership at {academy_name} has expired on {expiry_date}. Please contact reception or renew online to continue your classes.'
    }
  }
}, { timestamps: true });

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

