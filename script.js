let certificados = [];
let certificadosFiltrados = [];

const elements = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    certificatesList: document.getElementById('certificatesList'),
    totalCount: document.getElementById('totalCount'),
    suggestions: document.getElementById('suggestions'),
    pdfViewer: document.getElementById('pdfViewer'),
    pdfFrame: document.getElementById('pdfFrame'),
    pdfTitle: document.getElementById('pdfTitle'),
    closeViewerBtn: document.getElementById('closeViewerBtn'),
    printBtn: document.getElementById('printBtn')
};

/* NORMALIZA */
function removerAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function buscaInteligente(busca, texto) {
    return removerAcentos(texto.toLowerCase())
        .includes(removerAcentos(busca.toLowerCase()));
}

/* CARREGAR */
async function carregarCertificados() {
    try {
        const res = await fetch('dados/certificados.json');
        const data = await res.json();

        certificados = data.certificados;
        certificadosFiltrados = [...certificados];
        
        render();
    } catch (error) {
        console.error('Erro ao carregar certificados:', error);
        elements.certificatesList.innerHTML = '<div class="error">Erro ao carregar certificados. Verifique o arquivo JSON.</div>';
    }
}

/* ABRIR CERTIFICADO - Com modal usando visualizador Google Drive */
function abrirCertificado(certificado) {
    if (!certificado.arquivo) {
        alert('Este certificado não possui arquivo disponível.');
        return;
    }
    
    // Extrai o ID do arquivo do link
    const id = certificado.arquivo.split('id=')[1];
    
    // Usa o visualizador oficial do Google Drive
    const visualizador = `https://drive.google.com/file/d/${id}/preview`;
    
    // Atualiza o modal
    elements.pdfTitle.textContent = certificado.nome;
    elements.pdfFrame.src = visualizador;
    elements.pdfViewer.style.display = 'flex';
    elements.pdfViewer.dataset.currentPdf = certificado.arquivo;
    elements.pdfViewer.dataset.currentId = id;
}

/* IMPRIMIR - do modal */
function imprimirCertificado() {
    const pdfPath = elements.pdfViewer.dataset.currentPdf;
    const pdfId = elements.pdfViewer.dataset.currentId;
    
    if (pdfPath) {
        // Abre em nova aba e imprime
        const printWindow = window.open(pdfPath, '_blank');
        if (printWindow) {
            setTimeout(function() {
                printWindow.print();
            }, 1500);
        } else {
            alert('Por favor, permita pop-ups para imprimir o certificado.');
        }
    } else if (pdfId) {
        const printWindow = window.open(`https://drive.google.com/file/d/${pdfId}/view`, '_blank');
        if (printWindow) {
            setTimeout(function() {
                printWindow.print();
            }, 1500);
        }
    }
}

/* BAIXAR CERTIFICADO */
function baixarCertificado(certificado) {
    if (!certificado.arquivo) {
        alert('Este certificado não possui arquivo disponível.');
        return;
    }
    
    // Abre em nova aba para download
    window.open(certificado.arquivo, '_blank');
}

/* IMPRIMIR DIRETO (sem modal) */
function imprimirCertificadoDireto(certificado) {
    if (!certificado.arquivo) {
        alert('Este certificado não possui arquivo disponível.');
        return;
    }
    
    const printWindow = window.open(certificado.arquivo, '_blank');
    if (printWindow) {
        setTimeout(function() {
            printWindow.print();
        }, 1500);
    } else {
        alert('Por favor, permita pop-ups para imprimir o certificado.');
    }
}

/* FECHAR MODAL */
function fecharModal() {
    elements.pdfViewer.style.display = 'none';
    elements.pdfFrame.src = '';
    elements.pdfViewer.dataset.currentPdf = '';
    elements.pdfViewer.dataset.currentId = '';
}

