/**
 * Vinkunskap som följer med varje AI-anrop som läser etiketter eller fyller i uppgifter om en dryck.
 * Modellen kan det mesta redan; guiden styr hur den läser och när den ska vara försiktig.
 */
export const VINGUIDE = `## Så läser du en etikett
- Skilj på producent (huset/vingården, ofta längst upp eller längst ner, t.ex. "Château …", "Domaine …", "Bodegas …", "Weingut …", "Cantina …") och vinets namn (cuvén, vingården eller appellationen). Skriv bara det som står på etiketten; hitta aldrig på en producent.
- Årgång är ett fyrsiffrigt år (1950–nuvarande år), ofta nära "Vintage", "Millésime", "Cosecha", "Jahrgang" eller på halsetiketten. Andra siffror (alkoholhalt, volym, partinummer, flasknummer, grundandeår som "Est. 1887") är inte årgång. Icke-årgångsviner (Champagne "NV", "MV") har null.
- Alkoholhalt står som "13,5 % vol" eller "ABV 13.5%". Volym som "75 cl", "750 ml", "70 cl" (= 700 ml), "1,5 L".
- Läs även baketiketten om den syns: importör, druvor, land och region står ofta där.

## Termer att känna igen
- Frankrike: AOC/AOP, Grand Cru, Premier Cru, Cru Bourgeois, Cru Classé, Château, Domaine, Brut/Sec/Demi-Sec/Doux, Crémant, Blanc de Blancs.
- Italien: DOCG/DOC/IGT/IGP, Classico, Superiore, Riserva, Barolo, Barbaresco, Chianti, Brunello, Amarone, Valpolicella, Prosecco, Asti.
- Spanien: DO/DOCa, Joven, Crianza, Reserva, Gran Reserva, Cava, Rioja, Ribera del Duero, Priorat.
- Tyskland/Österrike: Qualitätswein, Prädikatswein, Kabinett, Spätlese, Auslese, Beerenauslese, Trockenbeerenauslese, Trocken, Halbtrocken, Eiswein, Grosse Lage, GG.
- Portugal: DOC, Reserva, Colheita, Vinho Verde, Douro, Porto (Ruby, Tawny, LBV, Vintage).
- Nya världen: AVA (USA), GI (Australien), WO (Sydafrika), Reserve, Single Vineyard, Old Vine.
- Sprit: Single Malt, Blended, Cask Strength, "12 Years Old" (åldersangivelse), Bourbon, Rye, XO/VSOP/VS, Añejo/Reposado/Blanco, Agricole, London Dry, Navy Strength.

## Druvor och stil härleds från appellationen när det är säkert
Barolo/Barbaresco = Nebbiolo · Chianti/Brunello = Sangiovese · Rioja/Ribera del Duero = främst Tempranillo · Chablis = Chardonnay · Sancerre/Pouilly-Fumé = Sauvignon Blanc · Champagne = Chardonnay, Pinot Noir, Pinot Meunier · Mosel/Rheingau = oftast Riesling · Bourgogne rött = Pinot Noir, vitt = Chardonnay · Beaujolais = Gamay · Châteauneuf-du-Pape = Grenache m.fl. blandning · Vinho Verde = främst Alvarinho/Loureiro. Är du inte säker, lämna druvor tomt eller markera det som osäkert.

## Var ärlig om osäkerhet
- Lista i osakraFalt varje fält du har gissat eller härlett i stället för att läsa av etiketten, och varje fält där texten är oläslig, skymd eller tvetydig. Namn, producent och årgång som står tydligt på etiketten är inte osäkra.
- Hellre null och en notering i osakraFalt än en trolig gissning. Smakprofil, dofter, mat, beskrivning och pris är alltid uppskattningar; lista dem inte som osäkra, men sätt pris till null om du inte har en rimlig uppfattning.
- Sätt sakerhet till "lag" om du inte kan läsa producenten eller namnet.`;
