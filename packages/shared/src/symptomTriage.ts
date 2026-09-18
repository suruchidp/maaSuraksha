// CDC HEAR HER warning signs; decision support, not a diagnosis.
export function symptomTriage(symptoms: readonly string[], severity: string): "urgent" | "review" | "routine" {
 const flags = ["blurred_vision", "vaginal_bleeding", "reduced_fetal_movement", "shortness_of_breath", "chest_pain", "fluid_leaking", "fainting", "self_harm_thoughts", "fever_38", "extreme_face_hand_swelling", "persistent_severe_headache", "persistent_severe_belly_pain", "unable_to_keep_fluids", "painful_swollen_leg"];
 if (["severe", "critical"].includes(severity) || symptoms.some(s => flags.includes(s))) return "urgent";
 if (severity === "moderate" || symptoms.includes("fever")) return "review";
 return "routine";
}
