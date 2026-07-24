const fs = require('fs');
let content = fs.readFileSync('src/components/LoanApplicationsControlPanel.tsx', 'utf8');
content = content.replace(/if \(activeTab !== 'all' if \(activeTab !== 'all' && app\.status !== activeTab\) return false;if \(activeTab !== 'all' && app\.status !== activeTab\) return false; appStatus !== activeTab\) return false;/g, "if (activeTab !== 'all' && appStatus !== activeTab) return false;");
fs.writeFileSync('src/components/LoanApplicationsControlPanel.tsx', content);
