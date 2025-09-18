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
    e.preventDefault(); // previne recarregamento da página

    const progressBar = document.getElementById("progressBar");
    const progress = document.getElementById("progress");
    const checkmark = document.getElementById("analysisComplete");

    progressBar.style.display = "block";
    checkmark.style.display = "none";
    progress.style.width = "0%";

    // Inicia a animação da barra de progresso
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 95) clearInterval(interval);
        else width += 2;
        progress.style.width = width + "%";
    }, 50);

    // Prepara os arquivos para envio
    const formData = new FormData(form);

    fetch("/analisar", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        clearInterval(interval);
        progress.style.width = "100%";

        // Exibe o checkmark
        checkmark.style.display = "block";

        // Remove checkmark e barra após 2s
        setTimeout(() => {
            checkmark.style.display = "none";
            progressBar.style.display = "none";
        }, 2000);

        // Renderiza os cards e relatório dinamicamente
        renderReport(data.report);
    })
    .catch(err => {
        console.error(err);
        checkmark.style.display = "none";
        progressBar.style.display = "none";
        alert("Ocorreu um erro ao analisar os arquivos.");
    });
});

// Função para criar cards e relatório
function renderReport(report) {
    // Remove conteúdo anterior se existir
    const oldCards = document.querySelector(".cards");
    if (oldCards) oldCards.remove();
    const oldReport = document.querySelector(".report-section");
    if (oldReport) oldReport.remove();
    const oldDownload = document.querySelector(".download");
    if (oldDownload) oldDownload.remove();

    if (!report) return;

    const container = document.querySelector(".container");

    // Cards
    const cardsDiv = document.createElement("div");
    cardsDiv.className = "cards";

    const addedCard = document.createElement("div");
    addedCard.className = "card added";
    addedCard.innerHTML = `<h3>✔ Adicionados</h3><p>${report.added.length}</p>`;
    cardsDiv.appendChild(addedCard);

    const removedCard = document.createElement("div");
    removedCard.className = "card removed";
    removedCard.innerHTML = `<h3>✖ Removidos</h3><p>${report.removed.length}</p>`;
    cardsDiv.appendChild(removedCard);

    const modifiedCard = document.createElement("div");
    modifiedCard.className = "card modified";
    modifiedCard.innerHTML = `<h3>⚠ Modificados</h3><p>${report.modified.length}</p>`;
    cardsDiv.appendChild(modifiedCard);

    container.appendChild(cardsDiv);

    // Relatório detalhado
    const reportDiv = document.createElement("div");
    reportDiv.className = "report-section";
    reportDiv.innerHTML = `<h2>🔍 Relatório Detalhado</h2>`;

    // Adicionados
    const addedList = document.createElement("ul");
    report.added.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        addedList.appendChild(li);
    });
    if(report.added.length === 0) addedList.innerHTML = "<li>Nenhum</li>";
    reportDiv.innerHTML += "<h3>Adicionados</h3>";
    reportDiv.appendChild(addedList);

    // Removidos
    const removedList = document.createElement("ul");
    report.removed.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        removedList.appendChild(li);
    });
    if(report.removed.length === 0) removedList.innerHTML = "<li>Nenhum</li>";
    reportDiv.innerHTML += "<h3>Removidos</h3>";
    reportDiv.appendChild(removedList);

    // Modificados
    reportDiv.innerHTML += "<h3>Modificados (Comparação Visual)</h3>";
    if(report.modified.length > 0){
        const tableDiv = document.createElement("div");
        tableDiv.className = "comparison-table";

        const header = document.createElement("div");
        header.className = "table-header";
        header.innerHTML = "<div>Tipo</div><div>Tabela</div><div>Nome</div><div>Alteração</div><div>Antes</div><div>Depois</div>";
        tableDiv.appendChild(header);

        report.modified.forEach(m => {
            const row = document.createElement("div");
            row.className = "table-row";
            row.innerHTML = `<div>${m.tipo}</div><div>${m.tabela}</div><div>${m.nome}</div><div>${m.alteracao_tipo}</div>` +
                            `<div class="old-value" title="${m.valor_antigo}">${m.valor_antigo}</div>` +
                            `<div class="new-value" title="${m.valor_novo}">${m.valor_novo}</div>`;
            tableDiv.appendChild(row);
        });

        reportDiv.appendChild(tableDiv);
    } else {
        reportDiv.innerHTML += "<p>Nenhum</p>";
    }

    container.appendChild(reportDiv);

    // Botão de download PDF
    const downloadBtn = document.createElement("a");
    downloadBtn.className = "download";
    downloadBtn.textContent = "📥 Baixar PDF";
    downloadBtn.href = "#";
    downloadBtn.addEventListener("click", () => {
        fetch("/baixar_pdf", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({report})
        })
        .then(res => res.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "comparador.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        });
    });

    container.appendChild(downloadBtn);
}
