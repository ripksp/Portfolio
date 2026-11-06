#!/usr/bin/env python3
"""
Generates a modern, ATS-friendly, emerald-accented PDF Resume
(`assets/Jacob_Davis_Resume.pdf`) matching the Obsidian & Emerald portfolio site.
Run with:
    uv run --with reportlab python3 scripts/generate_resume_pdf.py
"""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def build_resume_pdf(output_path: str) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=0.48 * inch,
        rightMargin=0.48 * inch,
        topMargin=0.34 * inch,
        bottomMargin=0.34 * inch,
        title="Jacob Davis - Technical Support Specialist Resume",
        author="Jacob Davis",
    )

    emerald_dark = colors.HexColor("#065F46")
    emerald_accent = colors.HexColor("#059669")
    slate_900 = colors.HexColor("#0F172A")
    slate_700 = colors.HexColor("#334155")
    slate_500 = colors.HexColor("#64748B")
    rule_light = colors.HexColor("#CBD5E1")

    base_styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "ResumeName",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=19,
        leading=21.5,
        textColor=slate_900,
        alignment=1,
        spaceAfter=1,
    )

    subtitle_style = ParagraphStyle(
        "ResumeSubtitle",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.8,
        leading=12.5,
        textColor=emerald_dark,
        alignment=1,
        spaceAfter=2,
    )

    contact_style = ParagraphStyle(
        "ResumeContact",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8.6,
        leading=11,
        textColor=slate_700,
        alignment=1,
        spaceAfter=4,
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=emerald_dark,
        spaceBefore=4.5,
        spaceAfter=1.5,
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.1,
        textColor=slate_700,
    )

    role_left_style = ParagraphStyle(
        "RoleLeft",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.1,
        leading=11.1,
        textColor=slate_900,
    )

    role_right_style = ParagraphStyle(
        "RoleRight",
        parent=base_styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.4,
        leading=11.1,
        textColor=slate_500,
        alignment=2,
    )

    bullet_style = ParagraphStyle(
        "BulletItem",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8.35,
        leading=10.75,
        textColor=slate_700,
    )

    story = []

    # HEADER
    story.append(Paragraph("JACOB DAVIS", name_style))
    story.append(
        Paragraph(
            "Technical Support Specialist &amp; Systems IT Professional",
            subtitle_style,
        )
    )
    story.append(
        Paragraph(
            "Omaha, NE &nbsp;|&nbsp; jacobdavis.tech &nbsp;|&nbsp; jacobdavissupport@gmail.com &nbsp;|&nbsp; (402) 637-9234 &nbsp;|&nbsp; Flexible Availability",
            contact_style,
        )
    )
    story.append(
        HRFlowable(
            width="100%",
            thickness=1.4,
            color=emerald_accent,
            spaceBefore=1,
            spaceAfter=5,
        )
    )

    def add_section_header(title: str):
        story.append(Paragraph(title.upper(), section_heading))
        story.append(
            HRFlowable(
                width="100%",
                thickness=0.5,
                color=rule_light,
                spaceBefore=0,
                spaceAfter=4,
            )
        )

    # PROFESSIONAL SUMMARY
    add_section_header("Professional Summary")
    story.append(
        Paragraph(
            "Technical Support Specialist with 8+ years of experience across SaaS, POS, fintech, and broadband infrastructure platforms. "
            "Currently at DoorDash supporting SMB restaurant clients with a full-stack online ordering solution—spanning white-label AI websites, "
            "branded iOS/Android mobile apps, end-to-end DNS &amp; SSL lifecycle management, menu operations, loyalty programs, and Mode Analytics SQL reporting. "
            "Repeatedly recognized as a top performer in VOC, NPS, and CSAT across every role held, bridging deep root-cause diagnostics with clear "
            "customer communication and cross-functional engineering advocacy.",
            body_style,
        )
    )
    story.append(Spacer(1, 3))

    # CORE TECHNICAL COMPETENCIES
    add_section_header("Core Technical Competencies")
    skills_data = [
        [
            Paragraph("<b>AI, LLMs &amp; Knowledge Ops:</b>", bullet_style),
            Paragraph(
                "Prompt Engineering, LLM Performance Monitoring, Human-in-the-Loop (HITL) Workflows, Knowledge Base Curation, Scribe SOPs",
                bullet_style,
            ),
        ],
        [
            Paragraph("<b>Web, DNS &amp; Data / APIs:</b>", bullet_style),
            Paragraph(
                "DNS Lifecycle (A, CNAME, TXT, MX), SSL/TLS Provisioning, Mode Analytics (SQL), Postman REST APIs, Webhook Debugging, Python, HTML/CSS",
                bullet_style,
            ),
        ],
        [
            Paragraph("<b>Networks, POS &amp; Hardware:</b>", bullet_style),
            Paragraph(
                "TCP/IP, DHCP, Subnets &amp; VLANs, Android POS &amp; Kiosks, Thermal Kitchen Printers (KDS), EMV Card Readers, Log Analysis, RDP/TeamViewer/AnyDesk",
                bullet_style,
            ),
        ],
        [
            Paragraph("<b>Enterprise, ITSM &amp; OS:</b>", bullet_style),
            Paragraph(
                "Salesforce, Zendesk, Atlassian Jira &amp; Confluence, Okta IAM, Google Workspace, Microsoft 365, Windows, macOS, Android, iOS, Linux",
                bullet_style,
            ),
        ],
    ]
    skills_table = Table(skills_data, colWidths=[1.65 * inch, 5.85 * inch])
    skills_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 1.2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1.2),
            ]
        )
    )
    story.append(skills_table)
    story.append(Spacer(1, 3))

    # PROFESSIONAL EXPERIENCE
    add_section_header("Professional Experience")

    experiences = [
        (
            "Technical Support Specialist – Storefront (SMB)",
            "DoorDash · Remote",
            "Oct 2025 – Present",
            [
                "Manage the end-to-end website and domain lifecycle for hundreds of SMB restaurant storefronts—handling custom domain provisioning, DNS configuration (A, CNAME, TXT, MX), SSL/TLS certificate troubleshooting, and hosting operations.",
                "Support full-stack online ordering packages spanning custom white-label AI websites and branded iOS/Android mobile apps across Apple App Store and Google Play.",
                "Author SQL queries in Mode Analytics to analyze order throughput trends, detect platform error spikes, and drive data-backed engineering escalations.",
                "Design and troubleshoot automated SMS/email marketing campaigns and loyalty rewards programs to boost merchant retention.",
            ],
        ),
        (
            "Technical Support Specialist",
            "365 Retail Markets · Remote",
            "Jul 2023 – Jan 2024",
            [
                "Provided enterprise support for unattended micro-market vending POS kiosks—resolving payment processing, card reader firmware, cloud reporting, and OS-level escalations.",
                "Leveraged Postman API to test payment gateway endpoints, validate JSON webhook payloads, and isolate transaction timeout failures via remote desktop diagnostics.",
            ],
        ),
        (
            "Tier 2 Customer Care Expert (Kitchen & Network Escalations)",
            "Toast · Omaha, NE",
            "Dec 2019 – Nov 2022",
            [
                "Owned Tier 2 technical escalations via Salesforce queues, live phone transfers, and Slack—resolving mission-critical Android POS, thermal kitchen printer, TCP/IP subnet, VLAN, and DHCP issues.",
                "Coached Tier 1 agents in real time and partnered with engineering, product, and onboarding teams by filing reproducible API and SaaS bug escalations in Jira.",
            ],
        ),
        (
            "Global Financial Customer Solutions Teammate",
            "PayPal · Omaha, NE",
            "Dec 2017 – Mar 2019",
            [
                "Investigated complex account inquiries, transaction histories, identity verification workflows, and fraud claims in strict compliance with banking and PII regulations.",
            ],
        ),
        (
            "Field Service Technician & Tier II Data Support",
            "Bear Communications (2017) & Cox Communications (2015 – 2016) · Omaha, NE",
            "2015 – 2017",
            [
                "Resolved Tier 2 residential/commercial broadband connectivity escalations, diagnosed regional node outages, installed field infrastructure, and supported frontline agents on internal diagnostic tools.",
            ],
        ),
    ]

    for role, company, dates, bullets in experiences:
        header_tbl = Table(
            [
                [
                    Paragraph(
                        f"{role} <font color='#059669'>— {company}</font>",
                        role_left_style,
                    ),
                    Paragraph(dates, role_right_style),
                ]
            ],
            colWidths=[5.6 * inch, 1.9 * inch],
        )
        header_tbl.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "BASELINE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                ]
            )
        )
        story.append(header_tbl)

        bullet_items = [
            ListItem(
                Paragraph(b, bullet_style),
                leftIndent=10,
                bulletColor=emerald_accent,
                bulletFontName="Helvetica",
                bulletFontSize=7,
            )
            for b in bullets
        ]
        story.append(
            ListFlowable(
                bullet_items,
                bulletType="bullet",
                start="bulletchar",
                leftIndent=8,
                spaceBefore=0,
                spaceAfter=3,
            )
        )

    # AWARDS, KPI TRACK RECORD & COMMUNITY MENTORSHIP
    add_section_header("Awards, KPI Distinctions & Community Leadership")
    awards_bullets = [
        "<b>Top Performer in Customer Satisfaction KPIs (VOC, NPS &amp; CSAT):</b> Consistently ranked at the top with multiple performance awards across every support role held.",
        "<b>\"Lead with Humility Toasty\" Peer Recognition Award (Toast, 2022) &amp; 2x Spot Awards (PayPal, 2018 &amp; 2019):</b> Honored for Tier 1 agent mentorship, cross-team collaboration, and calm execution during high-severity outages.",
        "<b>Community Technology Mentor — Do Space Omaha (5+ Years):</b> Hosted Tech Help Tuesdays, mentoring citizens of all ages through hardware diagnostics, networking, malware removal, and coding basics.",
    ]
    story.append(
        ListFlowable(
            [
                ListItem(
                    Paragraph(a, bullet_style),
                    leftIndent=10,
                    bulletColor=emerald_accent,
                    bulletFontName="Helvetica",
                    bulletFontSize=7,
                )
                for a in awards_bullets
            ],
            bulletType="bullet",
            leftIndent=8,
            spaceBefore=0,
            spaceAfter=3,
        )
    )

    # EDUCATION
    add_section_header("Education")
    story.append(
        Paragraph(
            "<b>University of Nebraska at Omaha</b> — Political Science &amp; General Studies Coursework (2010 – 2011) &nbsp;&nbsp;|&nbsp;&nbsp; "
            "<b>Omaha North High Magnet School</b> — High School Diploma · 3.5 GPA · Top 25% of Class",
            bullet_style,
        )
    )

    doc.build(story)
    print(f"Successfully generated PDF resume at: {output_path}")


if __name__ == "__main__":
    target = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "assets",
        "Jacob_Davis_Resume.pdf",
    )
    build_resume_pdf(target)
