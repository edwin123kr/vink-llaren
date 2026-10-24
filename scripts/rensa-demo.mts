import "dotenv/config";
import { skapaKlient } from "../lib/prisma-klient";

const db = skapaKlient();
// demokontot och allt det äger (drycker, flaskor, betyg …) försvinner via cascade
const { count: konton } = await db.anvandare.deleteMany({ where: { epost: "demo@exempel.se" } });
const { count } = await db.dryck.deleteMany({ where: { kalla: "demo" } });
console.log(`Tog bort ${konton} demokonto och ${count} övriga exempeldrycker.`);
await db.$disconnect();
