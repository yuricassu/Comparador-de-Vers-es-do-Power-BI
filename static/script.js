// Atualização de nomes e feedback (sem alterações)
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

handleFileInput(document.getElementById("currentFile"), document.getElementById("currentFileName"), document.getElementById("currentFileFeedback"));
handleFileInput(document.getElementById("previousFile"), document.getElementById("previousFileName"), document.getElementById("previousFileFeedback"));

// Drag & drop (sem alterações)
function enableDragDrop(dropContainer, fileInput, fileNameSpan, feedbackSpan) {
    dropContainer.addEventListener("dragover", e => { e.preventDefault(); dropContainer.classList.add("dragover"); });
    dropContainer.addEventListener("dragleave", e => { dropContainer.classList.remove("dragover"); });
    dropContainer.addEventListener("drop", e => {
        e.preventDefault();
        dropContainer.classList.remove("dragover");
        if(e.dataTransfer.files.length > 0){
            fileInput.files = e.dataTransfer.files;
            fileNameSpan.textContent = fileInput.files[0].name;
            feedbackSpan.textContent = "Arquivo carregado com sucesso!";
            feedbackSpan.style.color = "#00ff00";
        }
    });
}

enableDragDrop(document.getElementById("dropCurrent"), document.getElementById("currentFile"), document.getElementById("currentFileName"), document.getElementById("currentFileFeedback"));
enableDragDrop(document.getElementById("dropPrevious"), document.getElementById("previousFile"), document.getElementById("previousFileName"), document.getElementById("previousFileFeedback"));

// Barra de progresso e checkmark + render de resultados
const form = document.getElementById("uploadForm");
form.addEventListener("submit", function(e) {
    e.preventDefault();

    const progressBar = document.getElementById("progressBar");
    const progress = document.getElementById("progress");
    const checkmark = document.getElementById("analysisComplete");
    const container = document.querySelector(".container");

    progressBar.style.display = "block";
    checkmark.style.display = "none";

    let width = 0;
    const interval = setInterval(() => { if(width >= 95) clearInterval(interval); else width += 2; progress.style.width = width + "%"; }, 50);

    const formData = new FormData(form);

    fetch("/analisar", { method: "POST", body: formData })
        .then(res => res.json())
        .then(data => {
            clearInterval(interval);
            progress.style.width = "100%";
            checkmark.style.display = "block";

            // Remove análises antigas
            const oldReports = document.querySelectorAll(".cards, .report-section, .download");
            oldReports.forEach(el => el.remove());

            if(data.report){
                // Criar cards
                const cardsDiv = document.createElement("div");
                cardsDiv.className = "cards";

                const addedCard = document.createElement("div");
                addedCard.className = "card added";
                addedCard.innerHTML = `<h3>✔ Adicionados</h3><p>${data.report.added.length}</p>`;
                const removedCard = document.createElement("div");
                removedCard.className = "card removed";
                removedCard.innerHTML = `<h3>✖ Removidos</h3><p>${data.report.removed.length}</p>`;
                const modifiedCard = document.createElement("div");
                modifiedCard.className = "card modified";
                modifiedCard.innerHTML = `<h3>⚠ Modificados</h3><p>${data.report.modified.length}</p>`;

                cardsDiv.appendChild(addedCard);
                cardsDiv.appendChild(removedCard);
                cardsDiv.appendChild(modifiedCard);
                container.appendChild(cardsDiv);

                // Criar relatório detalhado
                const reportSection = document.createElement("div");
                reportSection.className = "report-section";

                let html = `<h2>🔍 Relatório Detalhado</h2>`;

                // Adicionados
                html += `<h3>Adicionados</h3><ul>`;
                if(data.report.added.length){
                    data.report.added.forEach(item => html += `<li>${item}</li>`);
                } else html += "<li>Nenhum</li>";
                html += "</ul>";

                // Removidos
                html += `<h3>Removidos</h3><ul>`;
                if(data.report.removed.length){
                    data.report.removed.forEach(item => html += `<li>${item}</li>`);
                } else html += "<li>Nenhum</li>";
                html += "</ul>";

                // Modificados
                html += `<h3>Modificados (Comparação Visual)</h3>`;
                if(data.report.modified.length){
                    html += `<div class="comparison-table"><div class="table-header"><div>Tipo</div><div>Tabela</div><div>Nome</div><div>Alteração</div><div>Antes</div><div>Depois</div></div>`;
                    data.report.modified.forEach(m => {
                        html += `<div class="table-row">
                            <div>${m.tipo}</div>
                            <div>${m.tabela}</div>
                            <div>${m.nome}</div>
                            <div>${m.alteracao_tipo}</div>
                            <div class="old-value" title="${m.valor_antigo}">${m.valor_antigo}</div>
                            <div class="new-value" title="${m.valor_novo}">${m.valor_novo}</div>
                        </div>`;
                    });
                    html += `</div>`;
                } else html += "<p>Nenhum</p>";

                reportSection.innerHTML = html;
                container.appendChild(reportSection);

                // Criar botão PDF
                const downloadBtn = document.createElement("a");
                downloadBtn.className = "download";
                downloadBtn.href = "#";
                downloadBtn.textContent = "📥 Baixar PDF";
                downloadBtn.addEventListener("click", () => {
                    fetch("/baixar_pdf", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({report: data.report})
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
                container.appendChild(downloadBtn);
            }
        })
        .catch(err => {
            clearInterval(interval);
            progress.style.width = "0%";
            alert("Erro ao analisar: " + err);
        });
});
