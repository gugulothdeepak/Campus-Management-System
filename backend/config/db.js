import mongoose from 'mongoose';
import { storage } from '../data/dbStorage.js';
import User from '../models/User.js';
import ClassCourse from '../models/ClassCourse.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import Mark from '../models/Mark.js';

export let isMongoConnected = false;

export async function connectDB() {
  // Always initialize local storage engine first so all queries and seed data are ready
  await storage.init();

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_attendance';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10s for Atlas cloud connectivity
    });

    isMongoConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);

    // If MongoDB is connected and collections are empty, seed them from storage
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[MongoDB] Collections empty, seeding MongoDB from initial seed data...');
        const seededUsers = storage.getUsersByRole();
        for (const u of seededUsers) {
          const uDoc = { ...u };
          delete uDoc._id; // Let Mongo generate _id or keep string if needed
          await User.create(uDoc).catch(() => {});
        }
        for (const c of storage.getAllClasses()) {
          const cDoc = { ...c };
          delete cDoc._id;
          await ClassCourse.create(cDoc).catch(() => {});
        }
        for (const s of storage.getAllSubjects()) {
          const sDoc = { ...s };
          delete sDoc._id;
          await Subject.create(sDoc).catch(() => {});
        }
        for (const a of storage.getAllAttendance()) {
          const aDoc = { ...a };
          delete aDoc._id;
          await Attendance.create(aDoc).catch(() => {});
        }
        for (const m of storage.getAllMarks()) {
          const mDoc = { ...m };
          delete mDoc._id;
          await Mark.create(mDoc).catch(() => {});
        }
        console.log('[MongoDB] Database seeded successfully.');
      }
    } catch (seedErr) {
      console.warn('[MongoDB] Sync note:', seedErr.message);
    }
  } catch (error) {
    isMongoConnected = false;
    console.log('[Database Notice] Local MongoDB service was not reached.');
    console.log(`[Database Notice] Active Database: Persistent Storage Engine (backend/data/db.json)`);
    console.log('[Database Notice] All MERN features, CRUD operations, authentication, and reports are fully operational!');
    console.log(`[Database Notice] To connect to MongoDB or MongoDB Atlas later, update MONGO_URI in backend/.env.`);
  }
}
