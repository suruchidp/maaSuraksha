import { User } from "../models/User";
import { refreshPatientAlerts } from "./alertEngine";
import { retryChatEscalations } from './chatService';

// Persistent dedupe keys make retries and multiple backend instances safe.
export function startAlertWorker() {
 let running = false;
 const tick = async () => {
  if (running) return;
  running = true;
  try {
   await retryChatEscalations();
   for await (const user of User.find({ role: 'PATIENT', isActive: true }).select('_id').cursor()) {
    try { await refreshPatientAlerts(user._id.toString()); }
    catch (error) { console.error('Alert refresh failed', error); }
   }
  } catch (error) { console.error('Alert worker failed', error); }
  finally { running = false; }
 };
 const timer = setInterval(() => { void tick(); }, 60000);
 timer.unref();
 void tick();
 return () => clearInterval(timer);
}
