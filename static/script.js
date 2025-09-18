// Seleciona elementos
const analyzeBtn = document.getElementById("analyze-btn");
const pbitInput = document.getElementById("pbit-file");
const prevPbitInput = document.getElementById("previous-pbit-file");
const progressBar = document.querySelector(".progress");
const uploadFeedback = document.querySelectorAll(".upload-feedback");
const checkmark = document.querySelector(".checkmark");

// Função para mostrar feedback instantâneo
[pbitInput, prevPbitInput].forEach((input, idx) => {
    input.addEventListener("change", () => {
        const file = input.files[0];
        if (file) {
            uploadFeedback[idx].textContent = `✅ Arquivo carregado: ${file.name}`;
        } else {
            uploadFeedback[idx].textContent = `❌ Nenhum arquivo selecionado`;
        }
    });
});

analyzeBtn.addEventListener("click", () => {
    const pbitFile = pbitInput.files[0];
    if (!pbitFile) {
        alert("Por favor, carregue o PBIT atual.");
        return;
    }

    const formData = new FormData();
    formData.append("pbit_file", pbitFile);
    const prevFile = prevPbitInput.files[0];
    if (prevFile) formData.append("previous_pbit_file", prevFile);

    // Reset progress e checkmark
    progressBar.style.width = "0%";
    checkmark.style.opacity = 0;

    // Envia requisição POST para /analisar
    fetch("/analisar", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error("Erro na análise");
        return response.blob(); // PDF
    })
    .then(blob => {
        // Atualiza barra de progresso (simulação)
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                checkmark.style.opacity = 1; // Mostra checkmark
            } else {
                width += 5;
                progressBar.style.width = width + "%";
            }
        }, 50);

        // Cria link para download do PDF
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "comparador_de_versoes.pdf";
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(err => {
        console.error(err);
        alert("Ocorreu um erro ao analisar os arquivos.");
    });
});
