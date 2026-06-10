// --- CONFIGURAÇÃO ---
// IDs do Google Drive
const ID_PASTA_PRINCIPAL = "1HGFRpr2ggUz1Xdk4A-2VlQHeTr7Jl6o3";
const ID_TEMPLATE_TABELA = "1g4JpVfj9Jqcf_ni8kMthOaf2HBDOX7z67GjXkxXtukA";
const ID_TEMPLATE_ESPECIFICACAO = "1S909a4evnD8Q3zBZAuLyJzOCwhbG7AtD";
const ID_TEMPLATE_COMPARATIVO_PROPOSTAS = "1bB6EfjdJG2CXkw686Ik4TCwgiIQUNzkA";
const ID_PLANILHA_APPSHEET = "1Y-riSqidwDZfI2bhKE2fAAGhnQK4-h9Pc1_Z1mUnH1g";

const NOME_DA_PLANILHA = "Clientes"; 
const NUMERO_COLUNA_CHAVE = 1;         
const NOME_COLUNA_ID_PASTA = "AD"; 
const NUMERO_COLUNA_ID_PASTA = columnToNumber(NOME_COLUNA_ID_PASTA);

// --- FIM DA CONFIGURAÇÃO ---

/**
 * Converte uma letra de coluna (A, B, C, etc) para seu número correspondente (1, 2, 3, etc)
 * @param {string} column A letra da coluna
 * @return {number} O número correspondente à coluna
 */
