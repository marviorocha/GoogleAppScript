/**
 * MÓDULO DE SINCRONIZAÇÃO EM LOTE
 */
const SyncService = {

  /**
   * Importa todas as notas da API Rails para a planilha, atualizando existentes e criando novas
   */
  importarDaApi: function() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABA_NOME);
    if (!sheet) return;

    try {
      const apiNotes = ApiService.getNotes();
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();

      // Cria mapa de IDs existentes na Planilha para saber a linha de cada um
      const idsPlanilhaMap = {};
      for (let i = CONFIG.PLANILHA.LINHA_INICIAL - 1; i < values.length; i++) {
        const id = values[i][CONFIG.COLUNAS.ID];
        if (id) idsPlanilhaMap[id] = i;
      }

      const novasLinhas = [];

      // Processa o lote vindo da API
      apiNotes.forEach(note => {
        const rowIndex = idsPlanilhaMap[note.id];
        const updatedRow = NotesService.objToRow(note);

        if (rowIndex !== undefined) {
          // Atualiza registro existente em lote na memória
          sheet.getRange(rowIndex + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
        } else {
          // Guarda novos registros para inserção em lote no final
          novasLinhas.push(updatedRow);
        }
      });

      if (novasLinhas.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, novasLinhas.length, novasLinhas[0].length).setValues(novasLinhas);
      }

      SpreadsheetApp.getUi().alert("Importação concluída com sucesso!");
    } catch (e) {
      SpreadsheetApp.getUi().alert(`Erro na importação: ${e.message}`);
    }
  },

  /**
   * Processa alterações da planilha e sincroniza com a API (Criação, Edição e Remoção)
   * @param {boolean} processAll Se falso, foca apenas em modificações pontuais. Se verdadeiro, varre toda a planilha.
   */
  sincronizar: function(processAll = false) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABA_NOME);
    if (!sheet || sheet.getLastRow() < CONFIG.PLANILHA.LINHA_INICIAL) return;

    const range = sheet.getRange(CONFIG.PLANILHA.LINHA_INICIAL, 1, sheet.getLastRow() - CONFIG.PLANILHA.LINHA_INICIAL + 1, sheet.getLastColumn());
    const values = range.getValues();

    let apiNotesMap = null;
    if (processAll) {
      try {
        const apiNotes = ApiService.getNotes();
        apiNotesMap = Object.fromEntries(apiNotes.map(n => [n.id, n]));
      } catch(e) {
        Logger.log("Não foi possível buscar dados prévios para comparação em lote. Processando de forma direta.");
      }
    }

    let linhasParaDeletar = [];
    let errosContador = 0;

    for (let i = 0; i < values.length; i++) {
      const linhaAtual = CONFIG.PLANILHA.LINHA_INICIAL + i;
      const row = values[i];
      const id = row[CONFIG.COLUNAS.ID];
      const deveExcluir = row[CONFIG.COLUNAS.EXCLUIR] === true;
      const isSincronizado = row[CONFIG.COLUNAS.SINCRONIZADO] === true;

      try {
        // CASE 1: EXCLUSÃO
        if (id && deveExcluir) {
          ApiService.deleteNote(id);
          linhasParaDeletar.push(linhaAtual);
          continue;
        }

        // CASE 2: CRIAÇÃO (Nova linha sem ID)
        if (!id && row[CONFIG.COLUNAS.CONTEUDO]) {
          const payload = NotesService.rowToObj(row);
          const novaNota = ApiService.createNote(payload);

          sheet.getRange(linhaAtual, CONFIG.COLUNAS.ID + 1).setValue(novaNota.id);
          sheet.getRange(linhaAtual, CONFIG.COLUNAS.SINCRONIZADO + 1).setValue(true);
          continue;
        }

        // CASE 3: ATUALIZAÇÃO (Modificado ou verificação forçada de lote)
        if (id && (!isSincronizado || processAll)) {
          const payload = NotesService.rowToObj(row);
          const notaApi = apiNotesMap ? apiNotesMap[id] : null;

          if (!processAll || NotesService.hasChanged(row, notaApi)) {
            ApiService.updateNote(id, payload);
          }
          sheet.getRange(linhaAtual, CONFIG.COLUNAS.SINCRONIZADO + 1).setValue(true);
        }

      } catch (error) {
        errosContador++;
        Logger.log(`Erro ao processar linha ${linhaAtual}: ${error.message}`);
        sheet.getRange(linhaAtual, CONFIG.COLUNAS.SINCRONIZADO + 1).setValue("ERRO");
      }
    }

    // Deleta linhas marcadas para exclusão de baixo para cima para não quebrar os índices
    if (linhasParaDeletar.length > 0) {
      linhasParaDeletar.reverse().forEach(linha => sheet.deleteRow(linha));
    }

    // Feedback para o usuário
    if (errosContador > 0) {
      SpreadsheetApp.getUi().alert(`Sincronização finalizada com avisos. Ocorreram ${errosContador} erro(s). Verifique os logs.`);
    } else {
      SpreadsheetApp.getUi().alert("Sincronização concluída com sucesso!");
    }
  }
};

// Funções de disparo direto do Menu
function rodarImportacao() { SyncService.importarDaApi(); }
function rodarSincronizacao() { SyncService.sincronizar(false); }
function rodarSincronizarTudo() { SyncService.sincronizar(true); }
