#!/usr/bin/env python3
"""
Generates a modern, ATS-friendly, emerald-accented 1-page PDF Resume
(`assets/Jacob_Davis_Resume.pdf`) matching the Obsidian & Emerald portfolio site
and all single-source Living Resume constraints.

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
        title="Jacob Davis - Online Ordering Support Specialist Resume",
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
        fontSize=8.5,
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
        fontSize=9.05,
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
            "Online Ordering Support Specialist &amp; Systems IT Professional",
            subtitle_style,
        )
    )
    story.append(
        Paragraph(
            "Omaha, NE (Remote / Hybrid) &nbsp;|&nbsp; <a href='https://jacobdavis.tech' color='#059669'>jacobdavis.tech</a> &nbsp;|&nbsp; <a href='mailto:jacobdavissupport@gmail.com' color='#059669'>jacobdavissupport@gmail.com</a> &nbsp;|&nbsp; <a href='https://www.linkedin.com/in/jacobdavistech' color='#059669'>linkedin.com/in/jacobdavistech</a>",
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
            "Online Ordering Support Specialist with 8+ years of progressive experience across SaaS, POS, fintech, and broadband infrastructure platforms. "
            "Currently at DoorDash supporting SMB restaurant partners—querying Snowflake via Mode Analytics to inspect raw menu ingestion JSON payloads and "
            "map multi-unit merchant locations, coordinating with product engineering squads via Slack and Intercom side-conversations, championing Scribe "
            "technical SOP runbooks, and managing end-to-end DNS/SSL lifecycles and white-label iOS/Android storefronts.",
            body_style,
        )
    )
    story.append(Spacer(1, 3))

    # CORE TECHNICAL COMPETENCIES
    add_section_header("Core Technical Competencies")
    skills_data = [
        [
            Paragraph("<b>Data, APIs &amp; Menu Ingestion:</b>", bullet_style),
            Paragraph(
                "Snowflake (Mode Analytics SQL), Raw Menu JSON Payload Inspection, Postman REST API Debugging, Webhook Validation, Multi-Unit Mapping, Python, HTML/CSS",
                bullet_style,
            ),
        ],
        [
            Paragraph("<b>Web, DNS &amp; Storefront Ops:</b>", bullet_style),
            Paragraph(
                "DNS Provisioning (A, CNAME, TXT, MX), SSL/TLS Lifecycles, White-Label iOS &amp; Android Storefronts, Scribe Technical SOP Runbooks, Knowledge Base Curation",
                bullet_style,
            ),
        ],
        [
            Paragraph("<b>Networks, POS &amp; Hardware:</b>", bullet_style),
            Paragraph(
                "TCP/IP, DHCP, Subnets &amp; VLANs, DOCSIS Provisioning &amp; SNR Diagnostics, Android POS Terminals, Epson Thermal Printers, Remote CLI OS Recovery",
                bullet_style,
            ),
        ],
        [
            Paragraph("<b>Collaboration &amp; Platforms:</b>", bullet_style),
            Paragraph(
                "Slack &amp; Intercom Side-Conversations, Product Engineering Escalations, Salesforce, Zendesk, Prompt Engineering, Windows, macOS, Android, iOS, Linux",
                bullet_style,
            ),
        ],
    ]
    skills_table = Table(skills_data, colWidths=[1.75 * inch, 5.75 * inch])
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
            "Online Ordering Support Specialist",
            "DoorDash · Remote",
            "Jan 2026 – Present",
            [
                "Query Snowflake via Mode Analytics to inspect raw menu ingestion JSON payloads and map multi-unit merchant storefront locations accurately.",
                "Coordinate directly with product engineering squads via Slack threads and Intercom side-conversations to isolate bugs, verify edge cases, and expedite fixes.",
                "Championed Scribe and authored step-by-step technical SOP runbooks for menu workflows, payload inspection, and support onboarding.",
                "Manage end-to-end domain lifecycles (DNS provisioning: A, CNAME, TXT, MX, and SSL/TLS certificates) and troubleshoot white-label iOS and Android storefronts.",
            ],
        ),
        (
            "Technical Support Specialist",
            "365 Retail Markets · Remote",
            "2024 – 2025",
            [
                "Performed Postman API payment gateway debugging to validate transaction payloads, inspect response codes, and isolate webhook timeout failures.",
                "Executed remote CLI kiosk OS recovery and hardware diagnostics across unattended POS terminals, card readers, and local network interfaces.",
            ],
        ),
        (
            "Tier II Technical Support Engineer / POS Specialist",
            "Toast, Inc. · Omaha, NE",
            "2021 – 2024",
            [
                "Handled 3 years of escalated Tier II POS incidents for enterprise and multi-unit restaurant groups experiencing live service disruptions.",
                "Diagnosed complex networking and hardware issues across Android POS terminals, Epson thermal kitchen printers, DHCP scopes, subnetting, and VLANs.",
                "Coached frontline specialists on network isolation workflows and partnered with engineering teams on reproducible bug escalations.",
            ],
        ),
        (
            "Customer Operations Specialist",
            "PayPal · Omaha, NE",
            "2019 – 2021",
            [
                "Managed escalated payment disputes, chargeback investigations, and fraud/risk triage while maintaining strict adherence to banking and PII standards.",
            ],
        ),
        (
            "Technical Support Specialist",
            "Cox Communications · Omaha, NE",
            "2017 – 2019",
            [
                "Executed DOCSIS modem provisioning, signal-to-noise ratio (SNR) diagnostics, and residential/commercial gateway routing troubleshooting.",
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
                spaceAfter=2.5,
            )
        )

    # COMMUNITY & AWARDS
    add_section_header("Community Leadership & Recognition")
    awards_bullets = [
        "<b>Do Space Volunteer Technology Mentor (2018 – 2024, 6 Years):</b> Hosted Tech Help Tuesdays in Omaha, mentoring citizens on hardware diagnostics, networking, and coding basics.",
        "<b>Awards &amp; KPI Leadership:</b> Top Performer in Customer Satisfaction KPIs (VOC, NPS &amp; CSAT); \"Lead with Humility Toasty\" Award (Toast, 2022); 2x Spot Awards for Collaboration &amp; Inclusion (PayPal).",
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
            spaceAfter=2.5,
        )
    )

    # EDUCATION
    add_section_header("Education")
    story.append(
        Paragraph(
            "<b>University of Nebraska at Omaha &amp; Metropolitan Community College</b> — Information Technology &amp; Cybersecurity Coursework",
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
