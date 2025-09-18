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

// Barra de progresso e checkmark (AJAX)
const form = document.getElementById("uploadForm");
form.addEventListener("submit", function(e) {
    e.preventDefault(); // impede o reload da página

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
        clearInterval(interval);
        progress.style.width = "100%";
        checkmark.style.display = "block";
        console.log("Resultado da análise:", data);
        // Aqui você pode atualizar cards ou relatório via JS se quiser
    })
    .catch(err => {
        clearInterval(interval);
        progress.style.width = "0%";
        alert("Erro ao analisar: " + err);
    });
});
