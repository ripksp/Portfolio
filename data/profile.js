/**
 * SINGLE SOURCE OF TRUTH — LIVING RESUME & PORTFOLIO DATA
 * ========================================================
 * Edit this file to update the main portfolio (index.html), /resume,
 * /projects, /tools, /stellar, and the printable ATS PDF view automatically.
 */

window.PORTFOLIO_DATA = {
  meta: {
    name: "Jacob Davis",
    title: "Online Ordering Support Specialist & Systems IT Professional",
    tagline: "Full-Stack SMB Web Lifecycle, DNS/SSL Operations, Snowflake & Mode Analytics SQL, POS & API Diagnostics",
    location: "Omaha, NE",
    availability: "Remote / Hybrid",
    domain: "jacobdavis.tech",
    websiteUrl: "https://jacobdavis.tech",
    email: "jacobdavissupport@gmail.com",
    githubUrl: "https://github.com/ripksp",
    githubHandle: "github.com/ripksp",
    linkedinLabel: "linkedin.com/in/jacobdavistech",
    linkedinUrl: "https://www.linkedin.com/in/jacobdavistech",
    resumePdfPath: "/assets/Jacob_Davis_Resume.pdf",
    lastUpdated: "2026"
  },

  hero: {
    eyebrow: "JACOB DAVIS · JACOBDAVIS.TECH · JACOBDAVISSUPPORT@GMAIL.COM",
    headline: "Bridging deep technical diagnostics with human-centered support.",
    lead: "Online Ordering Support Specialist with 8+ years of experience across SaaS, POS, fintech, and broadband infrastructure. Currently at DoorDash querying Snowflake via Mode Analytics to inspect raw menu ingestion JSON payloads, coordinating with product engineering squads via Slack & Intercom, authoring Scribe SOP runbooks, and managing DNS/SSL lifecycles and white-label iOS/Android storefronts.",
    metrics: [
      {
        value: "8+ Yrs",
        label: "Systems & Technical Support",
        detail: "SaaS, POS, Fintech & DOCSIS Infrastructure"
      },
      {
        value: "DNS & SSL",
        label: "Full Web Lifecycle",
        detail: "Provisioning A, CNAME, TXT, MX & White-Label Apps"
      },
      {
        value: "SQL & JSON",
        label: "Snowflake & API Diagnostics",
        detail: "Mode Analytics, Raw Menu Payloads & Postman"
      },
      {
        value: "6 Yrs",
        label: "Do Space Tech Mentor",
        detail: "2018–2024 Community Mentor + Top CSAT / NPS"
      }
    ]
  },

  summary: {
    resumeSummary: "Online Ordering Support Specialist with 8+ years of progressive experience across SaaS, POS, fintech, and broadband infrastructure platforms. Currently at DoorDash supporting SMB restaurant partners—querying Snowflake via Mode Analytics to inspect raw menu ingestion JSON payloads and map multi-unit merchant locations, coordinating with product engineering squads via Slack and Intercom side-conversations, championing Scribe technical SOP runbooks, and managing end-to-end DNS/SSL lifecycles and white-label iOS/Android storefronts. Proven track record across Tier II POS network escalations (Toast), payment gateway API debugging (365 Retail Markets), fraud/risk triage (PayPal), and DOCSIS routing (Cox).",
    philosophyParagraphs: [
      "Helping people understand and succeed with technology has been my driving focus from day one. In an era where software powers everything from neighborhood dining to global payment networks, the human element of technical troubleshooting is more vital than ever. Growing up, I was the go-to person whenever computers, networks, or hardware broke down. Answering those questions sparked a lifelong habit: I never just want to apply a quick patch—I want to isolate the root cause and empower the user with clear, lasting answers.",
      "Over the past decade, my work has spanned the full technical support spectrum: from DOCSIS provisioning and SNR diagnostics at Cox Communications, to payment dispute and fraud/risk triage at PayPal, resolving escalated Tier II Android POS, Epson thermal printer, and VLAN/DHCP escalations at Toast, debugging payment gateway APIs via Postman and recovering kiosk OSes via remote CLI at 365 Retail Markets, to now supporting DoorDash online ordering storefronts, DNS/SSL lifecycles, and Snowflake menu ingestion diagnostics.",
      "Beyond my day job, I volunteered for 6 years (2018–2024) as a Technology Mentor at Do Space in Omaha—hosting Tech Help Tuesdays and mentoring community members of all ages through hardware diagnostics, networking, and coding fundamentals."
    ]
  },

  pillars: [
    {
      id: "pillar-dns",
      code: "01 // WEB & DNS LIFECYCLE",
      title: "Full Web, DNS & White-Label Storefronts",
      description: "Managing end-to-end domain provisioning, DNS propagation troubleshooting (A, CNAME, TXT, MX), SSL/TLS certificate lifecycles, and white-label iOS & Android online ordering storefronts.",
      tags: ["DNS (A / CNAME / TXT / MX)", "SSL/TLS Provisioning", "White-Label iOS & Android", "Storefront Lifecycle"]
    },
    {
      id: "pillar-data",
      code: "02 // SNOWFLAKE, SQL & API DIAGNOSTICS",
      title: "JSON Payload Inspection & API Debugging",
      description: "Querying Snowflake via Mode Analytics to inspect raw menu ingestion JSON payloads and map multi-unit merchant locations, paired with Postman REST API testing for payment gateway and webhook debugging.",
      tags: ["Snowflake (Mode Analytics)", "Raw Menu JSON Payloads", "Postman API", "Webhook Debugging"]
    },
    {
      id: "pillar-ai",
      code: "03 // SOPs & KNOWLEDGE CURATION",
      title: "Scribe Runbooks & AI-Enabled Support",
      description: "Championing Scribe and authoring step-by-step technical SOP runbooks for menu ingestion, payload inspection, and onboarding—paired with prompt engineering and HITL workflow curation.",
      tags: ["Scribe SOP Runbooks", "Knowledge Base Curation", "Prompt Engineering", "HITL Workflows"]
    },
    {
      id: "pillar-advocacy",
      code: "04 // ENGINEERING SQUAD COORDINATION",
      title: "Cross-Functional Escalation & Advocacy",
      description: "Coordinating directly with product engineering squads via Slack threads and Intercom side-conversations to reproduce edge cases, isolate root causes, and expedite permanent platform fixes.",
      tags: ["Slack & Intercom", "Product Eng Escalation", "Multi-Unit Mapping", "VOC / CSAT Leadership"]
    }
  ],

  caseStudies: [
    {
      id: "case-dns",
      organization: "DoorDash · Online Ordering Support",
      category: "DNS & SSL Lifecycle",
      title: "White-Label Custom Domain & App Synchronization Outage",
      problem: "Multi-unit SMB restaurant storefronts experienced SSL handshake failures and menu synchronization drops across custom web domains and white-label iOS/Android storefronts following registrar migrations.",
      diagnostics: "Audited DNS zone records (A, CNAME, TXT, MX) and CAA constraints while querying Snowflake via Mode Analytics to inspect raw menu ingestion JSON payloads and map affected multi-unit storefront locations.",
      resolution: "Resolved conflicting apex A-record and CNAME routing loops, re-triggered automated SSL/TLS validation, and authored a repeatable Scribe SOP runbook for DNS cutovers.",
      metrics: "Restored 100% HTTPS availability & real-time menu sync across web and mobile channels",
      tags: ["DNS Management", "SSL Provisioning", "Mode / Snowflake", "Scribe SOP"]
    },
    {
      id: "case-api",
      organization: "365 Retail Markets · Technical Support",
      category: "IoT / POS & API Diagnostics",
      title: "Payment Gateway Webhook Timeout on Unattended Kiosks",
      problem: "Enterprise micro-market kiosks intermittently hung on payment authorization screens during peak traffic, causing abandoned transactions and duplicate authorization holds.",
      diagnostics: "Performed remote CLI kiosk OS recovery and inspected local transaction logs, then replicated the payment gateway REST payload in Postman against staging endpoints to measure latency and JSON schema behavior.",
      resolution: "Isolated an unescaped payload field triggering gateway parsing timeouts on specific card reader firmware builds and coordinated the validation fix.",
      metrics: "Eliminated kiosk authorization hangs & prevented duplicate card holds across affected locations",
      tags: ["Postman API", "Payment Gateways", "Remote CLI Recovery", "JSON Payloads"]
    },
    {
      id: "case-network",
      organization: "Toast, Inc. · Tier II POS Engineering",
      category: "Network & Hardware Diagnostics",
      title: "Peak Dinner Hour Kitchen Printer Dropping Network Packets",
      problem: "A high-volume multi-station restaurant experienced silent ticket drops on Epson thermal kitchen printers exclusively during Friday/Saturday peak dinner hours.",
      diagnostics: "Analyzed local subnet topology, ARP tables, and DHCP lease pools across managed switches and routers. Discovered guest Wi-Fi traffic exhausting the DHCP pool and colliding with static printer IPs.",
      resolution: "Re-architected local network segmentation by isolating Android POS terminals and Epson thermal printers onto a dedicated POS VLAN with reserved DHCP scopes.",
      metrics: "Zero dropped kitchen tickets during peak service & adopted as a Tier II troubleshooting playbook",
      tags: ["Subnetting & VLAN", "DHCP Isolation", "Epson Thermal Printers", "Android POS"]
    }
  ],

  experience: [
    {
      id: "doordash",
      role: "Online Ordering Support Specialist",
      company: "DoorDash",
      location: "Remote",
      period: "Jan 2026 – Present",
      current: true,
      summary: "Supporting SMB restaurant partners across an all-in-one digital ordering suite spanning white-label storefronts, DNS/SSL lifecycles, and menu ingestion diagnostics.",
      bullets: [
        "Query Snowflake via Mode Analytics to inspect raw menu ingestion JSON payloads and map multi-unit merchant storefront locations accurately.",
        "Coordinate directly with product engineering squads via Slack threads and Intercom side-conversations to isolate bugs, verify edge cases, and expedite platform fixes.",
        "Championed Scribe and authored step-by-step technical SOP runbooks for menu workflows, payload inspection, and support onboarding.",
        "Manage end-to-end domain lifecycles (DNS provisioning: A, CNAME, TXT, MX, and SSL/TLS certificates) and troubleshoot white-label iOS and Android storefronts."
      ],
      skills: ["Snowflake (Mode Analytics)", "JSON Payloads", "DNS & SSL Lifecycle", "Slack & Intercom", "Scribe SOPs"]
    },
    {
      id: "365retail",
      role: "Technical Support Specialist",
      company: "365 Retail Markets",
      location: "Remote",
      period: "2024 – 2025",
      current: false,
      summary: "Enterprise technical support for unattended micro-market vending POS kiosks, payment gateways, and kiosk operating systems.",
      bullets: [
        "Performed Postman API payment gateway debugging to validate transaction payloads, inspect response codes, and isolate webhook timeout failures.",
        "Executed remote CLI kiosk OS recovery and hardware diagnostics across unattended POS terminals, card readers, and local network interfaces.",
        "Resolved complex enterprise escalations spanning payment processing, refund workflows, and cloud reporting discrepancies."
      ],
      skills: ["Postman API", "Payment Gateways", "Remote CLI OS Recovery", "POS Kiosks"]
    },
    {
      id: "toast",
      role: "Tier II Technical Support Engineer / POS Specialist",
      company: "Toast, Inc.",
      location: "Omaha, NE",
      period: "2021 – 2024",
      current: false,
      summary: "Three years of escalated Tier II POS support for mission-critical Android terminals, Epson thermal printers, and restaurant LAN/VLAN networks.",
      bullets: [
        "Handled escalated Tier II technical incidents for enterprise and multi-unit restaurant groups experiencing live service disruptions.",
        "Diagnosed complex networking and hardware issues across Android POS terminals, Epson thermal kitchen printers, DHCP scopes, subnetting, and VLAN segmentation.",
        "Coached frontline specialists on network isolation workflows and partnered with engineering teams on reproducible bug escalations.",
        "Awarded the peer-nominated 'Lead with Humility Toasty' Award (2022) for cross-team mentorship and calm execution during high-severity outages."
      ],
      skills: ["Tier II POS", "Android Terminals", "Epson Thermal Printers", "DHCP / Subnets / VLANs"]
    },
    {
      id: "paypal",
      role: "Customer Operations Specialist",
      company: "PayPal",
      location: "Omaha, NE",
      period: "2019 – 2021",
      current: false,
      summary: "Payment dispute resolution, fraud/risk triage, and regulatory compliance for global digital payment workflows.",
      bullets: [
        "Managed escalated payment disputes, chargeback investigations, and fraud/risk triage while maintaining strict adherence to banking and PII security standards.",
        "Earned two Spot Awards for Collaboration and Inclusion while consistently ranking among top performers in customer satisfaction KPIs."
      ],
      skills: ["Payment Disputes", "Fraud & Risk Triage", "Compliance", "Account Security"]
    },
    {
      id: "cox",
      role: "Technical Support Specialist",
      company: "Cox Communications",
      location: "Omaha, NE",
      period: "2017 – 2019",
      current: false,
      summary: "Residential and commercial broadband technical support specializing in DOCSIS provisioning, SNR diagnostics, and gateway routing.",
      bullets: [
        "Executed DOCSIS modem provisioning, signal-to-noise ratio (SNR) diagnostics, and residential/commercial gateway routing troubleshooting.",
        "Identified regional node degradation patterns and supported frontline teammates on internal network diagnostic utilities."
      ],
      skills: ["DOCSIS Provisioning", "SNR Diagnostics", "Gateway Routing", "TCP/IP"]
    }
  ],

  skillsCategories: [
    {
      category: "Data, APIs & Menu Ingestion",
      code: "stack.data_apis",
      items: [
        "Snowflake (Mode Analytics SQL)",
        "Raw Menu JSON Payload Inspection",
        "Postman REST API Debugging",
        "Webhook Schema Validation",
        "Multi-Unit Merchant Mapping",
        "Python & HTML/CSS"
      ]
    },
    {
      category: "Web, DNS & Storefront Ops",
      code: "stack.web_dns",
      items: [
        "DNS Provisioning (A, CNAME, TXT, MX)",
        "SSL/TLS Certificate Lifecycles",
        "White-Label iOS & Android Storefronts",
        "Bluehost / cPanel & GitHub",
        "Scribe Technical SOP Runbooks",
        "Knowledge Base Curation"
      ]
    },
    {
      category: "Networks, POS & Hardware",
      code: "stack.network_pos",
      items: [
        "TCP/IP, DHCP, Subnets & VLANs",
        "DOCSIS Provisioning & SNR Diagnostics",
        "Android POS Terminals & Kiosks",
        "Epson Thermal Kitchen Printers",
        "Remote CLI OS Recovery",
        "EMV Card Readers & Gateways"
      ]
    },
    {
      category: "Collaboration, ITSM & AI",
      code: "stack.collab_ai",
      items: [
        "Slack & Intercom Side-Conversations",
        "Product Engineering Squad Escalations",
        "Salesforce & Zendesk",
        "Prompt Engineering & HITL Workflows",
        "Windows, macOS, Android, iOS & Linux",
        "Risk / Fraud Triage & Disputes"
      ]
    }
  ],

  recognitionAndCommunity: [
    {
      type: "Community Leadership",
      title: "Do Space Volunteer Technology Mentor",
      org: "Do Space · Omaha, NE",
      period: "2018 – 2024 (6 Years)",
      description: "Volunteered for six years hosting Tech Help Tuesdays—mentoring Omaha citizens of all skill levels on hardware diagnostics, networking, software troubleshooting, and coding basics."
    },
    {
      type: "KPI Track Record",
      title: "Top Performer in Customer Satisfaction KPIs (VOC, NPS & CSAT)",
      org: "Career-Wide Distinction",
      period: "2017 – Present",
      description: "Consistently ranked among top performers in Voice of the Customer (VOC), Net Promoter Score (NPS), and CSAT across support organizations."
    },
    {
      type: "Peer Recognition Award",
      title: "\"Lead with Humility Toasty\" Award",
      org: "Toast, Inc.",
      period: "2022",
      description: "Peer-nominated recognition honoring Tier II mentorship, collaborative escalation ownership, and calm execution during high-volume restaurant outages."
    },
    {
      type: "Corporate Recognition (2x)",
      title: "Spot Awards for Collaboration & Inclusion",
      org: "PayPal",
      period: "2019 & 2020",
      description: "Awarded twice for cross-team knowledge sharing, teammate coaching, and elevating dispute and fraud triage accuracy."
    }
  ],

  education: [
    {
      institution: "University of Nebraska at Omaha & Metropolitan Community College",
      location: "Omaha, NE",
      credential: "Information Technology & Cybersecurity Coursework",
      detail: "Systems, Networking & Security Foundations"
    }
  ],

  projects: [
    {
      id: "orderflow",
      name: "OrderFlow Hub",
      category: "Full Storefront & POS Lifecycle",
      badge: "Toast / DoorDash Bridge",
      status: "Production Reference Architecture",
      challengeTitle: "Lost Orders & POS Rail Desynchronization",
      challenge: "During peak restaurant dinner rushes, local Wi-Fi fluctuations frequently cause dropped network packets between storefront cloud ordering and local kitchen receipt printers—leading to lost orders and uncoordinated modifier trees.",
      solutionTitle: "Idempotent Queueing & ESC/POS Ticket Pipeline",
      solution: "Implements a local client queue with exponential backoff retry, unique idempotency hashes, dynamic tax calculation, and direct ESC/POS thermal command translation formatted for Epson TM-T88VI and Star Micronics hardware.",
      highlights: [
        "Zero lost orders during network drops via offline storage & retry.",
        "Real-time 4-step state machine (Received → POS → Prep → Fulfilled).",
        "Automated allergen highlighting on thermal tickets."
      ],
      stack: ["JavaScript ES6", "ESC/POS Thermal Protocol", "REST Webhooks", "Idempotency Keys", "Epson TM-T88VI"]
    },
    {
      id: "omniorder",
      name: "OmniOrder Aggregator",
      category: "Ingestion & Kitchen Normalizer",
      badge: "12ms Ingestion Latency",
      status: "Architecture Specification",
      challengeTitle: "Commercial Kitchen \"Tablet Hell\"",
      challenge: "Restaurants often operate 4 to 6 separate third-party delivery tablets, each sending distinct asynchronous JSON schemas with proprietary modifier arrays—forcing staff to manually sync 86'd out-of-stock items across every tablet.",
      solutionTitle: "Canonical Schema Normalizer & Unified KDS",
      solution: "Authenticates inbound webhooks with cryptographic HMAC SHA-256 signatures, transforms disparate payloads into a standardized Canonical KDS v1 Schema in under 14ms, and broadcasts 86'd inventory updates across all connected APIs.",
      highlights: [
        "Single consolidated KDS screen replacing 5+ separate physical tablets.",
        "Bidirectional 86'd stock broadcast with 18ms propagation time.",
        "HMAC authentication blocking forged webhook payloads."
      ],
      stack: ["Node.js / FastAPI", "HMAC SHA-256", "JSON Schema Mapping", "WebSockets / KDS", "Inventory Sync"]
    },
    {
      id: "brandsync",
      name: "BrandSync Engine",
      category: "DNS & White-Label Hosting",
      badge: "Automated DNS & TLS 1.3",
      status: "Live Interactive Sandbox",
      challengeTitle: "Manual Merchant Domain Friction & Renewal Breaks",
      challenge: "Onboarding a custom domain for a restaurant storefront often triggers registrar errors—misspelled CNAME targets, conflicting apex A-records, or failed SSL handshakes that delay launch by 3 to 5 business days.",
      solutionTitle: "Zero-Touch CNAME Validation & Automated ACME SSL",
      solution: "Automates authoritative DNS propagation checks, validates CNAME/A-record routing before cutover, and provisions automated ACME TLS/SSL certificates with zero manual intervention.",
      highlights: [
        "Instant DNS & SSL pre-flight verification before merchant cutover.",
        "Interactive white-label storefront theming & embed code generation.",
        "Eliminates expired certificate browser warnings."
      ],
      stack: ["Authoritative DNS", "ACME / TLS 1.3", "White-Label Storefronts", "HTML / CSS / JS"]
    }
  ],

  stellar: {
    name: "Stellar Industries",
    subtitle: "Mobile Aerospace Tycoon & Systems Simulation",
    version: "Build v1.0.6",
    requirements: "Android 7.0+ (API 24+)",
    size: "8.3 MB",
    apkPath: "/stellar/StellarIndustries.apk",
    description: "Stellar Industries is a native Android aerospace simulation and tycoon game that blends industrial manufacturing, resource logistics, and space exploration into a single cohesive experience. Step into the role of an aerospace founder—managing shop-floor tooling, precision fabrication, orbital launch operations, and deep-space missions.",
    features: [
      {
        title: "Precision Manufacturing",
        detail: "Fabricate aerospace-grade hardware, upgrade production machinery, and fulfill high-value commercial contracts."
      },
      {
        title: "Fleet & Modular Staging",
        detail: "Configure modular rocket stages (tri-core chassis, strap-on boosters, vacuum engines, and crew capsules) and station persistent orbital assets."
      },
      {
        title: "Exploration & Research",
        detail: "Establish orbital research stations, deploy planetary surface outposts, and advance next-generation propulsion science."
      }
    ],
    stack: ["Kotlin 1.9", "Jetpack Compose", "Room SQLite", "Kotlinx.Serialization", "Compose Canvas 2D", "Offline Progression"]
  }
};
