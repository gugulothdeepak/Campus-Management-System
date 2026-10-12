import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'FACULTY', 'STUDENT'],
      required: true,
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    // Student specific fields
    rollNo: {
      type: String,
      sparse: true,
      trim: true,
    },
    semester: {
      type: String,
      default: 'Sem 5',
    },
    section: {
      type: String,
      default: 'A',
    },
    academicYear: {
      type: String,
      default: '2026-2027',
    },
    // Faculty specific fields
    assignedClasses: [
      {
        type: String,
      },
    ],
    assignedSubjects: [
      {
        type: String,
      },
    ],
    designation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hook to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
