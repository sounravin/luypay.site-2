const fs = require('fs');
let content = fs.readFileSync('src/components/LoanApplicationsControlPanel.tsx', 'utf8');
content = content.replace(/list\.sort\(\(a, b\) => new Date\(b\.createdAt\)\.getTime\(\) - new Date\(a\.createdAt\)\.getTime\(\)\);/g, "list.sort((a, b) => (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0));");
fs.writeFileSync('src/components/LoanApplicationsControlPanel.tsx', content);
