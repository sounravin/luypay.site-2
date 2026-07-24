#!/bin/bash
sed -i '/-e .dark/d' src/index.css
sed -i '/color-scheme: dark;/d' src/index.css
sed -i '/\.dark {/d' src/index.css
sed -i '/^}$/d' src/index.css
printf ".dark {\n  color-scheme: dark;\n}\n" >> src/index.css
