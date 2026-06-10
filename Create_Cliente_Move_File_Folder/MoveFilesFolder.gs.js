// --- CONFIGURAÇÃO ---
// ID da pasta padrão do AppSheet onde os arquivos são salvos inicialmente.
// Geralmente é .../AppSheet/data/SeuAppName-12345/
const ID_PASTA_DEFAULT_APPSHEET = "1KiRRtHOMIPZJD0RxglM8QduNDK04DJnt";
const ID_PLANILHA_APP_PROPOSTA = "1YIU_nYTFMN0RS5zaXwtD2Wj9I-rshaD3QiHu2C6m0k0";
const NOME_ABA_PROPOSTA = "Propostas";

// Configuração das colunas (A=1, B=2, etc)
const COLUNA_ID_CLIENTE = 1;        // Coluna A - ID único do cliente
const COLUNA_ID_PROPOSTA = 1;       // Coluna B - ID da proposta
const COLUNA_NOME_CLIENTE = 2;      // Coluna C - Nome do cliente
const COLUNA_ID_ARQUIVO = 8;        // Coluna H - ID do arquivo

// --- FIM DA CONFIGURAÇÃO ---

function formatarNomeArquivo(nomeCliente, nomeEmpresa) {
    return nomeCliente
        .toLowerCase()
        .replace(/\([^)]*\)/g, '') // Remove conteúdo entre parênteses
        .replace(/[^a-z\s]/g, '') // Remove caracteres especiais
        .trim()
        .replace(/\s+/g, '_') +
        '_' +
        nomeEmpresa.toLowerCase().trim() +
        '_proposta.pdf';
}

function salvarIdArquivoNaPlanilha(idArquivo, idProposta) {
    try {
        const planilha = SpreadsheetApp.openById(ID_PLANILHA_APP_PROPOSTA);
        const aba = planilha.getSheetByName(NOME_ABA_PROPOSTA);

        if (!aba) {
            throw new Error(`Aba '${NOME_ABA_PROPOSTA}' não encontrada.`);
        }

        // Procura pela linha da proposta
        const dados = aba.getDataRange().getValues();
        let linhaProposta = -1;

        // Procura pelo ID da proposta na coluna B (índice 1)
        for (let i = 0; i < dados.length; i++) {
            if (dados[i][COLUNA_ID_PROPOSTA - 1] === idProposta) {
                linhaProposta = i + 1;
                Logger.log(`Proposta encontrada na linha ${linhaProposta}`);
                Logger.log(`ID do Cliente: ${dados[i][COLUNA_ID_CLIENTE - 1]}`);
                Logger.log(`Nome do Cliente: ${dados[i][COLUNA_NOME_CLIENTE - 1]}`);
                break;
            }
        }

        if (linhaProposta === -1) {
            throw new Error(`Proposta '${idProposta}' não encontrada na planilha.`);
        }

        // Salva o ID do arquivo na coluna especificada
        aba.getRange(linhaProposta, COLUNA_ID_ARQUIVO).setValue(idArquivo);
        Logger.log(`ID do arquivo ${idArquivo} salvo na planilha para a proposta ${idProposta}`);

        return true;
    } catch (erro) {
        Logger.log(`Erro ao salvar ID do arquivo: ${erro.toString()}`);
        throw erro;
    }
}

/**
 * Função que lida com as requisições POST vindas do AppSheet.
 * É a porta de entrada para a automação.
 */
function doPost(e) {
    try {
        const requestData = JSON.parse(e.postData.contents);
        const nomeDoCliente = requestData.nomeDoCliente;
        const nomeEmpresa = requestData.nomeEmpresa; // Novo parâmetro
        const caminhoDoArquivo = requestData.caminhoDoArquivo;
        const pastaDestino = requestData.pastaDestino;
        const idProposta = requestData.idProposta;

        if (!nomeDoCliente || !caminhoDoArquivo || !pastaDestino || !idProposta || !nomeEmpresa) {
            throw new Error("Dados essenciais não foram recebidos.");
        }

        const nomeDoArquivo = caminhoDoArquivo.split("/").pop();
        const resultado = organizarArquivoDoCliente(nomeDoCliente, nomeDoArquivo, pastaDestino, idProposta, nomeEmpresa);

        return ContentService.createTextOutput(JSON.stringify({
            "status": "success",
            "message": resultado
        }));

    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({
            "status": "error",
            "message": "Falha no script: " + err.toString()
        }));
    }
}

