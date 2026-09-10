import mongoose, { Schema, Document } from "mongoose";
import { AppointmentStatus } from "@maasuraksha/shared";

export interface IAppointmentDocument extends Document {
  patient: mongoose.Types.ObjectId;
  doctor?: mongoose.Types.ObjectId;
  asha?: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  cancelledReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointmentDocument>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: { type: Schema.Types.ObjectId, ref: "User" },
    asha: { type: Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, required: true },
    time: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
    },
    type: { type: String, required: true, maxlength: 100 },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      required: true,
      default: AppointmentStatus.SCHEDULED,
    },
    notes: { type: String, maxlength: 500 },
    cancelledReason: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ asha: 1, date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1 });

export const Appointment = mongoose.model<IAppointmentDocument>(
  "Appointment",
  appointmentSchema
);