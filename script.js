function mostrarMensagemInicial() {
    const questoesContainer = document.getElementById('questoes');
    if (questoesContainer) {
        questoesContainer.innerHTML = `
            <div id="container-mensagem">
                <div id="mensagem-inicial">
                    <strong>Conheça o PismPro!</strong><br>
                    Uma ferramenta que te permite filtrar as questões do PISM garantindo a você uma pesquisa simplificada para encontrar mais facilmente questões de forma direcionada para sua preparação!
                </div>
            </div>
        `;
    } else {
        console.error('Elemento com id "questoes" não encontrado.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    mostrarMensagemInicial();
});


async function carregarQuestoes() {
    try {
        const questoesObj = await fetch('obj.json').then(response => {
            if (!response.ok) throw new Error('Erro ao carregar questões objetivas');
            return response.json();
        });
        const questoesDisc = await fetch('disc.json').then(response => {
            if (!response.ok) throw new Error('Erro ao carregar questões discursivas');
            return response.json();
        });
        return { questoesObj, questoesDisc };
    } catch (error) {
        console.error(error);
        alert('Não foi possível carregar as questões. Verifique os arquivos JSON.');
        return { questoesObj: [], questoesDisc: [] };
    }
}

function filtrarQuestoes(questoesObj, questoesDisc) {
    const ano = document.getElementById('ano').value;
    const modulo = document.getElementById('modulo').value;
    const disciplina = document.getElementById('disciplina').value.trim().toLowerCase();
    const tipo = document.getElementById('tipo').value;
    const search = document.getElementById('search').value.toLowerCase();

    // Se nenhum filtro for aplicado, exibe todas as questões
    if (!ano && !modulo && !disciplina && !tipo && !search) {
        return [...questoesObj, ...questoesDisc];
    }

    let questoesFiltradas = [];

    if (tipo === 'objetiva') {
        questoesFiltradas = questoesObj.filter(questao => filtrarPorFiltros(questao, ano, modulo, disciplina, search));
    } else if (tipo === 'discursiva') {
        questoesFiltradas = questoesDisc.filter(questao => filtrarPorFiltros(questao, ano, modulo, disciplina, search));
    } else {
        const todasAsQuestoes = [...questoesObj, ...questoesDisc];
        questoesFiltradas = todasAsQuestoes.filter(questao => filtrarPorFiltros(questao, ano, modulo, disciplina, search));
    }

    if (questoesFiltradas.length === 0) {
        document.getElementById('message').innerHTML = 'Nenhuma questão encontrada com os filtros aplicados.';
    } else {
        document.getElementById('message').innerHTML = '';
    }

    return questoesFiltradas;
}

function filtrarPorFiltros(questao, ano, modulo, disciplina, search) {
    if (!questao || !questao.questao || !questao.questao.enunciado) {
        return false;
    }

    const anoMatch = ano ? questao.ano.toString() === ano : true;
    const moduloMatch = modulo ? questao.modulo === modulo : true;

    const normalizedDisciplina = normalizeString(disciplina);
    const normalizedQuestaoDisciplina = normalizeString(questao.disciplina || "");

    const disciplinaMatch = disciplina ? 
        (questao.disciplina && normalizedQuestaoDisciplina === normalizedDisciplina) : true;

    const normalizedSearch = normalizeString(search);
    const searchMatch = new RegExp(`\\b${normalizedSearch}\\b`, 'i').test(normalizeString(questao.questao.enunciado));

    return anoMatch && moduloMatch && disciplinaMatch && searchMatch;
}

function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function exibirQuestoes(questoes) {
    const questoesContainer = document.getElementById('questoes');
    const messageContainer = document.getElementById('message');

    questoesContainer.innerHTML = '';
    messageContainer.innerHTML = '';

    if (questoes.length === 0) {
        messageContainer.innerHTML = '<div style="text-align: center; margin: 5px;">Questão(ões) não encontrada(s).</div>';
    } else {
        questoes.forEach((questao, index) => {
            const questaoDiv = document.createElement('div');
            questaoDiv.className = 'questao';
            questaoDiv.style.marginLeft = '15px';
            questaoDiv.style.marginTop = '30px';
            questaoDiv.style.paddingBottom = '10px';

            // Exibir informações gerais da questão
            questaoDiv.innerHTML += `<strong>Ano:</strong> ${questao.ano} <br>`;
            questaoDiv.innerHTML += `<strong>Módulo:</strong> ${questao.modulo} <br>`;
            questaoDiv.innerHTML += `<strong>Disciplina:</strong> ${questao.disciplina} <br>`;
            questaoDiv.innerHTML += `<strong>Tipo:</strong> ${questao.tipo} <br>`;

            // Exibir enunciado
            const enunciado = formatarTextoComImagens(questao.questao.enunciado);
            questaoDiv.innerHTML += `<strong>Enunciado:</strong><br>${enunciado} <br>`;

            // Verificar imagem no enunciado
            if (questao.questao.imagem_url) {
                questaoDiv.innerHTML += `<img src="${questao.questao.imagem_url}" alt="Imagem Enunciado" style="max-width: 100%; height: auto;"> <br>`;
            }

            // Exibir alternativas para questões objetivas
            if (questao.tipo === 'objetiva' && questao.questao.alternativas) {
                questaoDiv.innerHTML += '<strong>Alternativas:</strong><br>';
                questao.questao.alternativas.forEach((alternativa) => {
                    questaoDiv.innerHTML += `${alternativa} <br>`;
                });

                // Adicionar botão "Resposta Correta" para questões objetivas
                if (questao.questao.resposta_correta) {
                    const respostaCorreta = questao.questao.resposta_correta;
                    questaoDiv.innerHTML += `
                        <button class="toggle-btn" onclick="toggleVisibility('respostaCorreta-${index}')" style="margin-top: 30px; background-color: rgb(69, 221, 148); color: black; border: none; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; cursor: pointer; border-radius: 5px;">Resposta Correta</button>
                        <div id="respostaCorreta-${index}" style="display: none; margin-top: 5px;">
                            <strong>Resposta Correta:</strong><br>
                            ${respostaCorreta}
                        </div>
                    `;
                }
            }

            // Adicionar botão "Resposta Esperada" para questões discursivas
            if (questao.tipo === 'discursiva' && questao.questao.resposta_esperada) {
                const respostaEsperada = formatarTextoComImagens(questao.questao.resposta_esperada);
                questaoDiv.innerHTML += `
                    <button class="toggle-btn" onclick="toggleVisibility('respostaEsperada-${index}')" style="margin-top: 30px; background-color: rgb(69, 221, 148); color: black; border: none; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; cursor: pointer; border-radius: 5px;">Resposta Esperada</button>
                    <div id="respostaEsperada-${index}" style="display: none; margin-top: 5px;">
                        <strong>Resposta Esperada:</strong><br>
                        ${respostaEsperada}
                    </div>
                `;
            }

            // Linha de separação entre questões
            const hr = document.createElement('hr');
            hr.style.border = '1px solid black';
            hr.style.margin = '25px 0';

            questoesContainer.appendChild(questaoDiv);
            questoesContainer.appendChild(hr);
        });
    }
}


function formatarTextoComImagens(texto) {
    if (!texto) return '';

    const imageRegex = /(img\/[^\s]+)/g;
    const textoFormatado = texto.replace(imageRegex, match => {
        return `<img src="${match}" alt="Imagem" style="max-width: 100%; height: auto;">`;
    });

    return textoFormatado.replace(/\n/g, '<br>');
}

function toggleVisibility(id) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
}



document.getElementById('filtrarBtn').addEventListener('click', async () => {
    const { questoesObj, questoesDisc } = await carregarQuestoes();
    const questoesFiltradas = filtrarQuestoes(questoesObj, questoesDisc);
    exibirQuestoes(questoesFiltradas);
});