/* RENDER */
function render() {
    const total = certificadosFiltrados.length;
    elements.totalCount.innerHTML = `${total} ${total === 1 ? 'certificado encontrado' : 'certificados encontrados'}`;

    if (certificadosFiltrados.length === 0) {
        elements.certificatesList.innerHTML = '<div class="no-results">Nenhum certificado encontrado</div>';
        return;
    }

    elements.certificatesList.innerHTML = certificadosFiltrados.map(c => `
        <div class="certificate-item">
            <div class="certificate-icon">
                <img src="assets/pdf.png" alt="PDF">
            </div>
            <div class="certificate-info">
                <h3>${c.nome}</h3>
                <div class="date">
                    <img src="assets/data.png" alt="Data" class="icon-small">
                    ${c.data}
                </div>
                <div class="certificate-actions">
                    <button class="action-btn view-btn" onclick="abrirCertificado(${JSON.stringify(c).replace(/"/g, '&quot;')})">
                        <img src="assets/lupa.png" alt="Visualizar" class="icon-small">
                        Visualizar
                    </button>
                    <button class="action-btn download-btn" onclick="baixarCertificado(${JSON.stringify(c).replace(/"/g, '&quot;')})">
                        <img src="assets/baixar.png" alt="Baixar" class="icon-small">
                        Baixar
                    </button>
                    <button class="action-btn print-btn" onclick="imprimirCertificadoDireto(${JSON.stringify(c).replace(/"/g, '&quot;')})">
                        <img src="assets/imprimir.png" alt="Imprimir" class="icon-small">
                        Imprimir
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/* BUSCA */
function filtrar() {
    const termo = elements.searchInput.value.trim();

    if (!termo) {
        certificadosFiltrados = [...certificados];
    } else {
        certificadosFiltrados = certificados.filter(c =>
            buscaInteligente(termo, c.nome)
        );
    }

    render();
}

/* AUTO SUGESTÃO */
elements.searchInput.addEventListener('input', () => {
    const termo = elements.searchInput.value.trim();

    if (termo.length < 2) {
        elements.suggestions.innerHTML = '';
        return;
    }

    const resultados = certificados
        .filter(c => buscaInteligente(termo, c.nome))
        .slice(0, 5);

    if (resultados.length === 0) {
        elements.suggestions.innerHTML = '';
        return;
    }

    elements.suggestions.innerHTML = resultados.map(c => `
        <div class="suggestion-item" onclick="selecionarSugestao('${c.nome.replace(/'/g, "\\'")}')">
            📄 ${c.nome.length > 50 ? c.nome.substring(0, 50) + '...' : c.nome}
        </div>
    `).join('');
});

/* CLICK NA SUGESTÃO */
window.selecionarSugestao = function(nome) {
    elements.searchInput.value = nome;
    elements.suggestions.innerHTML = '';
    filtrar();
};

/* BOTÃO DE BUSCA */
elements.searchBtn.addEventListener('click', filtrar);

/* EVENTOS DO MODAL */
if (elements.closeViewerBtn) {
    elements.closeViewerBtn.addEventListener('click', fecharModal);
}

if (elements.printBtn) {
    elements.printBtn.addEventListener('click', imprimirCertificado);
}

/* FECHAR MODAL AO CLICAR FORA */
if (elements.pdfViewer) {
    elements.pdfViewer.addEventListener('click', (e) => {
        if (e.target === elements.pdfViewer) {
            fecharModal();
        }
    });
}

/* TECLA ESC FECHA MODAL */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.pdfViewer && elements.pdfViewer.style.display === 'flex') {
        fecharModal();
    }
});

/* BUSCA AO PRESSIONAR ENTER */
elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        filtrar();
    }
});

/* EXPOR FUNÇÕES GLOBALMENTE */
window.abrirCertificado = abrirCertificado;
window.baixarCertificado = baixarCertificado;
window.imprimirCertificadoDireto = imprimirCertificadoDireto;
window.fecharModal = fecharModal;

/* INIT */
carregarCertificados();
