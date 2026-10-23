/** Underlag som skickas till AI-funktionerna (delas av index och mock). */
export interface SmakUnderlag {
  typ: "vin" | "sprit";
  antalBetyg: number;
  profilGillar: Record<string, number | null>;
  profilMindre: Record<string, number | null>;
  favoriter: { druvor: string[]; regioner: string[]; kategorier: string[] };
  lagaBetyg: { namn: string; snitt: string; antal: number }[];
  betyg: { namn: string; kategori: string; druvor: string[]; region: string | null; land: string | null; betyg: string }[];
  kandidater: { id: string; namn: string; producent: string | null; kategori: string; druvor: string[]; region: string | null; land: string | null; prisCa: number | null }[];
  otestade: { druvor: string[]; regioner: string[]; kategorier: string[] };
}

export interface ProvningUnderlag {
  deltagare: number;
  antalViner: number;
  budgetPerPerson: number;
  totalbudget: number;
  budgetPerFlaska: number;
  flaskorPerVin: number[];
  tema: string | null;
  favoriter: string[];
}
