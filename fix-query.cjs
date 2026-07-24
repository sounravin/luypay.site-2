const fs = require('fs');
let content = fs.readFileSync('src/components/LoanApplicationsControlPanel.tsx', 'utf8');
content = content.replace(/const q = query\([\s\S]*?where\('lenderId', 'in', \[currentUser, currentUser\.toUpperCase\(\), currentUser\.charAt\(0\)\.toUpperCase\(\) \+ currentUser\.slice\(1\)\]\)\n    \);/g, "const q = collection(db, 'loan_applications');");
fs.writeFileSync('src/components/LoanApplicationsControlPanel.tsx', content);
