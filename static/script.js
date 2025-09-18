// Atualização de nomes e feedback
function handleFileInput(fileInput, fileNameSpan, feedbackSpan) {
    fileInput.addEventListener("change", function() {
        if (this.files.length > 0) {
            fileNameSpan.textContent = this.files[0].name;
            feedbackSpan.textContent = "Arquivo carregado com sucesso!";
            feedbackSpan.style.color = "#00ff00";
        } else {
            fileNameSpan.textContent = "Nenhum arquivo selecionado";
            feedbackSpan.textContent = "";
        }
    });
}

handleFileInput(
    document.getElementById("currentFile"),
    document.getElementById("currentFileName"),
    document.getElementById("currentFileFeedback")
);

handleFileInput(
    document.getElementById("previousFile"),
    document.getElementById("previousFileName"),
    document.getElementById("previousFileFeedback")
);

// Drag & drop
function enableDragDrop(dropContainer, fileInput, fileNameSpan, feedbackSpan) {
    dropContainer.addEventListener("dragover", e => {
        e.preventDefault();
        dropContainer.classList.add("dragover");
    });
    dropContainer.addEventListener("dragleave", e => {
        dropContainer.classList.remove("dragover");
    });
    dropContainer.addEventListener("drop", e => {
        e.preventDefault();
        dropContainer.classList.remove("dragover");
        if(e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            fileNameSpan.textContent = fileInput.files[0].name;
            feedbackSpan.textContent = "Arquivo carregado com sucesso!";
            feedbackSpan.style.color = "#00ff00";
        }
    });
}

enableDragDrop(
    document.getElementById("dropCurrent"),
    document.getElementById("currentFile"),
    document.getElementById("currentFileName"),
    document.getElementById("currentFileFeedback")
);

enableDragDrop(
    document.getElementById("dropPrevious"),
    document.getElementById("previousFile"),
    document.getElementById("previousFileName"),
    document.getElementById("previousFileFeedback")
);

// Barra de progresso, checkmark e envio AJAX
const form = document.getElementById("uploadForm");
form.addEventListener("submit", function(e) {
    e.preventDefault(); // evita reload
    const progressBar = document.getElementById("progressBar");
    const progress = document.getElementById("progress");
    const checkmark = document.getElementById("analysisComplete");
    progressBar.style.display = "block";
    checkmark.style.display = "none";

    let width = 0;
    const interval = setInterval(() => {
        if (width >= 95) clearInterval(interval);
        else width += 2;
        progress.style.width = width + "%";
    }, 50);

    const formData = new FormData(form);
    fetch("/analisar", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        progress.style.width = "100%";
        checkmark.style.display = "block";

        setTimeout(() => {
            checkmark.style.display = "none";
        }, 2000);

        // Remove análises anteriores
        document.querySelectorAll(".cards, .report-section, .download").forEach(el => el.remove());

        // Renderiza cards
        if (data.report) {
            const summary = {
                Adicionados: data.report.added.length,
                Removidos: data.report.removed.length,
                Modificados: data.report.modified.length
            };

            const cardsContainer = document.createElement("div");
            cardsContainer.className = "cards";

            for (const key in summary) {
                const card = document.createElement("div");
                card.className = "card " + (key === "Adicionados" ? "added" : key === "Removidos" ? "removed" : "modified");
                card.innerHTML = `<h3>${key === "Adicionados" ? "✔ Adicionados" : key === "Removidos" ? "✖ Removidos" : "⚠ Modificados"}</h3>
                                  <p>${summary[key]}</p>`;
                cardsContainer.appendChild(card);
            }
            form.parentNode.insertBefore(cardsContainer, form.nextSibling);

            // Renderiza relatório
            const reportSection = document.createElement("div");
            reportSection.className = "report-section";

            reportSection.innerHTML = `<h2>🔍 Relatório Detalhado</h2>
            <h3>Adicionados</h3>
            <ul>${data.report.added.map(item => `<li>${item}</li>`).join("") || "<li>Nenhum</li>"}</ul>
            <h3>Removidos</h3>
            <ul>${data.report.removed.map(item => `<li>${item}</li>`).join("") || "<li>Nenhum</li>"}</ul>
            <h3>Modificados (Comparação Visual)</h3>
            ${data.report.modified.length ? `<div class="comparison-table">
                <div class="table-header">
                    <div>Tipo</div><div>Tabela</div><div>Nome</div><div>Alteração</div><div>Antes</div><div>Depois</div>
                </div>
                ${data.report.modified.map(m => `<div class="table-row">
                    <div>${m.tipo}</div><div>${m.tabela}</div><div>${m.nome}</div><div>${m.alteracao_tipo}</div>
                    <div class="old-value" title="${m.valor_antigo}">${m.valor_antigo}</div>
                    <div class="new-value" title="${m.valor_novo}">${m.valor_novo}</div>
                </div>`).join("")}
            </div>` : "<p>Nenhum</p>"}`;

            form.parentNode.insertBefore(reportSection, form.nextSibling);

            // Botão PDF
            const downloadBtn = document.createElement("a");
            downloadBtn.className = "download";
            downloadBtn.href = "#";
            downloadBtn.textContent = "📥 Baixar PDF";
            downloadBtn.addEventListener("click", function(ev) {
                ev.preventDefault();
                fetch("/baixar_pdf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ report: data.report })
                })
                .then(resp => resp.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "comparador.pdf";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                });
            });
            form.parentNode.insertBefore(downloadBtn, reportSection.nextSibling);
        }
    })
    .catch(err => {
        console.error(err);
        progressBar.style.display = "none";
    });
});
