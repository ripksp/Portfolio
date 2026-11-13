#!/usr/bin/env python3
"""
Generates a modern, ATS-friendly, emerald-accented 1-page US Letter PDF Resume
(`assets/Jacob_Davis_Resume.pdf`) dynamically from the single source of truth
(`data/profile.js`).

Run with:
    uv run --with reportlab python3 scripts/generate_resume_pdf.py
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import tempfile
from typing import Any
from xml.sax.saxutils import escape as xml_escape


class JSParseError(ValueError):
    """Raised when JavaScript object literal parsing fails."""


class JSObjectParser:
    """Pure-Python character-level recursive-descent parser for static JS object literals."""

    def __init__(self, text: str) -> None:
        self.text = text
        self.length = len(text)
        self.pos = 0

    def _eof(self) -> bool:
        return self.pos >= self.length

    def _peek(self, offset: int = 0) -> str:
        idx = self.pos + offset
        if idx >= self.length:
            return ""
        return self.text[idx]

    def _skip_ws_and_comments(self) -> None:
        while not self._eof():
            ch = self.text[self.pos]
            if ch in " \t\r\n\f\v":
                self.pos += 1
                continue
            if ch == "/" and self._peek(1) == "/":
                self.pos += 2
                while not self._eof() and self.text[self.pos] not in "\r\n":
                    self.pos += 1
                continue
            if ch == "/" and self._peek(1) == "*":
                self.pos += 2
                end = self.text.find("*/", self.pos)
                if end == -1:
                    raise JSParseError("Unterminated block comment in JS source.")
                self.pos = end + 2
                continue
            break

    def _parse_string(self) -> str:
        quote = self.text[self.pos]
        if quote not in ('"', "'", "`"):
            raise JSParseError(f"Expected string quote at offset {self.pos}")
        self.pos += 1
        chars: list[str] = []

        while not self._eof():
            ch = self.text[self.pos]
            if ch == quote:
                self.pos += 1
                return "".join(chars)

            if quote == "`" and ch == "$" and self._peek(1) == "{":
                raise JSParseError(
                    "Template literal interpolation (${...}) is not supported by static parser."
                )

            if ch == "\\":
                self.pos += 1
                if self._eof():
                    raise JSParseError("Unterminated escape sequence in string literal.")
                esc_ch = self.text[self.pos]
                self.pos += 1
                if esc_ch == "n":
                    chars.append("\n")
                elif esc_ch == "r":
                    chars.append("\r")
                elif esc_ch == "t":
                    chars.append("\t")
                elif esc_ch == "b":
                    chars.append("\b")
                elif esc_ch == "f":
                    chars.append("\f")
                elif esc_ch == "v":
                    chars.append("\v")
                elif esc_ch == "0" and not self._peek().isdigit():
                    chars.append("\0")
                elif esc_ch == "x":
                    hex_str = self.text[self.pos : self.pos + 2]
                    if len(hex_str) < 2 or not re.fullmatch(r"[0-9a-fA-F]{2}", hex_str):
                        raise JSParseError(f"Invalid \\x escape at offset {self.pos}")
                    self.pos += 2
                    chars.append(chr(int(hex_str, 16)))
                elif esc_ch == "u":
                    if self._peek() == "{":
                        end_brace = self.text.find("}", self.pos + 1)
                        if end_brace == -1:
                            raise JSParseError(f"Unterminated \\u{{...}} escape at offset {self.pos}")
                        hex_str = self.text[self.pos + 1 : end_brace]
                        if not re.fullmatch(r"[0-9a-fA-F]+", hex_str):
                            raise JSParseError(f"Invalid \\u{{...}} escape at offset {self.pos}")
                        self.pos = end_brace + 1
                        chars.append(chr(int(hex_str, 16)))
                    else:
                        hex_str = self.text[self.pos : self.pos + 4]
                        if len(hex_str) < 4 or not re.fullmatch(r"[0-9a-fA-F]{4}", hex_str):
                            raise JSParseError(f"Invalid \\u escape at offset {self.pos}")
                        self.pos += 4
                        chars.append(chr(int(hex_str, 16)))
                elif esc_ch == "\r":
                    if self._peek() == "\n":
                        self.pos += 1
                elif esc_ch in ("\n", "\u2028", "\u2029"):
                    pass
                else:
                    chars.append(esc_ch)
                continue

            if quote in ('"', "'") and ch in ("\n", "\r"):
                raise JSParseError(f"Unescaped newline in string literal at offset {self.pos}")

            chars.append(ch)
            self.pos += 1

        raise JSParseError("Unterminated string literal in JS source.")

    def _parse_identifier(self) -> str:
        start = self.pos
        if not self._eof() and (self.text[self.pos].isalpha() or self.text[self.pos] in "_$"):
            self.pos += 1
            while not self._eof() and (
                self.text[self.pos].isalnum() or self.text[self.pos] in "_$"
            ):
                self.pos += 1
            return self.text[start : self.pos]
        raise JSParseError(f"Expected identifier at offset {self.pos}")

    def _parse_number(self) -> int | float:
        m = re.match(
            r"-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?",
            self.text[self.pos :],
        )
        if not m:
            raise JSParseError(f"Invalid numeric literal at offset {self.pos}")
        raw = m.group(0)
        self.pos += len(raw)
        if "." in raw or "e" in raw or "E" in raw:
            val = float(raw)
            return int(val) if val.is_integer() else val
        return int(raw)

    def _parse_array(self) -> list[Any]:
        if self._peek() != "[":
            raise JSParseError(f"Expected '[' at offset {self.pos}")
        self.pos += 1
        items: list[Any] = []
        self._skip_ws_and_comments()
        if self._peek() == "]":
            self.pos += 1
            return items

        while not self._eof():
            self._skip_ws_and_comments()
            items.append(self._parse_value())
            self._skip_ws_and_comments()
            ch = self._peek()
            if ch == ",":
                self.pos += 1
                self._skip_ws_and_comments()
                if self._peek() == "]":
                    self.pos += 1
                    return items
            elif ch == "]":
                self.pos += 1
                return items
            else:
                raise JSParseError(f"Expected ',' or ']' in array at offset {self.pos}")

        raise JSParseError("Unterminated array literal.")

    def _parse_object(self) -> dict[str, Any]:
        if self._peek() != "{":
            raise JSParseError(f"Expected '{{' at offset {self.pos}")
        self.pos += 1
        obj: dict[str, Any] = {}
        self._skip_ws_and_comments()
        if self._peek() == "}":
            self.pos += 1
            return obj

        while not self._eof():
            self._skip_ws_and_comments()
            ch = self._peek()
            if ch in ('"', "'", "`"):
                key = self._parse_string()
            elif ch.isalpha() or ch in "_$":
                key = self._parse_identifier()
            elif ch.isdigit():
                key = str(self._parse_number())
            else:
                raise JSParseError(f"Invalid object key at offset {self.pos}: {ch!r}")

            self._skip_ws_and_comments()
            if self._peek() != ":":
                raise JSParseError(f"Expected ':' after key {key!r} at offset {self.pos}")
            self.pos += 1

            self._skip_ws_and_comments()
            obj[key] = self._parse_value()
            self._skip_ws_and_comments()

            nxt = self._peek()
            if nxt == ",":
                self.pos += 1
                self._skip_ws_and_comments()
                if self._peek() == "}":
                    self.pos += 1
                    return obj
            elif nxt == "}":
                self.pos += 1
                return obj
            else:
                raise JSParseError(f"Expected ',' or '}}' in object at offset {self.pos}")

        raise JSParseError("Unterminated object literal.")

    def _parse_value(self) -> Any:
        self._skip_ws_and_comments()
        if self._eof():
            raise JSParseError("Unexpected end of JS input while parsing value.")
        ch = self._peek()
        if ch == "{":
            return self._parse_object()
        if ch == "[":
            return self._parse_array()
        if ch in ('"', "'", "`"):
            return self._parse_string()
        if ch == "-" or ch.isdigit():
            return self._parse_number()
        if ch.isalpha() or ch in "_$":
            ident = self._parse_identifier()
            if ident == "true":
                return True
            if ident == "false":
                return False
            if ident in ("null", "undefined"):
                return None
            raise JSParseError(f"Unsupported non-literal identifier {ident!r} at offset {self.pos}")
        raise JSParseError(f"Unexpected token {ch!r} at offset {self.pos}")

    def parse_assignment_object(self, var_name: str = "PORTFOLIO_DATA") -> dict[str, Any]:
        """Find `<var_name> = { ... }` outside strings/comments and parse the object."""
        self.pos = 0
        while not self._eof():
            self._skip_ws_and_comments()
            if self._eof():
                break
            ch = self._peek()
            if ch in ('"', "'", "`"):
                self._parse_string()
                continue
            if ch.isalpha() or ch in "_$":
                ident = self._parse_identifier()
                if ident == var_name:
                    self._skip_ws_and_comments()
                    if self._peek() == "=" and self._peek(1) != "=":
                        self.pos += 1
                        self._skip_ws_and_comments()
                        parsed = self._parse_object()
                        return parsed
                continue
            self.pos += 1

        raise JSParseError(f"Could not locate assignment for {var_name} in JS source.")


def _load_via_node(profile_js_path: str) -> dict[str, Any]:
    node_bin = shutil.which("node")
    if not node_bin:
        raise RuntimeError("Node.js binary not found on PATH.")

    node_script = (
        'const fs = require("fs");'
        'const vm = require("vm");'
        'const code = fs.readFileSync(process.argv[1], "utf8");'
        'const sandbox = { window: {} };'
        'sandbox.globalThis = sandbox;'
        'sandbox.self = sandbox;'
        'vm.runInNewContext(code, sandbox, { timeout: 2000 });'
        'if (!sandbox.window || !sandbox.window.PORTFOLIO_DATA) {'
        '  throw new Error("window.PORTFOLIO_DATA was not defined.");'
        '}'
        'process.stdout.write(JSON.stringify(sandbox.window.PORTFOLIO_DATA));'
    )

    proc = subprocess.run(
        [node_bin, "-e", node_script, profile_js_path],
        capture_output=True,
        text=True,
        timeout=5,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Node VM evaluation failed: {proc.stderr.strip()}")
    data = json.loads(proc.stdout)
    if not isinstance(data, dict):
        raise RuntimeError("Parsed PORTFOLIO_DATA is not a JSON object.")
    return data


def _load_via_python(profile_js_path: str) -> dict[str, Any]:
    with open(profile_js_path, "r", encoding="utf-8") as fh:
        source = fh.read()
    return JSObjectParser(source).parse_assignment_object("PORTFOLIO_DATA")


def load_profile_data(
    profile_js_path: str,
    parser: str = "auto",
    force_python: bool = False,
) -> dict[str, Any]:
    """Load PORTFOLIO_DATA from `data/profile.js` via Node VM (primary) or Python fallback."""
    mode = "python" if force_python else parser
    if mode not in ("auto", "node", "python"):
        raise ValueError(f"Invalid parser mode {mode!r}; expected 'auto', 'node', or 'python'.")

    if mode == "python":
        return _load_via_python(profile_js_path)

    if mode == "node":
        return _load_via_node(profile_js_path)

    try:
        return _load_via_node(profile_js_path)
    except Exception:
        return _load_via_python(profile_js_path)


def _esc(value: Any) -> str:
    return xml_escape(str(value or ""))


def _esc_attr(value: Any) -> str:
    return xml_escape(str(value or ""), {'"': "&quot;", "'": "&apos;"})


def _strip_url_label(url: str) -> str:
    return re.sub(r"^https?://(?:www\.)?", "", str(url or "")).rstrip("/")


def build_resume_pdf(
    output_path: str,
    profile_js_path: str | None = None,
    parser: str = "auto",
) -> None:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        BaseDocTemplate,
        Frame,
        HRFlowable,
        ListFlowable,
        ListItem,
        PageTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
    )

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    resolved_input = profile_js_path or os.path.join(repo_root, "data", "profile.js")
    data = load_profile_data(resolved_input, parser=parser)

    meta = data.get("meta") or {}
    summary = data.get("summary") or {}
    skills = data.get("skillsCategories") or data.get("skills") or []
    experiences = data.get("experience") or []
    recognition = data.get("recognitionAndCommunity") or data.get("recognition") or []
    education = data.get("education") or []

    full_name = str(meta.get("name") or "").strip()
    role_title = str(meta.get("title") or "").strip()
    primary_role = str((experiences[0].get("role") if experiences else "") or role_title).strip()
    doc_title = f"{full_name} - {primary_role} Resume" if full_name and primary_role else "Resume"

    out_dir = os.path.dirname(os.path.abspath(output_path))
    os.makedirs(out_dir, exist_ok=True)

    page_w, page_h = letter  # 612 x 792 pts
    margin_lr = 0.45 * inch
    margin_tb = 0.32 * inch
    avail_w = page_w - 2 * margin_lr  # 547.2 pt
    avail_h = page_h - 2 * margin_tb  # 745.92 pt

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
        fontSize=18.5,
        leading=21.0,
        textColor=slate_900,
        alignment=1,
        spaceAfter=1,
    )

    subtitle_style = ParagraphStyle(
        "ResumeSubtitle",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.6,
        leading=12.0,
        textColor=emerald_dark,
        alignment=1,
        spaceAfter=2,
    )

    contact_style = ParagraphStyle(
        "ResumeContact",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8.2,
        leading=10.6,
        textColor=slate_700,
        alignment=1,
        spaceAfter=3.5,
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.8,
        leading=10.8,
        textColor=emerald_dark,
        spaceBefore=3.8,
        spaceAfter=1.2,
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8.3,
        leading=10.6,
        textColor=slate_700,
    )

    role_left_style = ParagraphStyle(
        "RoleLeft",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.95,
        leading=11.0,
        textColor=slate_900,
    )

    role_right_style = ParagraphStyle(
        "RoleRight",
        parent=base_styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.25,
        leading=11.0,
        textColor=slate_500,
        alignment=2,
    )

    bullet_style = ParagraphStyle(
        "BulletItem",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8.15,
        leading=10.2,
        textColor=slate_700,
    )

    story: list[Any] = []

    # HEADER
    if full_name:
        story.append(Paragraph(_esc(full_name.upper()), name_style))
    if role_title:
        story.append(Paragraph(_esc(role_title), subtitle_style))

    loc = str(meta.get("location") or "").strip()
    avail = str(meta.get("availability") or "").strip()
    if loc and avail:
        loc_display = loc if avail.lower() in loc.lower() else f"{loc} ({avail})"
    else:
        loc_display = loc or avail

    contact_parts: list[str] = []
    if loc_display:
        contact_parts.append(_esc(loc_display))

    website_url = str(meta.get("websiteUrl") or "").strip()
    domain = str(meta.get("domain") or "").strip() or _strip_url_label(website_url)
    if domain and website_url:
        contact_parts.append(
            f"<a href='{_esc_attr(website_url)}' color='#059669'>{_esc(domain)}</a>"
        )
    elif domain:
        contact_parts.append(_esc(domain))

    email = str(meta.get("email") or "").strip()
    if email:
        contact_parts.append(
            f"<a href='mailto:{_esc_attr(email)}' color='#059669'>{_esc(email)}</a>"
        )

    linkedin_url = str(meta.get("linkedinUrl") or "").strip()
    linkedin_label = str(meta.get("linkedinLabel") or "").strip() or _strip_url_label(linkedin_url)
    if linkedin_label and linkedin_url:
        contact_parts.append(
            f"<a href='{_esc_attr(linkedin_url)}' color='#059669'>{_esc(linkedin_label)}</a>"
        )
    elif linkedin_label:
        contact_parts.append(_esc(linkedin_label))

    github_url = str(meta.get("githubUrl") or "").strip()
    github_label = (
        str(meta.get("githubLabel") or meta.get("githubHandle") or "").strip()
        or _strip_url_label(github_url)
    )
    if github_label and github_url:
        contact_parts.append(
            f"<a href='{_esc_attr(github_url)}' color='#059669'>{_esc(github_label)}</a>"
        )
    elif github_label:
        contact_parts.append(_esc(github_label))

    if contact_parts:
        story.append(Paragraph(" &nbsp;|&nbsp; ".join(contact_parts), contact_style))

    story.append(
        HRFlowable(
            width="100%",
            thickness=1.4,
            color=emerald_accent,
            spaceBefore=1,
            spaceAfter=4,
        )
    )

    def add_section_header(title: str) -> None:
        story.append(Paragraph(_esc(title.upper()), section_heading))
        story.append(
            HRFlowable(
                width="100%",
                thickness=0.5,
                color=rule_light,
                spaceBefore=0,
                spaceAfter=3.0,
            )
        )

    # PROFESSIONAL SUMMARY
    resume_summary = str(summary.get("resumeSummary") or "").strip()
    if resume_summary:
        add_section_header("Professional Summary")
        story.append(Paragraph(_esc(resume_summary), body_style))
        story.append(Spacer(1, 2.2))

    # CORE TECHNICAL COMPETENCIES
    if skills:
        add_section_header("Core Technical Competencies")
        skills_data = []
        for cat in skills:
            cat_name = str(cat.get("category") or "").strip()
            cat_items = [str(item).strip() for item in (cat.get("items") or []) if str(item).strip()]
            skills_data.append(
                [
                    Paragraph(f"<b>{_esc(cat_name)}:</b>", bullet_style),
                    Paragraph(_esc(", ".join(cat_items)), bullet_style),
                ]
            )
        label_col_w = 1.72 * inch
        skills_table = Table(skills_data, colWidths=[label_col_w, avail_w - label_col_w])
        skills_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (0, -1), 4),
                    ("RIGHTPADDING", (1, 0), (1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0.9),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0.9),
                ]
            )
        )
        story.append(skills_table)
        story.append(Spacer(1, 2.2))

    # PROFESSIONAL EXPERIENCE
    if experiences:
        add_section_header("Professional Experience")
        date_col_w = 1.35 * inch
        for exp in experiences:
            role = str(exp.get("role") or "").strip()
            company = str(exp.get("company") or "").strip()
            exp_loc = str(exp.get("location") or "").strip()
            period = str(exp.get("period") or "").strip()
            bullets = [str(b).strip() for b in (exp.get("bullets") or []) if str(b).strip()]

            org_display = f"{company} · {exp_loc}" if company and exp_loc else (company or exp_loc)
            left_html = (
                f"{_esc(role)} <font color='#059669'>— {_esc(org_display)}</font>"
                if org_display
                else _esc(role)
            )

            header_tbl = Table(
                [
                    [
                        Paragraph(left_html, role_left_style),
                        Paragraph(_esc(period), role_right_style),
                    ]
                ],
                colWidths=[avail_w - date_col_w, date_col_w],
            )
            header_tbl.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "BASELINE"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("TOPPADDING", (0, 0), (-1, -1), 1.6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 0.8),
                    ]
                )
            )
            story.append(header_tbl)

            if bullets:
                bullet_items = [
                    ListItem(
                        Paragraph(_esc(b), bullet_style),
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
                        spaceAfter=1.8,
                    )
                )

    # COMMUNITY LEADERSHIP & RECOGNITION
    if recognition:
        add_section_header("Community Leadership & Recognition")
        rec_items = []
        for item in recognition:
            r_title = str(item.get("title") or "").strip()
            r_org = str(item.get("org") or "").strip()
            r_period = str(item.get("period") or "").strip()
            r_desc = str(item.get("description") or "").strip()

            meta_parts = [p for p in (r_org, r_period) if p]
            if meta_parts:
                rec_html = (
                    f"<b>{_esc(r_title)}</b> — <i>{_esc(', '.join(meta_parts))}</i>: {_esc(r_desc)}"
                )
            else:
                rec_html = f"<b>{_esc(r_title)}</b>: {_esc(r_desc)}"

            rec_items.append(
                ListItem(
                    Paragraph(rec_html, bullet_style),
                    leftIndent=10,
                    bulletColor=emerald_accent,
                    bulletFontName="Helvetica",
                    bulletFontSize=7,
                )
            )

        story.append(
            ListFlowable(
                rec_items,
                bulletType="bullet",
                start="bulletchar",
                leftIndent=8,
                spaceBefore=0,
                spaceAfter=1.8,
            )
        )

    # EDUCATION
    if education:
        add_section_header("Education")
        for ed in education:
            inst = str(ed.get("institution") or "").strip()
            ed_loc = str(ed.get("location") or "").strip()
            cred = str(ed.get("credential") or "").strip()
            detail = str(ed.get("detail") or "").strip()

            parts = [f"<b>{_esc(inst)}</b>" if inst else ""]
            if ed_loc:
                parts[0] = f"{parts[0]} ({_esc(ed_loc)})"
            tail = " · ".join(_esc(x) for x in (cred, detail) if x)
            ed_html = f"{parts[0]} — {tail}" if tail and parts[0] else (parts[0] or tail)
            story.append(Paragraph(ed_html, bullet_style))

    # Build safely to a temporary file in the destination directory and enforce 1 page
    fd, tmp_pdf_path = tempfile.mkstemp(prefix=".resume_tmp_", suffix=".pdf", dir=out_dir)
    os.close(fd)
    try:
        doc = BaseDocTemplate(
            tmp_pdf_path,
            pagesize=letter,
            leftMargin=margin_lr,
            rightMargin=margin_lr,
            topMargin=margin_tb,
            bottomMargin=margin_tb,
            title=doc_title,
            author=full_name,
        )
        frame = Frame(
            margin_lr,
            margin_tb,
            avail_w,
            avail_h,
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
            id="resume_frame",
        )
        doc.addPageTemplates([PageTemplate(id="SinglePage", frames=[frame])])
        doc.build(story)

        if doc.page != 1:
            raise RuntimeError(
                f"Resume PDF overflowed single-page ATS constraint: generated {doc.page} pages."
            )

        os.replace(tmp_pdf_path, output_path)
    finally:
        if os.path.exists(tmp_pdf_path):
            os.remove(tmp_pdf_path)

    print(f"Successfully generated 1-page PDF resume at: {output_path}")


def main() -> None:
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_input = os.path.join(repo_root, "data", "profile.js")
    default_output = os.path.join(repo_root, "assets", "Jacob_Davis_Resume.pdf")

    argp = argparse.ArgumentParser(
        description="Generate 1-page ATS PDF resume dynamically from data/profile.js."
    )
    argp.add_argument(
        "--input",
        default=default_input,
        help="Path to data/profile.js (default: <repo>/data/profile.js)",
    )
    argp.add_argument(
        "--output",
        default=default_output,
        help="Destination PDF path (default: <repo>/assets/Jacob_Davis_Resume.pdf)",
    )
    argp.add_argument(
        "--parser",
        choices=["auto", "node", "python"],
        default="auto",
        help="Parser strategy for reading data/profile.js (default: auto)",
    )
    args = argp.parse_args()
    build_resume_pdf(args.output, profile_js_path=args.input, parser=args.parser)


if __name__ == "__main__":
    main()
