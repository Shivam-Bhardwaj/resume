---
id: ari
title: Robotics Software Engineer
company: ARI
location: Austin, TX
dates: Jan 2020 – Dec 2020
subtitle: "Surgical Robotics & Compliance"
---

## Experience Details
- **Surgical Registration Algorithm:** Developed a **C++** registration algorithm using **VTK** and **PCL**, processing **10,000+ points** to compute the transformation matrix between a patient's femur and a surgical drill. Implemented **Iterative Closest Point (ICP)** to align **OptiTrack** motion capture data with MRI-based 3D point clouds.
- **High-Performance Metrics:** Achieved **0.1mm translation** and **0.3° rotation accuracy** with a registration time of **300ms** (data collection: 20s), directly enabling precise robotic milling of the femur head.
- **Robot Control System:** Engineered the control logic for a **6-DOF Kuka Robot** using **Beckhoff PLC**, orchestrating **100%** of the surgical workflow from registration to execution with **1ms** cycle times.
- **FDA Compliance:** Performed system-level risk analysis and contributed to design validation documentation for **FDA 510(k)** submission, ensuring **100%** safety-critical software compliance under **IEC 62304** standards.
- **Data Pipeline Architecture:** Implemented **DDS** middleware and **Protobuf** serialization to process and feed real-time sensor data into the **Computer Vision (CV)** pipeline with **<5ms latency**, ensuring seamless integration between subsystems.
- **Industry Impact:** Pioneered **"Active Milling"** (autonomous cutting), moving beyond standard "jig-holding" robotics. This key innovation drove **Zimmer Biomet’s acquisition of Monogram** in late 2025 to challenge industry leaders.

## Raw Input
I worked on the core surgical navigation system for Monogram (formerly ARI) with Kamran Shamaei (CTO). My primary responsibility was writing the registration algorithm in C++. The system took input from an OptiTrack wand (collecting points on the bone) and a 3D reconstructed model of the femur head from an MRI (provided as a PCL). I used the VTK library to handle the data and implemented the ICP (Iterative Closest Point) algorithm to find the transformation matrix between the bone and a stationary drill. We achieved impressive metrics: 0.1mm translational accuracy and 0.3-degree rotational accuracy. The process was fast, with data collection taking 20 seconds and registration completing in just 300ms. I also architected the data pipeline using DDS and Protobuf, converting sensor data to feed into the CV algorithms. After registration, I was responsible for controlling the Kuka robot using PLC logic on a Beckhoff PLC to manage the system's operation. **Impact:** We pioneered CV and active robotic surgery ("Active Milling"), moving beyond the "Holding the Jig" approach (like ROSA). This technology was the key driver for Zimmer Biomet's acquisition of Monogram in late 2025, signaling a major shift in the industry to directly challenge Stryker.

## AI Critique
**Role Alignment & Impact:**
- **hard-Real-Time Performance:** The metrics (**300ms latency**, **0.1mm accuracy**) demonstrate the ability to deliver high-performance code in safety-critical environments.
- **Complex Tech Stack:** Combining **C++**, **VTK**, **PCL**, and **Beckhoff PLC** shows a rare mix of high-level algorithmic software and low-level industrial control.
- **Verification Oriented:** The link between the algorithm's precision and the **FDA 510(k)** requirements highlights the practical application of the engineering work.
- **Cross-Disciplinary:** Bridging the gap between Medical Imaging (MRI/PCL) and Industrial Robotics (Kuka/PLC) is a high-value skill set.
- **Industry Shaping:** This work on "Active Milling" directly challenged the industry standard ("Holding the Jig") and paved the way for **Zimmer Biomet’s acquisition of Monogram in late 2025**, marking a pivotal shift in surgical robotics.

**Improvements:**
- **Specific Standards:** Mentioning specific medical device standards (e.g., IEC 62304) if applicable would add more weight to the compliance section.