// Update the organizarArquivoDoCliente function
function organizarArquivoDoCliente(nomeCliente, nomeArquivo, idPastaDestino, idProposta, nomeEmpresa) {
   
    // --- Retry Logic ---
    let arquivoParaMover = null;
    const tentativasMaximas = 3;
    const esperaEntreTentativas = 5000;

    for (let i = 0; i < tentativasMaximas; i++) {
        try {
            // Primeiro, encontra a pasta raiz do cliente
            const pastaRaiz = DriveApp.getFolderById(idPastaDestino);

            // Depois, procura a pasta Propostas dentro da pasta do cliente
            const pastasPropostasIterator = pastaRaiz.getFoldersByName("Propostas");

            if (!pastasPropostasIterator.hasNext()) {
                throw new Error(`Pasta 'Propostas' não encontrada em ${pastaRaiz.getName()}`);
            }

            const pastaProposta = pastasPropostasIterator.next();
            Logger.log(`Buscando arquivo '${nomeArquivo}' na pasta: ${pastaProposta.getName()}`);

            // Busca o arquivo pelo nome na pasta Propostas
            const arquivosEncontrados = pastaProposta.getFilesByName(nomeArquivo);

            if (arquivosEncontrados.hasNext()) {
                arquivoParaMover = arquivosEncontrados.next();
                Logger.log(`Arquivo encontrado na tentativa ${i + 1}`);
                break;
            }

        } catch (e) {
            Logger.log(`Erro na tentativa ${i + 1}: ${e.toString()}`);
        }

        if (i < tentativasMaximas - 1) {
            Logger.log(`Arquivo não encontrado. Aguardando ${esperaEntreTentativas / 1000} segundos...`);
            Utilities.sleep(esperaEntreTentativas);
        }
    }

    if (!arquivoParaMover) {
        throw new Error(`Arquivo '${nomeArquivo}' não encontrado após ${tentativasMaximas} tentativas.`);
    }

    try {
        // 1. Get file extension
        const extensao = nomeArquivo.split('.').pop().toLowerCase();

        // 2. Format new file name with proper extension
        const novoNomeBase = formatarNomeArquivo(nomeCliente, nomeEmpresa);
        const novoNomeArquivo = novoNomeBase.replace('.pdf', `.${extensao}`);

        // 3. Rename the file
        arquivoParaMover.setName(novoNomeArquivo);
        Logger.log(`✅ Arquivo renomeado para: ${novoNomeArquivo}`);

        // 4. Save file ID in spreadsheet
        salvarIdArquivoNaPlanilha(arquivoParaMover.getId(), idProposta);
        Logger.log(`✅ ID do arquivo salvo na planilha para proposta ${idProposta}`);

        return {
            success: true,
            message: "Arquivo renomeado e ID salvo com sucesso.",
            path: `${nomeCliente}/Propostas/${novoNomeArquivo}`,
            fileId: arquivoParaMover.getId()
        };

    } catch (erro) {
        Logger.log(`❌ Erro ao organizar arquivo: ${erro.toString()}`);
        throw erro;
    }
}

function testarOrganizacaoDeArquivo() {
    const nomeCliente = "Cliente para Testes (PR)";
    const nomeEmpresa = "atlas";
    const nomeArquivo = "test.pdf";
    const idPastaDestino = "1uguNAE1bIJVu9JEwnU6fuAagKm73W3N_";
    const idProposta = "466aa3a5";

    // --- DADOS QUE SERÃO USADOS NO TESTE ---

    const NOME_CLIENTE_TESTE = nomeCliente;
    const NOME_ARQUIVO_TESTE = nomeArquivo;
    const PASTA_DESTINO_TESTE = idPastaDestino;
    const ID_PROPOSTA_TESTE = idProposta;

    // --- ID da proposta para teste  // ----

    Logger.log("--- Iniciando teste de organização de arquivo ---");
    Logger.log("Cliente de Teste: " + NOME_CLIENTE_TESTE);
    Logger.log("Arquivo de Teste: " + NOME_ARQUIVO_TESTE);
    Logger.log("Pasta Destino: " + PASTA_DESTINO_TESTE);
    Logger.log("ID da Proposta: " + ID_PROPOSTA_TESTE);
    Logger.log("Planilha ID: " + ID_PLANILHA_APP_PROPOSTA);
    Logger.log("Aba da Planilha: " + NOME_ABA_PROPOSTA);
    Logger.log("Coluna para ID do arquivo: " + COLUNA_ID_ARQUIVO);

    try {

        // 1. Testa a formatação do nome do arquivo
        const nomeFormatado = formatarNomeArquivo(NOME_CLIENTE_TESTE, nomeEmpresa);

        Logger.log("Nome formatado do arquivo: " + nomeFormatado);

        // 2. Testa a organização do arquivo e criação da pasta
        const resultado = organizarArquivoDoCliente(
            NOME_CLIENTE_TESTE,
            NOME_ARQUIVO_TESTE,
            PASTA_DESTINO_TESTE,
            ID_PROPOSTA_TESTE,
            nomeEmpresa
        );

        Logger.log("Organização do arquivo: " + resultado);

        // 3. Verifica se o ID foi salvo na planilha usando o ID da proposta
        const planilha = SpreadsheetApp.openById(ID_PLANILHA_APP_PROPOSTA);
        const aba = planilha.getSheetByName(NOME_ABA_PROPOSTA);
        const dados = aba.getDataRange().getValues();
        let idEncontrado = false;

        // Procura pela linha com o ID da proposta
        for (let i = 0; i < dados.length; i++) {
            if (dados[i][COLUNA_ID_PROPOSTA - 1] === ID_PROPOSTA_TESTE) {
                const idArquivo = dados[i][COLUNA_ID_ARQUIVO - 1];
                const idCliente = dados[i][COLUNA_ID_CLIENTE - 1];
                const nomeCliente = dados[i][COLUNA_NOME_CLIENTE - 1];

                if (idArquivo) {
                    Logger.log("✅ Dados encontrados na planilha:");
                    Logger.log(`   ID do Cliente: ${idCliente}`);
                    Logger.log(`   Nome do Cliente: ${nomeCliente}`);
                    Logger.log(`   ID da Proposta: ${ID_PROPOSTA_TESTE}`);
                    Logger.log(`   ID do Arquivo: ${idArquivo}`);
                    idEncontrado = true;
                }
                break;
            }
        }

        if (!idEncontrado) {
            throw new Error(`ID do arquivo não foi encontrado na planilha para a proposta ${ID_PROPOSTA_TESTE}`);
        }

        Logger.log("✅ Teste concluído com sucesso!");
        Logger.log("1. Pasta criada/encontrada para: " + NOME_CLIENTE_TESTE);
        Logger.log("2. Arquivo renomeado para: " + nomeFormatado);
        Logger.log("3. ID do arquivo salvo na planilha na linha da proposta " + ID_PROPOSTA_TESTE);

    } catch (e) {
        Logger.log("❌ O teste falhou. Erro: " + e.toString());
        throw e;
    }
}
