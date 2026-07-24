const fs = require('fs');
const content = fs.readFileSync('src/components/LoanApplicationsControlPanel.tsx', 'utf8');
const fixedContent = content.replace(/setLoading\(false\);\n    }, \(error\) => {\n      console\.error\("Firestore Error in LoanApplicationsControlPanel:", error\);\n      setLoading\(false\);\n    }, \(error\) => {\n      console\.warn\("Unable to subscribe to loan applications:", error\.message \|\| error\);\n      setLoading\(false\);\n    }, \(error\) => {\n      console\.error\("Firestore Error in LoanApplicationsControlPanel:", error\);\n      setLoading\(false\);\n    }\);/g, 'setLoading(false);\n    });');
fs.writeFileSync('src/components/LoanApplicationsControlPanel.tsx', fixedContent);
