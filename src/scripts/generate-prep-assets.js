const fs = require('fs');
const path = require('path');

// Generator for interview-prep markdown assets.
// It creates per-technology files under assets/interview_prep/<domain>/...
// without overwriting any files that already exist.

const ROOT = path.join(__dirname, '..', '..');
const OUTPUT_ROOT = path.join(ROOT, 'assets', 'interview_prep');

/**
 * Domain directories (relative to OUTPUT_ROOT).
 */
const DOMAINS = {
  ROBOTICS_AI: 'robotics-ai',
  HARDWARE_CAD: 'hardware-cad',
  EMBEDDED_EE: 'embedded-ee',
  SOFTWARE_DEVOPS: 'software-devops',
  STANDARDS_SAFETY: 'standards-safety',
  TOOLING_OPS: 'tooling-ops',
  MATH_CONTROLS: 'math-controls'
};

/**
 * Canonical list of technologies and where they live.
 *
 * id: stable identifier and base of filename where needed
 * displayName: rendered title inside the markdown file
 * domain: one of DOMAINS[...]
 * filename: explicit filename (kebab-case, .md)
 */
const TECHS = [
  // Robotics & AI
  { id: 'ros', displayName: 'ROS', domain: DOMAINS.ROBOTICS_AI, filename: 'ros.md' },
  { id: 'ros2', displayName: 'ROS 2', domain: DOMAINS.ROBOTICS_AI, filename: 'ros2.md' },
  { id: 'ros2-nav2', displayName: 'ROS 2 Navigation (Nav2)', domain: DOMAINS.ROBOTICS_AI, filename: 'ros2-nav2.md' },
  { id: 'moveit', displayName: 'MoveIt', domain: DOMAINS.ROBOTICS_AI, filename: 'moveit.md' },
  { id: 'slam-gmapping', displayName: 'SLAM (GMapping)', domain: DOMAINS.ROBOTICS_AI, filename: 'slam-gmapping.md' },
  { id: 'slam-cartographer', displayName: 'SLAM (Cartographer)', domain: DOMAINS.ROBOTICS_AI, filename: 'slam-cartographer.md' },
  { id: 'opencv', displayName: 'Computer Vision (OpenCV)', domain: DOMAINS.ROBOTICS_AI, filename: 'computer-vision-opencv.md' },
  { id: 'yolo', displayName: 'Object Detection (YOLO)', domain: DOMAINS.ROBOTICS_AI, filename: 'object-detection-yolo.md' },
  { id: 'sensor-fusion-kalman', displayName: 'Sensor Fusion & Kalman Filters', domain: DOMAINS.ROBOTICS_AI, filename: 'sensor-fusion-kalman-filters.md' },
  { id: 'llm-agents-langchain', displayName: 'LLM Agents (LangChain)', domain: DOMAINS.ROBOTICS_AI, filename: 'llm-agents-langchain.md' },
  { id: 'lidar-systems', displayName: 'Lidar Systems (Velodyne, etc.)', domain: DOMAINS.ROBOTICS_AI, filename: 'lidar-systems.md' },
  { id: 'vslam', displayName: 'Visual SLAM (VSLAM)', domain: DOMAINS.ROBOTICS_AI, filename: 'vslam.md' },
  { id: 'graph-based-slam', displayName: 'Graph-based SLAM', domain: DOMAINS.MATH_CONTROLS, filename: 'graph-based-slam.md' },

  // Hardware & CAD
  { id: 'siemens-nx', displayName: 'Siemens NX', domain: DOMAINS.HARDWARE_CAD, filename: 'siemens-nx.md' },
  { id: 'siemens-nx-open-api', displayName: 'Siemens NX Open API', domain: DOMAINS.HARDWARE_CAD, filename: 'siemens-nx-open-api.md' },
  { id: 'siemens-nx-expressions', displayName: 'Siemens NX Expressions', domain: DOMAINS.HARDWARE_CAD, filename: 'siemens-nx-expressions.md' },
  { id: 'solidworks', displayName: 'SolidWorks', domain: DOMAINS.HARDWARE_CAD, filename: 'solidworks.md' },
  { id: 'rhino3d', displayName: 'Rhino 3D', domain: DOMAINS.HARDWARE_CAD, filename: 'rhino3d.md' },
  { id: 'gdt-asme-y14-5', displayName: 'GD&T (ASME Y14.5)', domain: DOMAINS.HARDWARE_CAD, filename: 'gdt-asme-y14-5.md' },
  { id: 'dfma', displayName: 'DFMA', domain: DOMAINS.HARDWARE_CAD, filename: 'dfma.md' },
  { id: 'model-based-definition-mbd', displayName: 'Model-Based Definition (MBD)', domain: DOMAINS.HARDWARE_CAD, filename: 'model-based-definition-mbd.md' },
  { id: 'rapid-prototyping', displayName: 'Rapid Prototyping', domain: DOMAINS.HARDWARE_CAD, filename: 'rapid-prototyping.md' },
  { id: '3d-printing', displayName: '3D Printing', domain: DOMAINS.HARDWARE_CAD, filename: '3d-printing.md' },

  // Embedded & EE
  { id: 'embedded-c', displayName: 'Embedded C', domain: DOMAINS.EMBEDDED_EE, filename: 'embedded-c.md' },
  { id: 'rust-embedded-hal', displayName: 'Rust (embedded-hal)', domain: DOMAINS.EMBEDDED_EE, filename: 'rust-embedded-hal.md' },
  { id: 'stm32', displayName: 'STM32 Microcontrollers', domain: DOMAINS.EMBEDDED_EE, filename: 'stm32.md' },
  { id: 'esp32', displayName: 'ESP32 Microcontrollers', domain: DOMAINS.EMBEDDED_EE, filename: 'esp32.md' },
  { id: 'ambiq', displayName: 'Ambiq MCUs', domain: DOMAINS.EMBEDDED_EE, filename: 'ambiq-mcu.md' },
  { id: 'motor-control', displayName: 'Motor Control (BLDC / Servo / Stepper)', domain: DOMAINS.EMBEDDED_EE, filename: 'motor-control-bldc-servo-stepper.md' },
  { id: 'control-theory-pid', displayName: 'Control Theory (PID & Feedforward)', domain: DOMAINS.MATH_CONTROLS, filename: 'control-theory-pid-feedforward.md' },
  { id: 'rtos', displayName: 'RTOS for Embedded Systems', domain: DOMAINS.EMBEDDED_EE, filename: 'rtos-basics.md' },
  { id: 'bootloaders-ota', displayName: 'Bootloaders & OTA Updates', domain: DOMAINS.EMBEDDED_EE, filename: 'bootloaders-and-ota.md' },
  { id: 'ethercat', displayName: 'EtherCAT', domain: DOMAINS.EMBEDDED_EE, filename: 'ethercat.md' },
  { id: 'modbus', displayName: 'Modbus', domain: DOMAINS.EMBEDDED_EE, filename: 'modbus.md' },
  { id: 'can-bus', displayName: 'CAN Bus', domain: DOMAINS.EMBEDDED_EE, filename: 'can-bus.md' },
  { id: 'uart', displayName: 'UART', domain: DOMAINS.EMBEDDED_EE, filename: 'uart.md' },
  { id: 'spi', displayName: 'SPI', domain: DOMAINS.EMBEDDED_EE, filename: 'spi.md' },
  { id: 'i2c', displayName: 'I2C', domain: DOMAINS.EMBEDDED_EE, filename: 'i2c.md' },
  { id: 'pcb-design-altium', displayName: 'PCB Design (Altium)', domain: DOMAINS.EMBEDDED_EE, filename: 'pcb-design-altium.md' },
  { id: 'pcb-design-kicad', displayName: 'PCB Design (KiCad)', domain: DOMAINS.EMBEDDED_EE, filename: 'pcb-design-kicad.md' },
  { id: 'plc-beckhoff-twincat', displayName: 'PLC (Beckhoff TwinCAT)', domain: DOMAINS.EMBEDDED_EE, filename: 'plc-beckhoff-twincat.md' },

  // Software & DevOps
  { id: 'cpp', displayName: 'C++ (14/17)', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'cpp-14-17.md' },
  { id: 'python-asyncio', displayName: 'Python (AsyncIO)', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'python-asyncio.md' },
  { id: 'rust-tokio', displayName: 'Rust (Tokio)', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'rust-tokio.md' },
  { id: 'rust-axum', displayName: 'Rust (Axum)', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'rust-axum.md' },
  { id: 'rust-actix-web', displayName: 'Rust (Actix Web)', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'rust-actix-web.md' },
  { id: 'docker', displayName: 'Docker', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'docker.md' },
  { id: 'kubernetes', displayName: 'Kubernetes', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'kubernetes.md' },
  { id: 'github-actions', displayName: 'CI/CD (GitHub Actions)', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'github-actions.md' },
  { id: 'linux-bash', displayName: 'Linux & Bash', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'linux-bash.md' },
  { id: 'aws-iot-core', displayName: 'AWS IoT Core', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'aws-iot-core.md' },
  { id: 'react', displayName: 'React', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'react.md' },
  { id: 'nextjs', displayName: 'Next.js', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'nextjs.md' },
  { id: 'http-rest-apis', displayName: 'HTTP & REST APIs', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'http-rest-apis.md' },
  { id: 'grpc', displayName: 'gRPC', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'grpc.md' },
  { id: 'websockets', displayName: 'WebSockets', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'websockets.md' },
  { id: 'postgresql', displayName: 'PostgreSQL', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'postgresql.md' },
  { id: 'sqlite', displayName: 'SQLite', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'sqlite.md' },
  { id: 'redis', displayName: 'Redis', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'redis.md' },
  { id: 'ansible', displayName: 'Ansible', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'ansible.md' },
  { id: 'observability', displayName: 'Observability (Metrics, Logs, Traces)', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'observability.md' },
  { id: 'prometheus', displayName: 'Prometheus', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'prometheus.md' },
  { id: 'grafana', displayName: 'Grafana', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'grafana.md' },
  { id: 'opentelemetry', displayName: 'OpenTelemetry', domain: DOMAINS.SOFTWARE_DEVOPS, filename: 'opentelemetry.md' },

  // Standards & Safety
  { id: 'iso-10218', displayName: 'ISO 10218 (Industrial Robots Safety)', domain: DOMAINS.STANDARDS_SAFETY, filename: 'iso-10218.md' },
  { id: 'iso-13849', displayName: 'ISO 13849 (Safety of Machinery)', domain: DOMAINS.STANDARDS_SAFETY, filename: 'iso-13849.md' },
  { id: 'iec-62304', displayName: 'IEC 62304 (Medical Device Software)', domain: DOMAINS.STANDARDS_SAFETY, filename: 'iec-62304.md' },
  { id: 'functional-safety', displayName: 'Functional Safety Fundamentals', domain: DOMAINS.STANDARDS_SAFETY, filename: 'functional-safety-intro.md' },
  { id: 'dfmea-hara-fta', displayName: 'DFMEA, HARA & FTA', domain: DOMAINS.STANDARDS_SAFETY, filename: 'dfmea-hara-fta.md' },

  // Tooling & Ops
  { id: 'git', displayName: 'Git & GitHub Workflows', domain: DOMAINS.TOOLING_OPS, filename: 'git-github-workflows.md' },
  { id: 'hil-testing', displayName: 'Hardware-in-the-Loop (HIL) Testing', domain: DOMAINS.TOOLING_OPS, filename: 'hil-testing.md' },
  { id: 'lab-debugging', displayName: 'Lab Debugging (Scopes, Logic Analyzers, JTAG)', domain: DOMAINS.TOOLING_OPS, filename: 'lab-debugging-tools.md' },

  // Math & Controls
  { id: 'kalman-filters', displayName: 'Kalman Filters (EKF / UKF)', domain: DOMAINS.MATH_CONTROLS, filename: 'kalman-filters-ekf-ukf.md' },
  { id: 'optimization-g2o-ceres', displayName: 'Optimization Libraries (g2o, Ceres)', domain: DOMAINS.MATH_CONTROLS, filename: 'optimization-libraries-g2o-ceres.md' }
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function generateContent(tech) {
  return [
    `# ${tech.displayName}`,
    '',
    '## 1. One line summary',
    '- What it is and where it fits in the stack.',
    '',
    '## 2. Mental model',
    '- Intuition, key components, and how they interact.',
    '- Typical data or control flow.',
    '',
    '## 3. Core primitives and APIs',
    '- Must-know commands, functions, or configuration concepts.',
    '- Canonical example snippet or configuration.',
    '',
    '## 4. System design and tradeoffs',
    '- When to use this technology and when not to.',
    '- Performance, latency, safety, or scalability considerations.',
    '',
    '## 5. Common interview questions',
    '- Conceptual or system-design questions.',
    '- Whiteboard or coding prompts.',
    '- Debugging or scenario-based questions.',
    '',
    '## 6. Failure modes and debugging checklist',
    '- Typical failure signatures.',
    '- Stepwise debugging process.',
    '- Metrics, logs, or signals to inspect.',
    '',
    '## 7. By heart items',
    '- Definitions, formulas, and rules of thumb to memorize.',
    '- Command or API shapes to remember.',
    '',
    '## 8. Related topics',
    '- Link to closely related technologies in this prep set.',
    ''
  ].join('\n');
}

function main() {
  ensureDir(OUTPUT_ROOT);
  let created = 0;
  let skipped = 0;

  TECHS.forEach((tech) => {
    const domainDir = path.join(OUTPUT_ROOT, tech.domain);
    ensureDir(domainDir);

    const filePath = path.join(domainDir, tech.filename);
    if (fs.existsSync(filePath)) {
      skipped += 1;
      return;
    }

    const content = generateContent(tech);
    fs.writeFileSync(filePath, content, 'utf8');
    created += 1;
    console.log(`Created prep file: ${path.relative(ROOT, filePath)}`);
  });

  console.log('');
  console.log(`Interview-prep generation complete. Created=${created}, skipped(existing)=${skipped}.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  DOMAINS,
  TECHS,
  generateContent
};