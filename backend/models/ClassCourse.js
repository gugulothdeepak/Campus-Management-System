import mongoose from 'mongoose';

const classCourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      default: 'Computer Science & Engineering',
    },
    semester: {
      type: String,
      required: true,
      default: 'Sem 5',
    },
    section: {
      type: String,
      required: true,
      default: 'A',
    },
    academicYear: {
      type: String,
      default: '2026-2027',
    },
  },
  {
    timestamps: true,
  }
);

const ClassCourse = mongoose.model('ClassCourse', classCourseSchema);
export default ClassCourse;
