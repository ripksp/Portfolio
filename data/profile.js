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
    githubLabel: "github.com/ripksp",
    linkedinLabel: "linkedin.com/in/jacobdavistech",
    linkedinUrl: "https://www.linkedin.com/in/jacobdavistech",
    resumePdfPath: "/assets/Jacob_Davis_Resume.pdf",
    portraitPath: "/assets/jacob-davis.png",
    portraitAlt: "Jacob Davis — Online Ordering Support Specialist & Systems IT Professional",
    lastUpdated: "2026"
  },

  hero: {
    eyebrow: "heyyo! · jacobdavis.tech · omaha, ne",
    headline: "Support that finds the root cause — and fixes it for good.",
    lead: "Heyyo! I'm Jacob, an Online Ordering Support Specialist at DoorDash with 8+ years across SaaS, POS, fintech, and broadband. I'm the guy who opens tickets with a friendly greeting and a well-timed GIF, helps lead Culture Committee meetings before department-wide MSO training, and still tracks down the exact DNS record or Snowflake JSON bug before lunch. No horsing around when a Friday dinner rush is on the line.",
    subheadline: "Heyyo! I'm Jacob, an Online Ordering Support Specialist at DoorDash with 8+ years across SaaS, POS, fintech, and broadband.",
    statusCard: {
      eyebrow: "CURRENT ROLE · OMAHA, NE (REMOTE / HYBRID)",
      role: "Online Ordering Support Specialist",
      company: "DoorDash",
      period: "Jan 2026 – Present",
      status: "Active in Production Support",
      focusTags: [
        "Snowflake / Mode SQL",
        "DNS & SSL Lifecycles",
        "White-Label Storefronts",
        "Scribe SOP Runbooks"
      ]
    },
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
    resumeSummary: "Online Ordering Support Specialist with 8+ years of progressive experience across SaaS, POS, fintech, and broadband infrastructure platforms. Currently at DoorDash supporting SMB restaurant partners—querying Snowflake via Mode Analytics to inspect raw menu ingestion JSON payloads and map multi-unit merchant locations, coordinating with product engineering squads via Slack and Intercom side-conversations, championing Scribe technical SOP runbooks, co-leading Culture Committee sessions ahead of MSO training meetings, and managing end-to-end DNS/SSL lifecycles and white-label iOS/Android storefronts. Proven track record across Tier II POS network escalations (Toast), payment gateway API debugging (365 Retail Markets), fraud/risk triage (PayPal), and DOCSIS routing (Cox).",
    philosophyParagraphs: [
      "Heyyo! Helping people understand and succeed with technology has been my focus from day one — just without the stiff, robotic helpdesk script. At work, I'm known for opening cases with \"Heyyo!\" and a well-timed GIF, and helping lead Culture Committee meetings ahead of our department-wide MSO training sessions so the team actually enjoys showing up.",
      "Underneath the laid-back vibe, though, I'm relentless about root causes. Think of a stray CNAME record on a registrar like Juan the horse on a balcony: nobody knows how it got up there, but I'm the one safely getting it down. Over the past 8+ years, I've gone from DOCSIS provisioning at Cox and fraud/risk triage at PayPal, to Tier II POS & VLAN escalations at Toast, Postman API & remote CLI kiosk recovery at 365 Retail Markets, and now DoorDash online ordering storefronts, DNS/SSL lifecycles, and Snowflake menu diagnostics.",
      "Outside the queue, I spent 6 years (2018–2024) volunteering as a Technology Mentor at Do Space in Omaha—hosting Tech Help Tuesdays and helping neighbors of all ages get comfortable with hardware, networking, and code."
    ]
  },

  pillars: [
    {
      id: "pillar-dns",
      code: "01 // WEB & DNS LIFECYCLE",
      title: "Full Web, DNS & White-Label Storefronts",
      description: "No horsing around with SSL: end-to-end domain provisioning, DNS propagation troubleshooting (A, CNAME, TXT, MX), TLS 1.3 lifecycles, and white-label iOS & Android storefronts.",
      tags: ["DNS (A / CNAME / TXT / MX)", "SSL/TLS Provisioning", "White-Label iOS & Android", "Storefront Lifecycle"]
    },
    {
      id: "pillar-data",
      code: "02 // SNOWFLAKE, SQL & API DIAGNOSTICS",
      title: "JSON Payload Inspection & API Debugging",
      description: "Straight from the horse's mouth — querying Snowflake via Mode Analytics to inspect raw menu ingestion JSON payloads and map multi-unit locations, paired with Postman API debugging.",
      tags: ["Snowflake (Mode Analytics)", "Raw Menu JSON Payloads", "Postman API", "Webhook Debugging"]
    },
    {
      id: "scribe-docs",
      code: "03 // SOPs & KNOWLEDGE CURATION",
      title: "Scribe Runbooks & AI-Enabled Support",
      description: "Championing Scribe and authoring step-by-step technical SOP runbooks for menu ingestion, payload inspection, and onboarding—paired with prompt engineering and HITL workflow curation.",
      tags: ["Scribe SOP Runbooks", "Knowledge Base Curation", "Prompt Engineering", "HITL Workflows"]
    },
    {
      id: "pillar-advocacy",
      code: "04 // ENGINEERING & CULTURE",
      title: "Engineering Escalation & Culture Committee",
      description: "Coordinating with product engineering squads via Slack & Intercom to squash edge cases, while helping lead Culture Committee meetings before department-wide MSO training.",
      tags: ["Slack & Intercom", "Product Eng Escalation", "Culture Committee", "VOC / CSAT Leadership"]
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
        "Manage end-to-end domain lifecycles (DNS provisioning: A, CNAME, TXT, MX, and SSL/TLS certificates), troubleshoot white-label iOS/Android storefronts, and co-lead Culture Committee sessions ahead of department-wide MSO training meetings."
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
      id: "dospace",
      type: "Community Leadership",
      title: "Do Space Volunteer Technology Mentor",
      org: "Do Space · Omaha, NE",
      period: "2018 – 2024 (6 Years)",
      description: "Volunteered for six years hosting Tech Help Tuesdays—mentoring Omaha citizens of all skill levels on hardware diagnostics, networking, software troubleshooting, and coding basics."
    },
    {
      id: "kpi-leadership",
      type: "KPI Track Record",
      title: "Top Performer in Customer Satisfaction KPIs (VOC, NPS & CSAT)",
      org: "Career-Wide Distinction",
      period: "2017 – Present",
      description: "Consistently ranked among top performers in Voice of the Customer (VOC), Net Promoter Score (NPS), and CSAT across support organizations."
    },
    {
      id: "toast-award",
      type: "Peer Recognition Award",
      title: "\"Lead with Humility Toasty\" Award",
      org: "Toast, Inc.",
      period: "2022",
      description: "Peer-nominated recognition honoring Tier II mentorship, collaborative escalation ownership, and calm execution during high-volume restaurant outages."
    },
    {
      id: "paypal-awards",
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

  /* Storefront-style homepage extras (marquee ticker + "Good To Know" FAQ) */
  marquee: [
    "Heyyo! 👋 Culture Committee",
    "Snowflake & Mode Analytics",
    "Hold Your Horses · DNS Check",
    "SSL / TLS 1.3 Lifecycles",
    "White-Label iOS & Android Storefronts",
    "Raw Menu JSON Payloads",
    "Postman API Debugging",
    "No Horsing Around on VLAN 20",
    "Toast Tier II POS",
    "Scribe SOP Runbooks",
    "Do Space Tech Mentor"
  ],

  faq: [
    {
      q: "What role are you in right now?",
      a: "Heyyo! I'm an Online Ordering Support Specialist at DoorDash (Jan 2026 – Present), supporting restaurant partners across white-label web and mobile storefronts, custom domains, SSL, and menu ingestion — plus helping lead Culture Committee meetings ahead of department-wide MSO training."
    },
    {
      q: "Are you open to remote or hybrid roles?",
      a: "Yep! I'm based in Omaha, NE and always happy to chat about remote or hybrid Technical Support, Systems Support, and Operations roles."
    },
    {
      q: "What does your day-to-day technical toolkit look like?",
      a: "SQL against Snowflake via Mode Analytics to inspect raw menu JSON payloads, Postman for API and webhook debugging, DNS record provisioning (A, CNAME, TXT, MX), SSL lifecycle checks, and Slack / Intercom threads with product engineering squads."
    },
    {
      q: "Can you actually troubleshoot DNS and SSL issues?",
      a: "No horsing around with SSL — it's a core part of my day. You can run the exact same style of checks in my live DNS & SSL inspector, or ask Juan-Bot (bottom right) to run one right in chat.",
      link: { href: "/tools", label: "Open the live DNS tool" }
    },
    {
      q: "Wait... what's with the horse memes and 'Juan.'?",
      a: "A stray CNAME record on a registrar is basically Juan the horse on a balcony — nobody knows how it got up there, but someone's gotta get it down safely. Try clicking the 🐴 button on the 3D hero (or typing 'horse' or 'juan' anywhere on the page) to see for yourself."
    },
    {
      q: "Do you have hands-on POS and hardware experience?",
      a: "Three years of escalated Tier II POS support at Toast — Android terminals, Epson thermal printers, DHCP scopes, subnetting, and VLAN segmentation — plus remote CLI kiosk OS recovery at 365 Retail Markets."
    },
    {
      q: "How do you make sure fixes stick?",
      a: "Straight from the horse's mouth: I write them down. I championed Scribe and author step-by-step technical SOP runbooks so the next teammate can solve the same bug in half the time."
    }
  ],

  roadmapPreview: [
    {
      name: "Merchant Domain & DNS Pre-Flight Checker",
      status: "Live at /tools",
      description: "Authoritative A, AAAA, CNAME, NS, MX, and TXT record inspection paired with live port 443 SSL/TLS chain verification prior to custom domain cutover."
    },
    {
      name: "Menu Ingestion JSON Payload Validator",
      status: "In Development",
      description: "Interactive schema linter that inspects restaurant menu JSON payloads to flag unmapped modifier groups, missing tax rules, and multi-unit storefront identifiers."
    },
    {
      name: "POS Webhook & Idempotency Replay Tester",
      status: "Planned Lab Tool",
      description: "Diagnostic sandbox for validating HMAC-signed order webhooks, testing retry backoff policies, and previewing ESC/POS kitchen thermal ticket output."
    },
    {
      name: "Scribe-Style Technical SOP Builder",
      status: "Prototype",
      description: "AI-assisted workflow draft helper that structures root-cause triage notes and terminal diagnostics into repeatable support runbooks."
    }
  ],

  projects: [
    {
      id: "orderflow",
      sandboxId: "sandbox-orderflow",
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
      stack: ["JavaScript ES6", "ESC/POS Thermal Protocol", "REST Webhooks", "Idempotency Keys", "Epson TM-T88VI"],
      sandbox: {
        title: "OrderFlow Idempotent Queue & ESC/POS Pipeline Inspector",
        subtitle: "Simulate transient POS network drops and inspect idempotent retry recovery + thermal receipt output.",
        sampleOrder: {
          orderId: "ORD-88412",
          idempotencyKey: "idem_9f2a7c41b0e8",
          merchant: "Riverfront Bistro",
          channel: "Direct Web Storefront",
          retryAttempts: 2,
          printerTarget: "Epson TM-T88VI (192.168.40.22:9100)",
          items: [
            {
              qty: 2,
              name: "Smoked Brisket Melt",
              modifiers: ["Extra Cheddar", "Sourdough"],
              allergens: ["Dairy", "Gluten"]
            },
            {
              qty: 1,
              name: "Crispy Garlic Fries",
              modifiers: ["No Parsley"],
              allergens: []
            }
          ],
          escPosPreview: [
            "*** KITCHEN TICKET #ORD-88412 ***",
            "CHANNEL: DIRECT WEB | RETRIES: 2 (IDEMPOTENT OK)",
            "2x SMOKED BRISKET MELT",
            "   + Extra Cheddar | + Sourdough",
            "   [ALLERGY ALERT: DAIRY, GLUTEN]",
            "1x CRISPY GARLIC FRIES",
            "   - No Parsley"
          ]
        },
        pipelineStages: [
          {
            step: "01",
            stage: "Received",
            status: "Completed",
            latencyMs: 14,
            detail: "Storefront POST validated; idempotency hash idem_9f2a7c41b0e8 persisted to local queue."
          },
          {
            step: "02",
            stage: "POS",
            status: "Recovered (2 Retries)",
            latencyMs: 185,
            detail: "Transient Wi-Fi packet drop handled cleanly via exponential backoff with zero duplicate order injection."
          },
          {
            step: "03",
            stage: "Prep",
            status: "Dispatched",
            latencyMs: 9,
            detail: "ESC/POS command frame flushed to Epson TM-T88VI over dedicated POS VLAN."
          },
          {
            step: "04",
            stage: "Fulfilled",
            status: "Ready",
            latencyMs: 4,
            detail: "Kitchen bump event synced back to storefront live order tracker."
          }
        ]
      }
    },
    {
      id: "omniorder",
      sandboxId: "sandbox-omniorder",
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
      stack: ["Node.js / FastAPI", "HMAC SHA-256", "JSON Schema Mapping", "WebSockets / KDS", "Inventory Sync"],
      sandbox: {
        title: "OmniOrder Canonical JSON Normalizer & 86'd Sync Inspector",
        subtitle: "Inspect HMAC-verified channel payloads transforming into the Canonical KDS v1 schema.",
        channels: [
          {
            id: "marketplace-a",
            channelName: "Marketplace Partner A",
            hmacStatus: "HMAC SHA-256 Verified",
            latencyMs: 11,
            rawPayload: {
              event: "order.created",
              partner_order_ref: "MPA-40921",
              store_external_id: "loc_omaha_01",
              line_items: [
                {
                  sku_code: "BURGER_01",
                  label: "Classic Smashburger",
                  count: 1,
                  options: [{ group: "Temp", val: "Medium Well" }]
                }
              ]
            },
            normalizedPayload: {
              schemaVersion: "canonical-kds-v1",
              orderId: "KDS-40921",
              sourceChannel: "marketplace-a",
              locationId: "loc_omaha_01",
              items: [
                {
                  sku: "BURGER_01",
                  name: "Classic Smashburger",
                  quantity: 1,
                  modifiers: ["Temp: Medium Well"]
                }
              ]
            }
          },
          {
            id: "catering-b",
            channelName: "Direct Catering Webhook",
            hmacStatus: "HMAC SHA-256 Verified",
            latencyMs: 13,
            rawPayload: {
              type: "CATERING_DISPATCH",
              ticketNumber: "CAT-772",
              unitCode: "loc_omaha_01",
              entries: [
                {
                  itemKey: "TRAY_TACOS",
                  title: "Street Taco Tray (12pc)",
                  qty: 2,
                  notes: "Salsa Verde on side"
                }
              ]
            },
            normalizedPayload: {
              schemaVersion: "canonical-kds-v1",
              orderId: "KDS-CAT-772",
              sourceChannel: "catering-b",
              locationId: "loc_omaha_01",
              items: [
                {
                  sku: "TRAY_TACOS",
                  name: "Street Taco Tray (12pc)",
                  quantity: 2,
                  modifiers: ["Note: Salsa Verde on side"]
                }
              ]
            }
          }
        ],
        inventoryBroadcast: {
          sku: "BURGER_01",
          itemName: "Classic Smashburger",
          action: "MARK_86_OUT_OF_STOCK",
          propagationMs: 18,
          syncedTargets: [
            "Marketplace Partner A",
            "Direct Catering Webhook",
            "First-Party Web Storefront"
          ]
        }
      }
    },
    {
      id: "brandsync",
      sandboxId: "sandbox-brandsync",
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
      stack: ["Authoritative DNS", "ACME / TLS 1.3", "White-Label Storefronts", "HTML / CSS / JS"],
      sandbox: {
        title: "White-Label Storefront Customizer",
        subtitle: "Preview custom domain CNAME routing, theme colors, status badges, and live menu items."
      }
    }
  ],

  brandSync: {
    defaultStorefront: {
      brandName: "Prairie Smoke BBQ",
      subdomain: "order.prairiesmokebbq.com",
      tagline: "Direct commission-free online ordering with real-time POS menu sync and automated SSL provisioning.",
      themeColor: "#10b981",
      statusBadge: "CNAME Verified · Open for Delivery & Pickup",
      items: [
        {
          name: "12-Hour Smoked Beef Brisket Plate",
          description: "Post-oak smoked prime brisket, pickled red onions, Texas toast, and house espresso BBQ glaze.",
          price: "$19.50"
        },
        {
          name: "Burnt Ends Mac & Cheese",
          description: "Cavatappi pasta folded in aged white cheddar sauce topped with caramelized brisket burnt ends.",
          price: "$14.75"
        },
        {
          name: "Hickory Pulled Pork Sandwich",
          description: "Slow-pulled shoulder on toasted brioche with apple cider slaw and house mustard sauce.",
          price: "$13.50"
        }
      ]
    },
    themePresets: [
      { name: "Emerald", hex: "#10b981" },
      { name: "Crimson", hex: "#dc2626" },
      { name: "Sky", hex: "#0ea5e9" },
      { name: "Amber", hex: "#f59e0b" },
      { name: "Indigo", hex: "#6366f1" },
      { name: "Violet", hex: "#8b5cf6" }
    ],
    storePresets: [
      {
        brandName: "Prairie Smoke BBQ",
        subdomain: "order.prairiesmokebbq.com",
        tagline: "Direct commission-free online ordering with real-time POS menu sync and automated SSL provisioning.",
        themeColor: "#10b981",
        statusBadge: "CNAME Verified · Open for Delivery & Pickup",
        items: [
          {
            name: "12-Hour Smoked Beef Brisket Plate",
            description: "Post-oak smoked prime brisket, pickled red onions, Texas toast, and house espresso BBQ glaze.",
            price: "$19.50"
          },
          {
            name: "Burnt Ends Mac & Cheese",
            description: "Cavatappi pasta folded in aged white cheddar sauce topped with caramelized brisket burnt ends.",
            price: "$14.75"
          },
          {
            name: "Hickory Pulled Pork Sandwich",
            description: "Slow-pulled shoulder on toasted brioche with apple cider slaw and house mustard sauce.",
            price: "$13.50"
          }
        ]
      },
      {
        brandName: "Heartland Taco Cantina",
        subdomain: "order.heartlandcantina.com",
        tagline: "Hand-pressed heirloom corn tortillas, slow-braised carnitas, and house-roasted salsas.",
        themeColor: "#dc2626",
        statusBadge: "Open for Delivery & Pickup",
        items: [
          {
            name: "Birria Quesa-Taco Trio",
            description: "Crispy seared corn tortillas filled with braised beef, Oaxaca cheese, cilantro, and rich consomme.",
            price: "$16.25"
          },
          {
            name: "Street Corn Esquites Bowl",
            description: "Charred sweet corn tossed with lime crema, cotija cheese, tajin, and fresh cilantro.",
            price: "$7.50"
          },
          {
            name: "Carne Asada Burrito",
            description: "Wood-grilled skirt steak, black beans, cilantro-lime rice, guacamole, and salsa roja.",
            price: "$14.95"
          }
        ]
      },
      {
        brandName: "Old Market Wood-Fired Pizza",
        subdomain: "order.oldmarketpizza.com",
        tagline: "72-hour cold-fermented sourdough crusts baked at 850 degrees with local Midwest toppings.",
        themeColor: "#f59e0b",
        statusBadge: "Taking Catering Orders",
        items: [
          {
            name: "Hot Honey & Cup-and-Char Pepperoni",
            description: "San Marzano tomato base, fresh fior di latte, crispy pepperoni, and wildflower chili honey.",
            price: "$18.00"
          },
          {
            name: "Roasted Mushroom & Truffle Bianca",
            description: "Whipped ricotta, cremini & oyster mushrooms, caramelized shallots, thyme, and garlic oil.",
            price: "$17.50"
          },
          {
            name: "Garlic Knots (6pc)",
            description: "Brick-oven dough knots brushed with roasted garlic herb butter and aged parmesan.",
            price: "$8.00"
          }
        ]
      }
    ]
  },

  tools: {
    defaultDomain: "jacobdavis.tech",
    quickDomains: ["jacobdavis.tech", "doordash.com", "github.com", "toasttab.com"],
    outageScenarios: [
      {
        id: "scenario-dns-conflict",
        title: "Apex A-Record & CNAME Cutover Loop",
        category: "DNS & Routing",
        severity: "High",
        symptom: "Custom restaurant ordering subdomain returns intermittent NXDOMAIN or routes visitors to an outdated registrar parking page after DNS migration.",
        diagnosticSteps: [
          "Run authoritative A, AAAA, and CNAME lookup against public resolvers to isolate stale registrar records.",
          "Check for conflicting apex A-records or proxy flags blocking ACME validation on the order subdomain.",
          "Verify TTL decay window and confirm CNAME points cleanly to the managed storefront edge target."
        ],
        sampleArtifact: "order.merchantbistro.com. 300 IN CNAME edge.storefront-host.net. (Removed conflicting A 198.51.100.42)",
        rootCause: "Legacy parking A-record and proxied CNAME at the DNS registrar prevented edge routing convergence.",
        resolution: "Removed conflicting legacy records, aligned CNAME target without proxy interference, and confirmed live edge resolution."
      },
      {
        id: "scenario-ssl-caa",
        title: "SSL/TLS Provisioning Blocked by CAA Policy",
        category: "SSL / TLS Lifecycle",
        severity: "High",
        symptom: "White-label storefront displays ERR_CERT_COMMON_NAME_INVALID or pending certificate issuance for over 24 hours.",
        diagnosticSteps: [
          "Inspect port 443 TLS handshake to compare certificate Subject Alternative Names (SANs) against requested custom domain.",
          "Query TXT and CAA DNS records to identify restrictive Certificate Authority Authorization policies.",
          "Validate HTTP-01 / DNS-01 challenge path reachability."
        ],
        sampleArtifact: "merchantbistro.com. 300 IN CAA 0 issue \"letsencrypt.org\" (Added missing issuer authorization)",
        rootCause: "Root domain CAA record restricted issuance exclusively to a prior enterprise CA, blocking automated Let's Encrypt renewal.",
        resolution: "Added authorized CAA issue entry with merchant DNS admin, re-triggered automated ACME issuance, and verified TLS 1.3 handshake."
      },
      {
        id: "scenario-menu-webhook",
        title: "Menu Ingestion JSON Payload & Modifier Mismatch",
        category: "SQL & API Payloads",
        severity: "Medium",
        symptom: "Multi-unit restaurant menu updates fail to sync updated item prices and modifier options to white-label iOS/Android storefronts.",
        diagnosticSteps: [
          "Query analytics warehouse logs to inspect the raw menu ingestion JSON payload and confirm target store location mapping.",
          "Replay webhook payload in Postman against validation endpoint to check HTTP status and schema error codes.",
          "Isolate malformed modifier group references or missing required price fields."
        ],
        sampleArtifact: "{\"location_id\": \"unit_04\", \"status\": 422, \"error\": \"modifier_group[2].min_selections exceeds option count\"}",
        rootCause: "POS menu export emitted a modifier group requiring 2 selections when only 1 active option remained in stock.",
        resolution: "Corrected modifier constraint bounds in POS catalog, verified clean JSON ingestion payload, and documented check in a Scribe SOP."
      },
      {
        id: "scenario-pos-vlan",
        title: "Peak Service Kitchen Printer Packet Loss",
        category: "Network & POS Hardware",
        severity: "Critical",
        symptom: "Epson thermal kitchen printers silently drop online order tickets during peak Friday dinner service while tablets stay online.",
        diagnosticSteps: [
          "Audit local router DHCP lease table and subnet mask allocation across guest Wi-Fi and POS terminals.",
          "Ping printer static IP under load and check for IP address collisions from guest device leases.",
          "Verify POS VLAN tagging and port isolation rules on managed switch."
        ],
        sampleArtifact: "VLAN 20 (POS_PROD): 10.20.40.0/24 | Reserved Printer Pool: .20-.39 | Guest Wi-Fi moved to VLAN 99",
        rootCause: "Shared flat subnet allowed guest Wi-Fi devices to exhaust DHCP leases and collide with static kitchen printer IPs.",
        resolution: "Segmented POS terminals and Epson thermal printers onto dedicated VLAN 20 with reserved DHCP bindings, eliminating ticket drops."
      }
    ]
  },

  stellar: {
    name: "Stellar Industries",
    title: "Stellar Industries",
    subtitle: "Mobile Aerospace Tycoon & Systems Simulation",
    eyebrow: "ANDROID NATIVE RELEASE · BUILD V1.0.6 · OFFLINE READY",
    version: "Build v1.0.6",
    requirements: "Android 7.0+ (API 24+)",
    minAndroid: "Android 7.0+ (API 24+)",
    size: "8.3 MB",
    apkSize: "8.3 MB",
    statusBadge: "Android 7.0+ (API 24+) · Signed & Offline Ready",
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
    stack: ["Kotlin 1.9", "Jetpack Compose", "Room SQLite", "Kotlinx.Serialization", "Compose Canvas 2D", "Offline Progression"],
    installSteps: [
      {
        step: "1",
        title: "Download the APK",
        detail: "Tap Download for Android (.APK) above on your Android phone or tablet."
      },
      {
        step: "2",
        title: "Open the File",
        detail: "Tap the completed download in notifications or your device's Files / Downloads folder."
      },
      {
        step: "3",
        title: "Allow Installation",
        detail: "If prompted, tap Settings -> Allow from this source and tap Install."
      }
    ]
  }
};
