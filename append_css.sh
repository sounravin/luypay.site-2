#!/bin/bash
cat << 'CSS' >> src/index.css

/* ==========================================
   Traditional Khmer Night Theme Backgrounds
   ========================================== */

/* Base body background for Angkor theme */
.dark.theme-angkor {
  background: radial-gradient(circle at 50% 20%, #0c1836 0%, #050a16 100%);
  color: #f8fafc;
}

/* Watermark pattern covering the entire app background for a premium feel - scoped only to Angkor */
.dark.theme-angkor::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M24 0 L48 24 L24 48 L0 24 Z M24 8 L40 24 L24 40 L8 24 Z M24 16 L32 24 L24 32 L16 24 Z' fill='%23dfb035' fill-opacity='1'/%3E%3C/svg%3E");
  background-size: 32px 32px;
  z-index: 1;
}

/* Traditional Header Banner in Dark Mode - scoped only to Angkor */
.dark.theme-angkor #global-marquee-banner {
  background: linear-gradient(to right, #b37e1b, #dfb035, #b37e1b) !important;
  color: #050a16 !important;
  border-bottom: 2px solid #fff2a3 !important;
  font-weight: 800 !important;
}

/* Dynamic glow effect */
.dark-glow-amber {
  box-shadow: 0 0 15px 1px rgba(223, 176, 53, 0.25);
}
CSS
