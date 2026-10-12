import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT'],
    required: true,
    default: 'PRESENT',
  },
  remarks: {
    type: String,
    default: '',
  },
});

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    classGroup: {
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
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    facultyName: {
      type: String,
      required: true,
    },
    records: [attendanceRecordSchema],
    totalStudents: {
      type: Number,
      required: true,
    },
    presentCount: {
      type: Number,
      required: true,
    },
    absentCount: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure fast search and prevent duplicates
attendanceSchema.index({ date: 1, classGroup: 1, subjectCode: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
