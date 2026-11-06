/**
 * SINGLE SOURCE OF TRUTH — LIVING RESUME & PORTFOLIO DATA
 * ========================================================
 * Edit this file to update both the interactive portfolio website (index.html)
 * and the built-in Living Resume / printable ATS PDF view automatically.
 */

window.PORTFOLIO_DATA = {
  meta: {
    name: "Jacob Davis",
    title: "Technical Support Specialist & Systems IT Professional",
    tagline: "Full-Stack SMB Web Lifecycle, DNS/SSL Operations, POS & API Diagnostics, and AI-Enabled Support Workflows",
    location: "Omaha, NE",
    availability: "Flexible availability · Remote & On-Site",
    domain: "jacobdavis.tech",
    websiteUrl: "https://jacobdavis.tech",
    email: "jacobdavissupport@gmail.com",
    phone: "(402) 637-9234",
    githubUrl: "https://github.com/ripksp",
    githubHandle: "github.com/ripksp",
    linkedinLabel: "LinkedIn · Jacob Davis",
    linkedinUrl: "https://www.linkedin.com/search/results/all/?keywords=Jacob%20Davis%20Omaha%20DoorDash%20Toast",
    resumePdfPath: "assets/Jacob_Davis_Resume.pdf",
    lastUpdated: "2026"
  },

  hero: {
    eyebrow: "JACOB DAVIS · OMAHA, NE · SYSTEMS & TECHNICAL SUPPORT",
    headline: "Bridging deep technical diagnostics with human-centered support.",
    lead: "Technical Support Specialist with 8+ years of experience across SaaS, POS, fintech, and broadband infrastructure. Currently at DoorDash managing end-to-end white-label AI websites, DNS & SSL lifecycles, branded mobile apps, and SQL operational analytics for hundreds of SMB storefronts.",
    metrics: [
      {
        value: "8+ Yrs",
        label: "Systems & Technical Support",
        detail: "SaaS, POS, Fintech & Telecom Infrastructure"
      },
      {
        value: "DNS & SSL",
        label: "Full Web Lifecycle",
        detail: "Provisioning A, CNAME, TXT, MX & White-Label Apps"
      },
      {
        value: "SQL & API",
        label: "Data-Driven Diagnostics",
        detail: "Mode Analytics SQL, Postman & Webhook Debugging"
      },
      {
        value: "Top KPI",
        label: "CSAT · NPS · VOC Leader",
        detail: "Award-winning customer advocacy + 5+ yrs mentoring"
      }
    ]
  },

  summary: {
    resumeSummary: "Technical Support Specialist with 8+ years of experience across SaaS, POS, fintech, and network infrastructure platforms. Currently at DoorDash supporting SMB restaurant clients with a full-stack online ordering solution—spanning custom white-label AI websites, branded iOS/Android mobile apps, end-to-end DNS/SSL lifecycle management, menu operations, and Mode Analytics SQL reporting. Repeatedly recognized as a top performer in VOC, NPS, and CSAT across every role held, with a proven track record of translating frontline client friction into permanent engineering fixes and clear SOP documentation.",
    philosophyParagraphs: [
      "Helping people understand and succeed with technology has been my driving focus from day one. In an era where software powers everything from neighborhood dining to global payment networks, the human element of technical troubleshooting is more vital than ever. Growing up, I was the go-to person whenever computers, networks, or hardware broke down. Answering those questions sparked a lifelong habit: I never just want to apply a quick patch—I want to isolate the root cause and empower the user with clear, lasting answers.",
      "Over the past decade, my work has spanned the full technical support spectrum: from scaling residential high-speed data infrastructure in the field with Cox and Bear Communications, to safeguarding financial workflows at PayPal, resolving mission-critical Android POS and kitchen network escalations as a Tier 2 specialist at Toast, debugging unattended micro-market vending kiosks via Postman APIs at 365 Retail Markets, to now managing white-label AI websites, DNS lifecycles, and mobile apps at DoorDash.",
      "Beyond my day job, I have dedicated over 5 years to community volunteering at Do Space in Omaha—hosting Tech Help Tuesdays and mentoring citizens of all ages through hardware repairs, network setups, and software fundamentals."
    ]
  },

  pillars: [
    {
      id: "pillar-dns",
      code: "01 // WEB & DNS LIFECYCLE",
      title: "Full Web, DNS & White-Label AI Storefronts",
      description: "Managing end-to-end domain provisioning, DNS propagation troubleshooting (A, CNAME, TXT, MX), SSL certificate lifecycle, and hosting operations for hundreds of active SMB restaurant storefronts and branded iOS/Android apps.",
      tags: ["DNS (A / CNAME / TXT / MX)", "SSL/TLS Provisioning", "White-Label AI Websites", "iOS & Android Storefronts"]
    },
    {
      id: "pillar-data",
      code: "02 // SQL & API DIAGNOSTICS",
      title: "Data-Driven Diagnostics & Webhook Testing",
      description: "Authoring SQL queries in Mode Analytics to audit order throughput bottlenecks and error spikes, paired with Postman REST API testing to replicate webhook payloads and isolate microservice timeouts.",
      tags: ["Mode Analytics (SQL)", "Postman API", "Webhook Payloads", "Log & Telemetry Analysis"]
    },
    {
      id: "pillar-ai",
      code: "03 // AI WORKFLOWS & SOPs",
      title: "AI-Enabled Support & Knowledge Base Curation",
      description: "Applying prompt engineering, human-in-the-loop (HITL) evaluation, and Scribe documentation workflows to build clear Standard Operating Procedures that accelerate onboarding and cut ticket resolution times.",
      tags: ["Prompt Engineering", "LLM Performance Monitoring", "HITL Workflows", "Scribe & Confluence SOPs"]
    },
    {
      id: "pillar-advocacy",
      code: "04 // CROSS-FUNCTIONAL ESCALATION",
      title: "Engineering Escalation & Client Advocacy",
      description: "Partnering directly with engineering, product, sales, and onboarding teams via Jira and Slack to convert frontline ticket trends into reproducible bug reports and long-term platform improvements.",
      tags: ["Atlassian Jira", "Tier 2 Coaching", "Root-Cause Escalation", "VOC / CSAT Leadership"]
    }
  ],

  caseStudies: [
    {
      id: "case-doordash-dns",
      organization: "DoorDash · Storefront SMB",
      category: "DNS & Hosting Lifecycle",
      title: "White-Label Custom Domain & App Synchronization Outage",
      problem: "Multiple SMB restaurant storefronts experienced intermittent SSL handshake failures and menu synchronization drops across their custom web domains and branded iOS/Android ordering apps following domain registrar migrations.",
      diagnostics: "Audited DNS zone records (A, CNAME, TXT) and CAA constraints across affected domains while running Mode Analytics SQL queries to correlate storefront order drop-offs with specific certificate authority provisioning states.",
      resolution: "Resolved conflicting apex A-record and CNAME routing loops, re-triggered automated SSL/TLS certificate validation, and documented a repeatable DNS migration checklist that eliminated recurring cutover downtime.",
      metrics: "Restored 100% HTTPS availability & real-time menu sync across web and mobile channels",
      tags: ["DNS Management", "SSL Provisioning", "Mode SQL", "White-Label Apps"]
    },
    {
      id: "case-365-webhook",
      organization: "365 Retail Markets · Enterprise POS",
      category: "IoT / POS & API Diagnostics",
      title: "Payment Gateway Webhook Timeout on Unattended Kiosks",
      problem: "Enterprise micro-market kiosks intermittently hung on payment authorization screens during high-traffic lunch rushes, resulting in abandoned transactions and duplicate authorization holds.",
      diagnostics: "Connected to affected kiosks via remote desktop to inspect local transaction logs, then replicated the POS-to-gateway REST payload in Postman against staging endpoints to measure response latency and inspect JSON schema behavior.",
      resolution: "Identified an unescaped payload field triggering a gateway parsing timeout on specific card reader firmware builds. Rolled out the firmware configuration patch and coordinated the permanent API validation fix with engineering.",
      metrics: "Eliminated kiosk authorization hangs & prevented duplicate card holds across affected locations",
      tags: ["Postman API", "Webhook Payloads", "Card Readers", "Remote Desktop"]
    },
    {
      id: "case-toast-network",
      organization: "Toast POS · Tier 2 Kitchen Care",
      category: "Network & Hardware Engineering",
      title: "Peak Dinner Hour Kitchen Printer Dropping Network Packets",
      problem: "A high-volume multi-station restaurant experienced silent ticket drops on thermal kitchen printers exclusively during Friday/Saturday peak dinner hours, stalling kitchen prep lines.",
      diagnostics: "Analyzed local subnet topology, ARP tables, and DHCP lease pools across the restaurant's router and managed switches. Discovered guest Wi-Fi traffic exhausting the DHCP pool and causing IP collisions with static kitchen printer addresses.",
      resolution: "Re-architected the local network segmentation by isolating POS terminals and thermal kitchen printers onto a dedicated POS VLAN with reserved DHCP scopes outside the static hardware range.",
      metrics: "Zero dropped kitchen tickets during peak service & adopted as a Tier 1/2 troubleshooting playbook",
      tags: ["Subnetting & VLAN", "DHCP Isolation", "Thermal Printers", "Android POS"]
    }
  ],

  experience: [
    {
      id: "exp-doordash",
      role: "Technical Support Specialist – Storefront (SMB)",
      company: "DoorDash",
      location: "Remote",
      period: "Oct 2025 – Present",
      current: true,
      summary: "Full-stack technical ownership of white-label AI websites, custom domains, and branded mobile ordering applications for SMB restaurant merchants.",
      bullets: [
        "Manage the end-to-end website and domain lifecycle for hundreds of active SMB storefronts—handling custom domain provisioning, DNS record configuration (A, CNAME, TXT, MX), SSL/TLS certificate troubleshooting, and hosting maintenance.",
        "Diagnose and resolve branded white-label mobile app issues across Apple App Store (iOS) and Google Play (Android) ecosystems, resolving authentication, push notification, and real-time menu synchronization failures.",
        "Author SQL queries in Mode Analytics to analyze order throughput trends, isolate platform-level error spikes, and drive data-backed support escalations.",
        "Configure and troubleshoot automated SMS/email marketing campaigns and merchant loyalty rewards programs to directly improve client retention and recurring order volume.",
        "Partner cross-functionally with engineering, product, and onboarding teams to translate frontline merchant friction into actionable Jira bug reports and platform enhancements."
      ],
      skills: ["DNS & SSL Lifecycle", "White-Label AI Websites", "Mode Analytics (SQL)", "iOS & Android Apps", "Jira"]
    },
    {
      id: "exp-365",
      role: "Technical Support Specialist",
      company: "365 Retail Markets",
      location: "Remote",
      period: "Jul 2023 – Jan 2024",
      current: false,
      summary: "Enterprise technical support for unattended micro-market vending POS kiosks, payment gateways, and cloud management software.",
      bullets: [
        "Resolved complex enterprise escalations spanning unattended POS kiosk hardware, payment processing/refund workflows, card reader firmware, and cloud reporting discrepancies.",
        "Leveraged Postman API to test payment gateway endpoints, validate JSON webhook payloads, and diagnose transaction timeout failures.",
        "Performed deep OS-level diagnostics and remote hardware remediation via RDP, TeamViewer, and AnyDesk to restore unattended retail operations with minimal downtime."
      ],
      skills: ["Postman API", "POS Kiosks", "Payment Gateways", "OS Troubleshooting", "Remote Access"]
    },
    {
      id: "exp-toast",
      role: "Tier 2 Customer Care Expert (Kitchen & Network Escalations)",
      company: "Toast",
      location: "Omaha, NE",
      period: "Dec 2019 – Nov 2022",
      current: false,
      summary: "Tier 2 escalation specialist for mission-critical Android POS hardware, kitchen display systems (KDS), thermal printers, and restaurant LAN/VLAN networks.",
      bullets: [
        "Owned Tier 2 technical escalations via Salesforce queues, live phone transfers, and Slack channels—prioritizing enterprise restaurant groups experiencing live service disruptions.",
        "Diagnosed complex networking and hardware issues across TCP/IP subnets, VLANs, DHCP configurations, Android POS terminals, and thermal/impact kitchen printers.",
        "Coached Tier 1 support agents in real time via internal chat queues and authored clear troubleshooting guides that reduced unnecessary Tier 2 ticket transfers.",
        "Collaborated directly with engineering, product, onboarding, and executive stakeholders by documenting reproducible API, SaaS, and firmware defects in Atlassian Jira.",
        "Awarded the peer-nominated 'Lead with Humility Toasty' Award (2022) for cross-team mentorship and calm execution during high-severity outages."
      ],
      skills: ["TCP/IP & VLANs", "Android POS & KDS", "Tier 2 Escalations", "Salesforce & Jira", "Agent Coaching"]
    },
    {
      id: "exp-paypal",
      role: "Global Financial Customer Solutions Teammate",
      company: "PayPal",
      location: "Omaha, NE",
      period: "Dec 2017 – Mar 2019",
      current: false,
      summary: "Technical account security, regulatory compliance, fraud investigation, and dispute resolution for global digital payments.",
      bullets: [
        "Investigated complex transaction histories, identity verification workflows, and unauthorized account access while strictly adhering to federal banking and PII security regulations.",
        "Documented customer-reported platform bugs and briefed team members on updated security protocols and dispute appeal workflows.",
        "Earned two Spot Awards for Collaboration and Inclusion (2018, 2019) while maintaining top-decile customer satisfaction metrics."
      ],
      skills: ["Fintech & Compliance", "Fraud Investigation", "Account Security", "PII Protection"]
    },
    {
      id: "exp-bear",
      role: "Field Service Technician",
      company: "Bear Communications",
      location: "Omaha, NE",
      period: "2017",
      current: false,
      summary: "On-site residential and commercial broadband installation, signal diagnostics, and physical network infrastructure.",
      bullets: [
        "Installed, terminated, and tested high-speed broadband and RF/coax infrastructure at customer premises, isolating physical-layer signal attenuation and upstream network faults.",
        "Educated customers on router configuration and Wi-Fi optimization while de-escalating service issues in the field."
      ],
      skills: ["Field Networking", "Signal Diagnostics", "Router Setup", "On-Site Support"]
    },
    {
      id: "exp-cox",
      role: "Tier II Data Support Specialist",
      company: "Cox Communications",
      location: "Omaha, NE",
      period: "2015 – 2016",
      current: false,
      summary: "Tier 2 broadband data escalations, regional outage trend analysis, and internal tool support for frontline representatives.",
      bullets: [
        "Resolved escalated Tier 2 residential and commercial internet connectivity issues, identifying regional node outages and packet-loss trends.",
        "Supported frontline agents on proprietary network diagnostic tools and beta-tested new troubleshooting utilities prior to floor-wide rollout."
      ],
      skills: ["Tier 2 Data Support", "DOCSIS / Broadband", "Outage Analysis", "Internal Tooling"]
    }
  ],

  skillsCategories: [
    {
      category: "AI, LLMs & Knowledge Ops",
      code: "stack.ai_ops",
      items: [
        "Prompt Engineering",
        "LLM Performance Monitoring",
        "Human-in-the-Loop (HITL) Workflows",
        "Knowledge Base Curation",
        "Scribe SOP Authoring",
        "AI Storefront Operations"
      ]
    },
    {
      category: "Web, DNS & Data / APIs",
      code: "stack.web_data",
      items: [
        "DNS Lifecycle (A, CNAME, TXT, MX)",
        "SSL/TLS Certificate Provisioning",
        "Mode Analytics (SQL Queries)",
        "Postman REST API Testing",
        "Webhook Payload Debugging",
        "HTML5, CSS3 & Python Basics"
      ]
    },
    {
      category: "Networks, POS & Hardware",
      code: "stack.network_pos",
      items: [
        "TCP/IP, DHCP, Subnets & VLANs",
        "Android POS & Unattended Kiosks",
        "Thermal & Kitchen Printers (KDS)",
        "EMV Card Readers & Peripherals",
        "Log & Telemetry Analysis",
        "RDP, TeamViewer & AnyDesk"
      ]
    },
    {
      category: "Enterprise, ITSM & OS",
      code: "stack.enterprise_os",
      items: [
        "Salesforce & Zendesk",
        "Atlassian Jira & Confluence",
        "Okta Identity Management",
        "Google Workspace & Microsoft 365",
        "Windows 10/11/Server & macOS",
        "Android OS, iOS & Linux (Debian/Ubuntu)"
      ]
    }
  ],

  recognitionAndCommunity: [
    {
      type: "KPI Track Record",
      title: "Top Performer in Customer Satisfaction KPIs (VOC, NPS & CSAT)",
      org: "Career-Wide Distinction",
      period: "2015 – Present",
      description: "Recognized with multiple performance awards as a top-ranked specialist in Voice of the Customer (VOC), Net Promoter Score (NPS), and CSAT across every support organization held."
    },
    {
      type: "Peer Recognition Award",
      title: "\"Lead with Humility Toasty\" Award",
      org: "Toast",
      period: "2022",
      description: "Peer-nominated recognition honoring technical mentorship of Tier 1 agents, collaborative escalation ownership, and calm leadership under high-volume restaurant outages."
    },
    {
      type: "Corporate Recognition (2x)",
      title: "Spot Awards for Collaboration & Inclusion",
      org: "PayPal",
      period: "2018 & 2019",
      description: "Awarded twice for cross-team knowledge sharing, inclusive teammate coaching, and elevating floor-wide resolution accuracy."
    },
    {
      type: "Community Leadership",
      title: "Community Technology Mentor — Tech Help Tuesdays",
      org: "Do Space · Omaha, NE",
      period: "5+ Years",
      description: "Volunteered over five years hosting Tech Help Tuesdays—assisting Omaha citizens of all skill levels with malware remediation, smartphone/device setup, networking, 3D printing, and coding basics."
    }
  ],

  education: [
    {
      institution: "University of Nebraska at Omaha",
      location: "Omaha, NE",
      credential: "Coursework in Political Science & General Studies",
      detail: "2010 – 2011"
    },
    {
      institution: "Omaha North High Magnet School",
      location: "Omaha, NE",
      credential: "High School Diploma · 3.5 GPA",
      detail: "Graduated in Top 25% of Class"
    }
  ],

  roadmapPreview: [
    {
      name: "Merchant Domain & DNS Diagnostic Utility",
      status: "Planned Lab Tool",
      description: "Lightweight inspection tool to verify A-record, CNAME, SSL certificate chain, and CDN propagation for custom restaurant storefront domains."
    },
    {
      name: "Order Payload & Webhook Schema Inspector",
      status: "Planned Lab Tool",
      description: "Interactive validator for online ordering JSON webhook payloads to flag missing modifier or payment fields against POS requirements."
    },
    {
      name: "Menu-to-JSON LLM Structurer",
      status: "Planned Lab Tool",
      description: "AI-assisted parser that converts raw restaurant menu text/PDFs into structured JSON with categories, modifiers, and pricing."
    }
  ]
};
