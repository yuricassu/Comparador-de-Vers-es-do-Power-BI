import os
import zipfile
import json
from io import BytesIO
from flask import Flask, render_template, request, send_file, jsonify
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

app = Flask(__name__)

# -----------------------------
# Função para extrair DataModel do PBIT
# -----------------------------
def carregar_data_model(file_storage):
    with zipfile.ZipFile(file_storage, "r") as z:
        data_model = json.loads(z.read("DataModelSchema"))
    return data_model.get("model", {})

# -----------------------------
# Função para comparar modelos
# -----------------------------
def comparar_modelos(old_model, new_model):
    report = {"added": [], "removed": [], "modified": []}
    old_tables = {t["name"]: t for t in old_model.get("tables", [])}
    new_tables = {t["name"]: t for t in new_model.get("tables", [])}

    added_tables = set(new_tables) - set(old_tables)
    removed_tables = set(old_tables) - set(new_tables)
    report["added"].extend([f"Tabela adicionada: {t}" for t in added_tables])
    report["removed"].extend([f"Tabela removida: {t}" for t in removed_tables])

    for tname in set(old_tables) & set(new_tables):
        old_t, new_t = old_tables[tname], new_tables[tname]

        old_cols = {c["name"]: c for c in old_t.get("columns", [])}
        new_cols = {c["name"]: c for c in new_t.get("columns", [])}

        added_cols = set(new_cols) - set(old_cols)
        removed_cols = set(old_cols) - set(new_cols)
        report["added"].extend([f"Coluna adicionada em {tname}: {c}" for c in added_cols])
        report["removed"].extend([f"Coluna removida em {tname}: {c}" for c in removed_cols])

        for cname in set(old_cols) & set(new_cols):
            old_c, new_c = old_cols[cname], new_cols[cname]
            if old_c.get("description","") != new_c.get("description",""):
                report["modified"].append({
                    "tipo": "Coluna",
                    "tabela": tname,
                    "nome": cname,
                    "alteracao_tipo": "descrição",
                    "valor_antigo": old_c.get("description",""),
                    "valor_novo": new_c.get("description","")
                })
            if old_c.get("dataType","") != new_c.get("dataType",""):
                report["modified"].append({
                    "tipo": "Coluna",
                    "tabela": tname,
                    "nome": cname,
                    "alteracao_tipo": "tipo",
                    "valor_antigo": old_c.get("dataType",""),
                    "valor_novo": new_c.get("dataType","")
                })

        old_measures = {m["name"]: m for m in old_t.get("measures", [])}
        new_measures = {m["name"]: m for m in new_t.get("measures", [])}

        added_measures = set(new_measures) - set(old_measures)
        removed_measures = set(old_measures) - set(new_measures)
        report["added"].extend([f"Medida adicionada em {tname}: {m}" for m in added_measures])
        report["removed"].extend([f"Medida removida em {tname}: {m}" for m in removed_measures])

        for mname in set(old_measures) & set(new_measures):
            old_m, new_m = old_measures[mname], new_measures[mname]
            if old_m.get("expression","") != new_m.get("expression",""):
                report["modified"].append({
                    "tipo": "Medida",
                    "tabela": tname,
                    "nome": mname,
                    "alteracao_tipo": "DAX",
                    "valor_antigo": old_m.get("expression",""),
                    "valor_novo": new_m.get("expression","")
                })
            if old_m.get("description","") != new_m.get("description",""):
                report["modified"].append({
                    "tipo": "Medida",
                    "tabela": tname,
                    "nome": mname,
                    "alteracao_tipo": "descrição",
                    "valor_antigo": old_m.get("description",""),
                    "valor_novo": new_m.get("description","")
                })

    return report

# -----------------------------
# Função para gerar PDF
# -----------------------------
def gerar_pdf(report):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle('title', parent=styles['Title'], fontSize=20, textColor=colors.darkblue)
    added_style = ParagraphStyle('added', parent=styles['Heading2'], textColor=colors.green)
    removed_style = ParagraphStyle('removed', parent=styles['Heading2'], textColor=colors.red)
    modified_style = ParagraphStyle('modified', parent=styles['Heading2'], textColor=colors.orange)
    normal_style = ParagraphStyle('normal', parent=styles['Normal'], textColor=colors.black)

    elements.append(Paragraph("📊 Comparador de Versões de Modelos Power BI", title_style))
    elements.append(Spacer(1,12))
    elements.append(Paragraph("📈 Resumo de Alterações", title_style))
    elements.append(Paragraph(f"Adicionados: {len(report['added'])}", normal_style))
    elements.append(Paragraph(f"Removidos: {len(report['removed'])}", normal_style))
    elements.append(Paragraph(f"Modificados: {len(report['modified'])}", normal_style))
    elements.append(Spacer(1,12))

    elements.append(Paragraph("🔍 Relatório de Alterações Detalhado", title_style))

    elements.append(Paragraph("Adicionados", added_style))
    if report["added"]:
        for item in report["added"]:
            elements.append(Paragraph(f"- {item}", normal_style))
    else:
        elements.append(Paragraph("Nenhum", normal_style))
    elements.append(Spacer(1,6))

    elements.append(Paragraph("Removidos", removed_style))
    if report["removed"]:
        for item in report["removed"]:
            elements.append(Paragraph(f"- {item}", normal_style))
    else:
        elements.append(Paragraph("Nenhum", normal_style))
    elements.append(Spacer(1,6))

    elements.append(Paragraph("Modificados", modified_style))
    if report["modified"]:
        for m in report["modified"]:
            old_val = str(m.get("valor_antigo","")).replace("\n","<br/>")
            new_val = str(m.get("valor_novo","")).replace("\n","<br/>")
            texto = f"- {m.get('tipo','')} '{m.get('nome','')}' na tabela '{m.get('tabela','')}' alterado em {m.get('alteracao_tipo','')}:<br/>" \
                    f"<b>Antes:</b> {old_val}<br/><b>Depois:</b> {new_val}"
            elements.append(Paragraph(texto, normal_style))
    else:
        elements.append(Paragraph("Nenhum", normal_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer

# -----------------------------
# Rotas Flask
# -----------------------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analisar", methods=["POST"])
def analisar():
    if "pbit_file" not in request.files:
        return jsonify({"error": "Nenhum arquivo PBIT atual enviado"}), 400
    
    new_file = request.files["pbit_file"]
    old_file = request.files.get("previous_pbit_file")
    
    # Validate file extensions
    if new_file and not new_file.filename.lower().endswith('.pbit'):
        return jsonify({"error": "Arquivo atual deve ser um arquivo .pbit"}), 400
    
    if old_file and not old_file.filename.lower().endswith('.pbit'):
        return jsonify({"error": "Arquivo anterior deve ser um arquivo .pbit"}), 400

    new_model = carregar_data_model(new_file)
    report = None

    if old_file:
        old_model = carregar_data_model(old_file)
        report = comparar_modelos(old_model, new_model)

    return jsonify({"report": report})

@app.route("/baixar_pdf", methods=["POST"])
def baixar_pdf():
    data = request.get_json()
    report = data.get("report")
    pdf_buffer = gerar_pdf(report)
    return send_file(pdf_buffer, as_attachment=True, download_name="comparador.pdf", mimetype="application/pdf")

# -----------------------------
# Run Flask
# -----------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
