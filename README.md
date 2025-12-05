# Shivam Bhardwaj
### AI-Augmented Robotics & Automation Engineer
📍 **San Jose, CA** | 🚀 **Visa: H-1B (Transfer Ready)**

[![Download PDF](https://img.shields.io/badge/Download-Resume_PDF-blue?style=for-the-badge&logo=adobeacrobatreader)](Shivam_Bhardwaj_Resume.pdf)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/shivambdj)
[![Portfolio](https://img.shields.io/badge/Portfolio-shivambhardwaj.com-black?style=for-the-badge&logo=vercel)](https://shivambhardwaj.com)

---

## ⚡ About Me
I bridge the gap between **Mechanical Engineering** and **Software Automation**.
Instead of manually designing hardware or testing robots, I build **AI-augmented tools** that do it 10x faster.

* **Core Stack:** Python, Siemens NX Open, ROS/ROS2, C++.
* **Specialty:** Parametric Design Automation, Industrial IoT, and LLM-accelerated workflows.

---

## 🏆 Featured Projects

### 1. [Applied Materials] AutoCrate Automation
* **Problem:** Designing custom shipping crates for semiconductor tools took 2+ days per unit.
* **Solution:** Architected a **parametric design engine** using **Siemens NX Open** and **Python**.
* **Result:** Reduced design time to **<45 minutes (90% reduction)**. Built a full-stack GUI allowing non-engineers to generate manufacturing drawings automatically.

### 2. [Meta] Forensic Analysis Robot
* **Problem:** Supply chain security needed to detect counterfeit components in VR/AR hardware.
* **Solution:** Built a robotic workcell using a **DoBot CR5**, RF sensors, and Computer Vision.
* **Result:** Automated the anomaly detection pipeline for high-value hardware assets.

### 3. [Velodyne Lidar] Amazon Scout Sensor Fusion
* **Problem:** Amazon's delivery robot needed robust perception in unstructured environments.
* **Solution:** Designed and fabricated the sensor fusion rigs and developed **C++ PTP time-sync** scripts for LiDAR-IMU integration.

---

## 🛠️ How This Resume is Built (CI/CD)
I treat my resume as code. This repository uses **Headless Chrome** to automate the PDF generation, ensuring pixel-perfect rendering across devices.

1.  **Source:** `resume.html` (Semantic HTML5 + CSS Grid).
2.  **Build:** automated via `chromium --headless` print-to-pdf.
3.  **Deploy:** Auto-published to GitHub Pages.

```bash
# 1. Install the Rust CLI (first time only)
cargo install --path cli

# 2. Update Experience (Codex)
# Edit files in src/codex/experience/

# 3. Validation & AI Critique
resume-cli check
resume-cli critique all

# 4. Build & Generate PDF
resume-cli build
node src/scripts/generate-pdf.js
```
