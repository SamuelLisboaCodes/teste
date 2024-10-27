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

    if (!ano && !modulo && !disciplina && !tipo && !search) {
        document.getElementById('message').innerHTML = 'Utilize pelo menos um dos filtros.';
        document.getElementById('questoes').innerHTML = '';
        return [];
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

    // Modificação aqui: Verifica se a busca é uma palavra exata
    const normalizedSearch = normalizeString(search);
    const searchMatch = new RegExp(`\\b${normalizedSearch}\\b`, 'i').test(questao.questao.enunciado);

    return anoMatch && moduloMatch && disciplinaMatch && searchMatch;
}

function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isValidImageUrl(url) {
    // Verifica se a URL é uma string e se termina com uma extensão de imagem comum
    return typeof url === 'string' && 
           (url.endsWith('.jpg') || url.endsWith('.jpeg') || 
            url.endsWith('.png') || url.endsWith('.gif') || 
            url.endsWith('.bmp') || url.endsWith('.webp'));
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
            questaoDiv.style.marginTop = '30px'; // Aumenta a margem superior
            questaoDiv.style.paddingBottom = '10px'; // Adiciona um pouco de padding na parte inferior

            questaoDiv.innerHTML = `                
                <strong>Ano:</strong> ${questao.ano} <br>
                <strong>Módulo:</strong> ${questao.modulo} <br>
                <strong>Disciplina:</strong> ${questao.disciplina} <br>
                <strong>Tipo:</strong> ${questao.tipo} <br>
                <strong>Enunciado:</strong> <span style="text-align: justify;">${questao.questao.enunciado.replace(/\n/g, '<br>')}</span> <br>
            `;

            if (questao.tipo === 'objetiva') {
                questaoDiv.innerHTML += '<strong>Alternativas:</strong><ul>';
                questao.questao.alternativas.forEach(alt => {
                    questaoDiv.innerHTML += `<li style="text-align: justify;">${alt.replace(/\n/g, '<br>')}</li>`;
                });
                questaoDiv.innerHTML += '</ul>';

                const respostaCorreta = questao.questao.resposta_correta?.trim().replace(/\n/g, '<br>') || 'Nenhuma resposta correta disponível.';
                questaoDiv.innerHTML += `
                    <button class="toggle-btn" onclick="toggleVisibility('respostaCorreta-${index}')" style="margin-top: 15px; background-color: rgb(69, 221, 148); color: black; border: none; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; cursor: pointer; border-radius: 5px;">Resposta Correta</button>
                    <div id="respostaCorreta-${index}" style="display: none; margin-top: 5px;">
                        <strong>Resposta Correta:</strong> <span style="text-align: justify;">${respostaCorreta}</span> <br>
                    </div>
                `;
            }

            if (questao.tipo === 'discursiva') {
                if (questao.questao.imagem_url_enun) {
                    questaoDiv.innerHTML += `<img src="${questao.questao.imagem_url_enun}" alt="Imagem do Enunciado" style="max-width: 100%; height: auto;"> <br>`;
                }

                const respostaEsperada = questao.questao.resposta_esperada?.trim() || '';
                const imgRegex = /\(([^)]+)\)/; // Regex para encontrar o caminho da imagem entre parênteses
                const imgMatch = respostaEsperada.match(imgRegex);

                const respostaDiv = document.createElement('div');
                respostaDiv.id = `respostaEsperada-${index}`;
                respostaDiv.style.display = 'none';
                respostaDiv.style.marginTop = '5px';

                // Verifica se existe uma resposta esperada antes de criar o botão
                if (respostaEsperada) {
                    respostaDiv.innerHTML = `<strong>Resposta Esperada:</strong><br><br>${respostaEsperada.replace(/\n/g, '<br>')}`; // Adiciona duas quebras de linha aqui

                    // Adiciona a imagem da resposta esperada, se disponível e válida
                    if (imgMatch && imgMatch[1]) {
                        const imageUrl = imgMatch[1].trim();
                        if (isValidImageUrl(imageUrl)) {
                            respostaDiv.innerHTML += `<img src="${imageUrl}" style="max-width: 100%; height: auto;"> <br>`;
                        }
                    }

                    // Verifica se a imagem da resposta está disponível e válida
                    if (questao.questao.imagem_url_resp) {
                        const respostaImageUrl = questao.questao.imagem_url_resp.trim();
                        if (isValidImageUrl(respostaImageUrl)) {
                            respostaDiv.innerHTML += `<img src="${respostaImageUrl}" style="max-width: 100%; height: auto;"> <br>`;
                        }
                    }

                    // Somente cria o botão se houver conteúdo na resposta
                    questaoDiv.innerHTML += `
                        <button class="toggle-btn" onclick="toggleVisibility('respostaEsperada-${index}')" style="margin-top: 30px; background-color: rgb(69, 221, 148); color: black; border: none; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; cursor: pointer; border-radius: 5px;">Resposta Esperada</button>
                    `; // Aumenta a margem superior do botão
                    questaoDiv.appendChild(respostaDiv);
                }
            }

            // Adiciona a linha divisória entre as questões
            const hr = document.createElement('hr');
            hr.style.border = '1px solid black'; // Define a cor e espessura da linha
            hr.style.margin = '25px 0'; // Margem acima e abaixo da linha

            questoesContainer.appendChild(questaoDiv);
            questoesContainer.appendChild(hr); // Adiciona a linha divisória após a questão
        });
    }
}


function toggleVisibility(id) {
    const respostaDiv = document.getElementById(id);
    if (respostaDiv.style.display === 'none') {
        respostaDiv.style.display = 'block';
    } else {
        respostaDiv.style.display = 'none';
    }
}

document.getElementById('filtrarBtn').addEventListener('click', async () => {
    const { questoesObj, questoesDisc } = await carregarQuestoes();
    const questoesFiltradas = filtrarQuestoes(questoesObj, questoesDisc);
    exibirQuestoes(questoesFiltradas);
});
