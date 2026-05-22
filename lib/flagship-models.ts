/**
 * Flagship / most-popular models per brand.
 * Models listed here get a massive sorting boost in brand pages,
 * featured sections, and search results.
 *
 * Order within each brand array = priority (first = highest boost).
 * Use short model names — matching is done via case-insensitive `includes()`.
 */
export const FLAGSHIP_MODELS: Record<string, string[]> = {
  // ── German ──────────────────────────────────────────────────────────────────
  'BMW': [
    'M3', 'M4', 'M5', 'M8', 'X5', 'X7', 'X3', 'i4', 'iX',
    '3 Series', '5 Series', '7 Series', 'Z4', 'M2',
  ],
  'Mercedes-Benz': [
    'S-Class', 'C-Class', 'E-Class', 'G-Class', 'AMG GT', 'GLE', 'GLC',
    'A-Class', 'CLA', 'SL', 'EQS', 'Maybach',
  ],
  'Audi': [
    'R8', 'RS6', 'RS7', 'RS3', 'A4', 'A6', 'A8', 'Q7', 'Q8',
    'e-tron GT', 'TT', 'S5', 'Q5',
  ],
  'Porsche': [
    '911', '718', 'Cayenne', 'Macan', 'Panamera', 'Taycan',
    'Cayman', 'Boxster', '918',
  ],
  'Volkswagen': [
    'Golf', 'GTI', 'Golf R', 'ID.4', 'Tiguan', 'Arteon',
    'Jetta', 'Passat', 'Touareg', 'ID.Buzz',
  ],

  // ── Italian ─────────────────────────────────────────────────────────────────
  'Ferrari': [
    'SF90', 'F40', '488', '296', 'LaFerrari', 'Roma', '812',
    'Portofino', 'F50', 'Enzo', 'Testarossa', '250',
  ],
  'Lamborghini': [
    'Aventador', 'Huracán', 'Urus', 'Countach', 'Revuelto',
    'Diablo', 'Gallardo', 'Murciélago', 'Sián',
  ],
  'Maserati': [
    'MC20', 'GranTurismo', 'Ghibli', 'Levante', 'Quattroporte', 'MC12',
  ],
  'Alfa Romeo': [
    'Giulia', 'Stelvio', '4C', 'Tonale', '33 Stradale', 'GTV',
  ],
  'Pagani': ['Huayra', 'Zonda', 'Utopia'],
  'Fiat': ['500', 'Panda', 'Tipo', '124 Spider', 'Punto'],

  // ── British ─────────────────────────────────────────────────────────────────
  'McLaren': [
    '720S', 'P1', 'Artura', '570S', 'Senna', 'Speedtail', 'F1', '765LT',
  ],
  'Aston Martin': [
    'DB11', 'DB12', 'Vantage', 'DBS', 'Valkyrie', 'DBX', 'DB9', 'DB5',
  ],
  'Jaguar': [
    'F-Type', 'F-Pace', 'XE', 'XF', 'I-Pace', 'E-Type', 'XJ', 'XK',
  ],
  'Land Rover': [
    'Range Rover', 'Defender', 'Discovery', 'Velar', 'Evoque', 'Sport',
  ],
  'Bentley': [
    'Continental GT', 'Flying Spur', 'Bentayga', 'Speed 8', 'Arnage',
  ],
  'Rolls-Royce': [
    'Phantom', 'Ghost', 'Cullinan', 'Wraith', 'Dawn', 'Spectre', 'Silver Shadow',
  ],
  'Lotus': [
    'Emira', 'Evija', 'Eletre', 'Elise', 'Exige', 'Esprit', 'Europa',
  ],

  // ── Japanese ────────────────────────────────────────────────────────────────
  'Toyota': [
    'Supra', 'GR86', 'Camry', 'Corolla', 'RAV4', 'Land Cruiser',
    'Highlander', 'GR Yaris', '4Runner', 'Tacoma', 'Prius',
  ],
  'Honda': [
    'Civic', 'Accord', 'CR-V', 'Type R', 'NSX', 'Fit', 'Pilot',
    'S2000', 'Integra', 'Prelude',
  ],
  'Nissan': [
    'GT-R', 'Z', '370Z', '350Z', 'Skyline', 'Patrol', 'Pathfinder',
    'Silvia', 'Maxima', 'Altima',
  ],
  'Mazda': [
    'MX-5', 'Mazda3', 'CX-5', 'CX-9', 'CX-90', 'RX-7', 'RX-8', 'CX-50',
  ],
  'Subaru': [
    'WRX', 'BRZ', 'Outback', 'Forester', 'Impreza', 'Crosstrek', 'Legacy',
  ],
  'Lexus': [
    'LC', 'LFA', 'IS', 'RC', 'RX', 'NX', 'GX', 'LX', 'ES', 'LS',
  ],
  'Acura': [
    'NSX', 'Integra', 'TLX', 'MDX', 'RDX', 'TSX',
  ],
  'Infiniti': [
    'Q50', 'Q60', 'QX80', 'QX60', 'G37', 'G35', 'FX',
  ],
  'Mitsubishi': [
    'Lancer Evolution', 'Outlander', 'Eclipse Cross', 'Pajero',
    'Eclipse', '3000GT', 'Mirage',
  ],
  'Suzuki': [
    'Jimny', 'Swift', 'Vitara', 'Hayabusa', 'Cappuccino', 'SX4',
  ],
  'Isuzu': [
    'D-Max', 'MU-X', 'Trooper', 'Rodeo',
  ],

  // ── Korean ──────────────────────────────────────────────────────────────────
  'Hyundai': [
    'Ioniq 5', 'Ioniq 6', 'Tucson', 'Santa Fe', 'Elantra N', 'Kona',
    'Palisade', 'Veloster N', 'Sonata', 'i30 N',
  ],
  'Kia': [
    'EV6', 'Stinger', 'Telluride', 'Sportage', 'K5', 'EV9',
    'Forte', 'Sorento', 'Carnival',
  ],
  'Genesis': [
    'G70', 'G80', 'G90', 'GV70', 'GV80', 'GV60', 'X',
  ],

  // ── American ────────────────────────────────────────────────────────────────
  'Ford': [
    'Mustang', 'F-150', 'Bronco', 'GT', 'Raptor', 'Explorer',
    'Maverick', 'Ranger', 'Edge', 'Expedition',
  ],
  'Chevrolet': [
    'Corvette', 'Camaro', 'Silverado', 'Tahoe', 'Suburban',
    'Blazer', 'Equinox', 'Malibu', 'Colorado',
  ],
  'Dodge': [
    'Challenger', 'Charger', 'Viper', 'Durango', 'Hornet', 'Demon',
  ],
  'Jeep': [
    'Wrangler', 'Grand Cherokee', 'Gladiator', 'Compass',
    'Cherokee', 'Renegade',
  ],
  'Tesla': [
    'Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster',
  ],
  'Cadillac': [
    'Escalade', 'CT5-V', 'Lyriq', 'CT4-V', 'Celestiq', 'XT5',
  ],
  'GMC': [
    'Sierra', 'Yukon', 'Hummer EV', 'Canyon', 'Terrain', 'Acadia',
  ],
  'Lincoln': [
    'Navigator', 'Corsair', 'Aviator', 'Nautilus',
  ],
  'RAM': [
    '1500', '2500', 'TRX', 'ProMaster',
  ],
  'Chrysler': [
    '300', 'Pacifica',
  ],
  'Rivian': ['R1T', 'R1S', 'R2'],
  'Lucid': ['Air', 'Gravity'],
  'Pontiac': ['GTO', 'Firebird', 'Trans Am'],
  'Buick': ['Enclave', 'Encore', 'Envision'],

  // ── Swedish ─────────────────────────────────────────────────────────────────
  'Volvo': [
    'XC90', 'XC60', 'S60', 'XC40', 'C40', 'V60', 'EX90', 'EX30',
  ],
  'Koenigsegg': [
    'Jesko', 'Regera', 'Gemera', 'Agera', 'CC850', 'One:1',
  ],

  // ── French ──────────────────────────────────────────────────────────────────
  'Bugatti': [
    'Chiron', 'Veyron', 'Divo', 'Centodieci', 'Bolide', 'Tourbillon',
  ],
  'Peugeot': [
    '208', '308', '508', '3008', '5008', 'e-208',
  ],
  'Renault': [
    'Megane', 'Clio', 'Austral', 'Alpine A110', 'Zoe', 'Captur',
  ],
  'Citroën': [
    'C4', 'C5 X', 'Berlingo', 'C3', 'DS',
  ],
  'Alpine': [
    'A110', 'A290', 'A310',
  ],

  // ── Other ───────────────────────────────────────────────────────────────────
  'MINI': [
    'Cooper', 'Countryman', 'Clubman', 'John Cooper Works',
  ],
}
