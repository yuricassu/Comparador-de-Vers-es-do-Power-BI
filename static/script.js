// Atualiza nomes de arquivos quando selecionados
const pbitInput = document.getElementById("pbit_file");
const previousInput = document.getElementById("previous_pbit_file");
const currentFileName = document.getElementById("currentFileName");
const previousFileName = document.getElementById("previousFileName");

pbitInput.addEventListener("change", () => {
    currentFileName.textContent = pbitInput.files[0]?.name || "";
});

previousInput.addEventListener("change", () => {
    previousFileName.textContent = previousInput.files[0]?.name || "";
});

// Botão Analisar
document.getElementById("analyzeBtn").addEventListener("click", async () => {
    const pbitFile = pbitInput.files[0];
    const previousFile = previousInput.files[0];

    if (!pbitFile) {
        alert("Envie o arquivo atual!");
        return;
    }

    const formData = new FormData();
    formData.append("pbit_file", pbitFile);
    if (previousFile) formData.append("previous_pbit_file", previousFile);

    // Mostrar barra de progresso
    const progressBar = document.getElementById("progressBar");
    const progress = progressBar.querySelector(".progress");
    progressBar.style.display = "block";
    progress.style.width = "0%";

    try {
        const response = await fetch("/analisar", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        // Ocultar barra e mostrar checkmark
        progress.style.width = "100%";
        const checkmark = document.getElementById("checkmark");
        checkmark.style.display = "block";

        // Aqui você pode atualizar cards, report, PDF link
        console.log(data);

    } catch (err) {
        console.error(err);
        alert("Erro na análise.");
    } finally {
        setTimeout(() => {
            document.getElementById("progressBar").style.display = "none";
        }, 800);
    }
});
