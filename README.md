# Shivam Bhardwaj - Resume

This repository contains the source code and generated PDF for my resume.

## 📄 Download Resume
[**Download Latest PDF**](resume.pdf)

## 🛠️ How to Edit
The resume is built using HTML & CSS for pixel-perfect control over layout and typography.

1.  **Edit Content**: Open `resume.html` in any text editor.
2.  **Preview**: Open `resume.html` in a web browser (Chrome/Chromium recommended).
3.  **Generate PDF**:
    Run the following command to generate a print-ready PDF:
    ```bash
    chromium --headless --disable-gpu --print-to-pdf=resume.pdf resume.html
    ```

## 🎨 Design Notes
-   **Font**: Inter (Google Fonts)
-   **Layout**: Single-page, letter size (8.5" x 11")
-   **Styles**: Custom CSS with print optimizations (`@page { margin: 0 }`)
