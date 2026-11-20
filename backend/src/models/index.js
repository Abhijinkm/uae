const { isEmbedded } = require('../config/db');
const { EmbeddedModel } = require('../config/embeddedMongoose');

// Real Mongoose Models
const MongooseUser = require('./User');
const MongooseBranch = require('./Branch');
const MongooseBatch = require('./Batch');
const MongooseInstructor = require('./Instructor');
const MongooseMembershipPackage = require('./MembershipPackage');
const MongooseStudentMembership = require('./StudentMembership');
const MongooseStudent = require('./Student');
const MongooseAttendance = require('./Attendance');
const MongoosePayment = require('./Payment');
const MongooseReminder = require('./Reminder');
const MongooseAuditLog = require('./AuditLog');
const MongooseSettings = require('./Settings');

// Embedded fallback models with schema refs for populate()
const embeddedModels = {
  User: new EmbeddedModel('User', { studentId: 'Student', branch: 'Branch' }),
  Branch: new EmbeddedModel('Branch', {}),
  Batch: new EmbeddedModel('Batch', { branch: 'Branch' }),
  Instructor: new EmbeddedModel('Instructor', { branch: 'Branch' }),
  MembershipPackage: new EmbeddedModel('MembershipPackage', {}),
  StudentMembership: new EmbeddedModel('StudentMembership', { student: 'Student', package: 'MembershipPackage' }),
  Student: new EmbeddedModel('Student', {
    branch: 'Branch',
    batch: 'Batch',
    instructor: 'Instructor',
    currentPackage: 'MembershipPackage',
    currentMembership: 'StudentMembership',
    userId: 'User'
  }),
  Attendance: new EmbeddedModel('Attendance', {
    student: 'Student',
    branch: 'Branch',
    batch: 'Batch',
    membershipCycle: 'StudentMembership',
    markedBy: 'User'
  }),
  Payment: new EmbeddedModel('Payment', {
    student: 'Student',
    membership: 'StudentMembership',
    branch: 'Branch',
    receivedBy: 'User'
  }),
  Reminder: new EmbeddedModel('Reminder', { student: 'Student', membership: 'StudentMembership' }),
  AuditLog: new EmbeddedModel('AuditLog', { performedBy: 'User' }),
  Settings: new EmbeddedModel('Settings', {})
};

const mongooseModels = {
  User: MongooseUser,
  Branch: MongooseBranch,
  Batch: MongooseBatch,
  Instructor: MongooseInstructor,
  MembershipPackage: MongooseMembershipPackage,
  StudentMembership: MongooseStudentMembership,
  Student: MongooseStudent,
  Attendance: MongooseAttendance,
  Payment: MongoosePayment,
  Reminder: MongooseReminder,
  AuditLog: MongooseAuditLog,
  Settings: MongooseSettings
};

function getActiveModel(name) {
  return isEmbedded() ? embeddedModels[name] : mongooseModels[name];
}

function createModelProxy(modelName) {
  return new Proxy(function() {}, {
    get(target, prop) {
      const active = getActiveModel(modelName);
      const val = active[prop];
      if (typeof val === 'function') {
        return val.bind(active);
      }
      return val;
    },
    set(target, prop, value) {
      const active = getActiveModel(modelName);
      active[prop] = value;
      return true;
    },
    apply(target, thisArg, args) {
      const active = getActiveModel(modelName);
      return active(...args);
    },
    construct(target, args) {
      const active = getActiveModel(modelName);
      return new active(...args);
    }
  });
}

module.exports = {
  User: createModelProxy('User'),
  Branch: createModelProxy('Branch'),
  Batch: createModelProxy('Batch'),
  Instructor: createModelProxy('Instructor'),
  MembershipPackage: createModelProxy('MembershipPackage'),
  StudentMembership: createModelProxy('StudentMembership'),
  Student: createModelProxy('Student'),
  Attendance: createModelProxy('Attendance'),
  Payment: createModelProxy('Payment'),
  Reminder: createModelProxy('Reminder'),
  AuditLog: createModelProxy('AuditLog'),
  Settings: createModelProxy('Settings')
};
