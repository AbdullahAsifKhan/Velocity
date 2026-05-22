import fs from 'fs';
import https from 'https';

if (!fs.existsSync('public/logos-tmp')) {
  fs.mkdirSync('public/logos-tmp', { recursive: true });
}

const brands = ['Volvo', 'Cadillac', 'Acura', 'Polestar', 'Suzuki', 'Aston Martin', 'Mitsubishi', 'BYD', 'Ferrari', 'Chrysler', 'Isuzu', 'GMC', 'Maybach', 'Lincoln', 'Honda', 'Daewoo', 'Chevrolet', 'Shelby', 'Saturn', 'Porsche', 'Alfa Romeo', 'Rolls-Royce', 'Jaguar', 'Mini', 'Kia', 'Lotus', 'Pagani', 'Bugatti', 'Mercedes-Benz', 'Lamborghini', 'Oldsmobile', 'Fiat', 'Land Rover', 'Buick', 'Nissan', 'Genesis', 'Saab', 'Hyundai', 'Subaru', 'Mazda', 'BMW', 'Volkswagen', 'Mercury', 'Hummer', 'Toyota'];

const normalizeForLogo = (b: string) => {
  let slug = b.toLowerCase().replace(/ /g, '-').replace(/benz/g, 'benz').replace(/rolls-royce/g, 'rolls-royce').replace(/alfa romeo/g, 'alfa-romeo').replace(/aston martin/g, 'aston-martin').replace(/land rover/g, 'land-rover');
  if (slug === 'shelby') return 'saleen';
  return slug;
};

const LOCAL_OVERRIDES = ['hummer', 'jaguar', 'maybach', 'saturn'];

brands.forEach(b => {
  const slug = normalizeForLogo(b);
  if (LOCAL_OVERRIDES.includes(slug)) return;
  const url = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/${slug}.png`;
  https.get(url, (res) => {
    if (res.statusCode === 200) {
      const file = fs.createWriteStream(`public/logos-tmp/${slug}.png`);
      res.pipe(file);
    } else {
      console.log('Failed for', slug, res.statusCode);
    }
  }).on('error', (e) => console.log('Error for', slug, e.message));
});
