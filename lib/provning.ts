/**
 * Provningskalkyl.
 *  - Totalt ca 0,5 flaska (375 ml) per person.
 *  - Antal flaskor = ceil(deltagare × 0,5), men minst en flaska per vin.
 *  - Flaskorna fördelas jämnt över vinerna; överskottet hamnar på de första vinerna.
 *  - Ml per glas per vin = 375 ml / antal viner (avrundat nedåt till hela 5 ml).
 *  - Totalbudget = budget per person × deltagare.
 */
export const ML_PER_PERSON = 375;
export const ML_PER_FLASKA = 750;

export interface ProvningIn {
  deltagare: number;
  antalViner: number;
  budgetPerPerson: number;
}

export interface ProvningKalkyl {
  deltagare: number;
  antalViner: number;
  flaskorBerakning: number; // ceil(deltagare × 0,5)
  flaskorTotalt: number; // minst en per vin
  flaskorPerVin: number[];
  mlPerGlas: number; // planerad hällning per vin och person
  mlPerVin: number[]; // tillgängligt per vin (flaskor × 750)
  glasPerVin: number[]; // antal glas som räcker per vin vid planerad hällning
  totalbudget: number;
  budgetPerFlaska: number; // riktmärke
}

export function kalkyl({ deltagare, antalViner, budgetPerPerson }: ProvningIn): ProvningKalkyl {
  if (!Number.isInteger(deltagare) || deltagare < 1) throw new RangeError("Minst en deltagare.");
  if (!Number.isInteger(antalViner) || antalViner < 1) throw new RangeError("Minst ett vin.");
  if (!(budgetPerPerson >= 0)) throw new RangeError("Budgeten kan inte vara negativ.");

  const flaskorBerakning = Math.ceil(deltagare * 0.5);
  const flaskorTotalt = Math.max(flaskorBerakning, antalViner);
  const bas = Math.floor(flaskorTotalt / antalViner);
  const rest = flaskorTotalt % antalViner;
  const flaskorPerVin = Array.from({ length: antalViner }, (_, i) => bas + (i < rest ? 1 : 0));
  const mlPerGlas = Math.floor(ML_PER_PERSON / antalViner / 5) * 5 || Math.floor(ML_PER_PERSON / antalViner);
  const mlPerVin = flaskorPerVin.map((f) => f * ML_PER_FLASKA);
  const totalbudget = Math.round(budgetPerPerson * deltagare);

  return {
    deltagare,
    antalViner,
    flaskorBerakning,
    flaskorTotalt,
    flaskorPerVin,
    mlPerGlas,
    mlPerVin,
    glasPerVin: mlPerVin.map((ml) => Math.floor(ml / mlPerGlas)),
    totalbudget,
    budgetPerFlaska: Math.floor(totalbudget / flaskorTotalt),
  };
}

export interface InkopsRad {
  namn: string;
  flaskor: number;
  prisPerFlaska: number | null;
  delsumma: number | null;
}

export function inkopslista(viner: { namn: string; prisCa: number | null }[], k: ProvningKalkyl) {
  const rader: InkopsRad[] = viner.map((v, i) => {
    const flaskor = k.flaskorPerVin[i] ?? 1;
    return { namn: v.namn, flaskor, prisPerFlaska: v.prisCa, delsumma: v.prisCa == null ? null : v.prisCa * flaskor };
  });
  const kanda = rader.filter((r) => r.delsumma != null);
  const total = kanda.reduce((a, r) => a + (r.delsumma ?? 0), 0);
  return {
    rader,
    total,
    perPerson: Math.round(total / k.deltagare),
    komplett: kanda.length === rader.length,
    overBudget: total > k.totalbudget,
  };
}
