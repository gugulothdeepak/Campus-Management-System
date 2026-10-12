import mongoose from 'mongoose';

const markSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rollNo: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    subjectCode: {
      type: String,
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      default: 'Sem 5',
    },
    mid1: {
      type: Number,
      required: true,
      min: 0,
      max: 30,
      default: 0,
    },
    mid2: {
      type: Number,
      required: true,
      min: 0,
      max: 30,
      default: 0,
    },
    assignment: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      default: 'N/A',
    },
  },
  {
    timestamps: true,
  }
);

markSchema.index({ studentId: 1, subjectCode: 1 }, { unique: true });

const Mark = mongoose.model('Mark', markSchema);
export default Mark;
