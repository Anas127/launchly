from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from datetime import date


def generate_pdf(text, filename, user_info=None):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        topMargin=0,
        bottomMargin=20 * mm,
        leftMargin=0,
        rightMargin=0,
    )

    elements = []

    name = f"{user_info.get('name', '')} {user_info.get('last_name', '')}".strip() if user_info else "Applicant"
    email = user_info.get("email", "") if user_info else ""
    phone = user_info.get("phone", "") if user_info else ""
    location = user_info.get("location", "") if user_info else ""
    role = user_info.get("target_role", "") if user_info else ""

    header_data = [[
        Paragraph(f'<font size=18><b>{name}</b></font><br/><font size=9 color="#888888">{email} &nbsp;·&nbsp; {phone} &nbsp;·&nbsp; {location}</font>',
                  ParagraphStyle("h", fontName="Helvetica", textColor=colors.white, leading=22)),
        Paragraph(f'<font size=9 color="#aaaaaa">{date.today().strftime("%B %d, %Y")}<br/>{role}</font>',
                  ParagraphStyle("hr", fontName="Helvetica", textColor=colors.white, alignment=2, leading=16)),
    ]]

    header_table = Table(header_data, colWidths=[130 * mm, 60 * mm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111111")),
        ("TOPPADDING", (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
        ("LEFTPADDING", (0, 0), (0, -1), 20),
        ("RIGHTPADDING", (-1, 0), (-1, -1), 20),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10 * mm))

    elements.append(HRFlowable(width="85%", thickness=1, color=colors.HexColor("#111111"), spaceAfter=8 * mm, hAlign="LEFT"))

    body_style = ParagraphStyle(
        "body",
        fontName="Times-Roman",
        fontSize=11,
        leading=18,
        textColor=colors.HexColor("#222222"),
        leftIndent=20 * mm,
        rightIndent=20 * mm,
        spaceAfter=8,
    )

    lines = text.split("\n")
    body_lines = []
    skipping = True

    for line in lines:
        if skipping:
            if line.strip().startswith("Dear"):
                skipping = False
        if not skipping:
            body_lines.append(line)

    for para in body_lines:
        if para.strip():
            elements.append(Paragraph(para.strip(), body_style))
        else:
            elements.append(Spacer(1, 4 * mm))

    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#bbbbbb"))
        canvas.drawString(20 * mm, 12 * mm, "Launchly · AI Job Research")
        canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
    return filename