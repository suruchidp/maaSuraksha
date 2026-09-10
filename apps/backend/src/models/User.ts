import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { UserRole, Language } from "@maasuraksha/shared";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  language: Language;
  assignedASHA?: mongoose.Types.ObjectId;
  assignedDoctor?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.PATIENT,
    },
    phone: { type: String, trim: true },
    language: {
      type: String,
      enum: Object.values(Language),
      default: Language.EN,
    },
    assignedASHA: { type: Schema.Types.ObjectId, ref: "User" },
    assignedDoctor: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ assignedASHA: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument>("User", userSchema);
