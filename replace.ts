import fs from 'fs';
const files = [
  'src/components/SecurityAlerts.tsx',
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/primary-/g, 'red-');
    fs.writeFileSync(f, content);
  }
});