function columnToNumber(column) {
    let result = 0;
    for (let i = 0; i < column.length; i++) {
        result *= 26;
        result += column.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
    }
    return result;
}

 
function doPost(e) {
    try {
        Logger.log("Recebendo requisição do AppSheet");
        const requestData = JSON.parse(e.postData.contents);
        Logger.log("Dados recebidos: " + JSON.stringify(requestData));

        const nomeDoCliente = requestData.nomeDoCliente;
        const chaveDaLinha = requestData.chaveDaLinha;

        Logger.log("Nome do Cliente: " + nomeDoCliente);
        Logger.log("Chave da Linha: " + chaveDaLinha);

        if (!nomeDoCliente || !chaveDaLinha) {
            throw new Error("Dados essenciais (nome do cliente ou chave da linha) não foram recebidos");
        }

        // Chama a função principal que executa todo o processo
        const resultado = criarPastaEAtualizarPlanilha(nomeDoCliente, chaveDaLinha);

        return ContentService.createTextOutput(JSON.stringify({
            "status": "success",
            "message": resultado
        })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        Logger.log("ERRO no doPost: " + err.message);
        return ContentService.createTextOutput(JSON.stringify({
            "status": "error",
            "message": err.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

 
function criarPastaEAtualizarPlanilha(nomeCliente, chaveLinha) {
    try {
        // Verifica se a pasta já existe
        const pastaPrincipal = DriveApp.getFolderById(ID_PASTA_PRINCIPAL);
        const pastasFilhas = pastaPrincipal.getFolders();
        let pastaExistente = null;

        while (pastasFilhas.hasNext()) {
            const pasta = pastasFilhas.next();
            if (pasta.getName() === nomeCliente) {
                pastaExistente = pasta;
                break;
            }
        }

        let idDaNovaPasta;
        if (pastaExistente) {
            Logger.log("Pasta já existe para o cliente: " + nomeCliente);
            idDaNovaPasta = pastaExistente.getId();
        } else {
            // 1. Cria a estrutura de pastas e retorna o ID da nova pasta do cliente.
            idDaNovaPasta = criarEstruturaDePastas(nomeCliente);
            Logger.log("Nova pasta criada com ID: " + idDaNovaPasta);
        }

        // 2. Encontra a linha correta na planilha e salva o ID da pasta.
        Logger.log("Tentando acessar a planilha com ID: " + ID_PLANILHA_APPSHEET);

        let spreadsheet;
        try {
            spreadsheet = SpreadsheetApp.openById(ID_PLANILHA_APPSHEET);
        } catch (e) {
            throw new Error("Erro ao abrir a planilha. Verifique se o ID está correto e se o script tem permissão para acessar planilhas. Detalhes: " + e.message);
        }

        const planilha = spreadsheet.getSheetByName(NOME_DA_PLANILHA);
        if (!planilha) {
            throw new Error("A planilha '" + NOME_DA_PLANILHA + "' não foi encontrada.");
        }

        const rangeDeDados = planilha.getDataRange();
        const valores = rangeDeDados.getValues();

 
        Logger.log("Buscando chave: '" + chaveLinha + "'");
        Logger.log("Número total de linhas na planilha: " + valores.length);
        Logger.log("Procurando na coluna: " + NUMERO_COLUNA_CHAVE);

        // Mostra os valores das primeiras linhas para verificação
        Logger.log("=== Primeiras linhas da planilha ===");
        for (let i = 0; i < Math.min(5, valores.length); i++) {
            const valorNaColuna = valores[i][NUMERO_COLUNA_CHAVE - 1];
            Logger.log("Linha " + (i + 1) + " - Valor: '" + valorNaColuna + "' (tipo: " + typeof valorNaColuna + ")");
        }

        // Procura pela chave em todas as linhas
        for (let i = 1; i < valores.length; i++) { 
            const valorAtual = valores[i][NUMERO_COLUNA_CHAVE - 1];
            const valorAtualString = valorAtual.toString().trim();
            const chaveLinhaString = chaveLinha.toString().trim();

            Logger.log("Comparando - Linha " + (i + 1) + ": '" + valorAtualString + "' com chave: '" + chaveLinhaString + "'");

            if (valorAtualString === chaveLinhaString) {
               
                planilha.getRange(i + 1, NUMERO_COLUNA_ID_PASTA).setValue(idDaNovaPasta);
                const statusPasta = pastaExistente ? "existente" : "recém-criada";
                Logger.log("ID da pasta " + statusPasta + " '" + idDaNovaPasta + "' salvo na linha " + (i + 1) + " para o cliente '" + nomeCliente + "'.");
                SpreadsheetApp.flush(); // Garante que a alteração seja salva imediatamente
                return "ID da pasta " + idDaNovaPasta + " (" + statusPasta + ") salvo com sucesso na linha " + (i + 1);
            }
        }

        // Se o loop terminar e não encontrar a linha, lança um erro.
        throw new Error("A linha com a chave '" + chaveLinha + "' não foi encontrada na planilha.");
    } catch (error) {
        Logger.log("Erro em criarPastaEAtualizarPlanilha: " + error.message);
        throw error;
    }
}

/**
 * Cria a estrutura de pastas no Drive e retorna o ID da pasta do cliente.
 * @param {string} nomeDoCliente O nome do cliente.
 * @return {string} O ID da pasta do cliente recém-criada.
 */
function criarEstruturaDePastas(nomeDoCliente) {
    const pastaPrincipal = DriveApp.getFolderById(ID_PASTA_PRINCIPAL);
    const pastaCliente = pastaPrincipal.createFolder(nomeDoCliente);
    const idCliente = pastaCliente.getId();

    pastaCliente.createFolder("Propostas");
    const pastaProjetos = pastaCliente.createFolder("Projetos");

    const templateTabela = DriveApp.getFileById(ID_TEMPLATE_TABELA);
    const templateEspecificacao = DriveApp.getFileById(ID_TEMPLATE_ESPECIFICACAO);
    const templateComparativoPropostas = DriveApp.getFileById(ID_TEMPLATE_COMPARATIVO_PROPOSTAS);

    templateTabela.makeCopy("Tabela Comparativa - " + nomeDoCliente, pastaCliente);
    templateEspecificacao.makeCopy("Especificação Técnica - " + nomeDoCliente, pastaCliente);
    templateComparativoPropostas.makeCopy("Comparativo de Propostas - Elevador Residencial e Plataforma - " + nomeDoCliente, pastaCliente);

    Logger.log("Estrutura de pastas criada para '" + nomeDoCliente + "'.");
    return idCliente; // Retorna o ID para a função principal
}

/**
 * Função de teste para facilitar a execução manual.
 */
function testarFluxoCompleto() {

    const nomeClienteTeste = "xxXX Cliente para Testes";
    const chaveLinhaTeste = "53cc59fa";

    // if (chaveLinhaTeste === "23f422b6") {
    //   Logger.log("Por favor, edite a função 'testarFluxoCompleto' e adicione uma chave de linha real da sua planilha para poder testar.");
    //   return;
    // }

    criarPastaEAtualizarPlanilha(nomeClienteTeste, chaveLinhaTeste);
}

