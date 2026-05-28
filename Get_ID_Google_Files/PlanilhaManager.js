 const PlanilhaManager = {
  
  /**
   * Localiza a linha correta pela Chave Primária e grava o ID do Drive na coluna especificada
   */
  atualizarIdNaLinha: function(planilhaId, nomeAba, idLinhaBuscado, idDrive) {
    const sheet = SpreadsheetApp.openById(planilhaId).getSheetByName(nomeAba);
    if (!sheet) throw new Error(`Aba '${nomeAba}' não encontrada na planilha.`);
    
    const ultimaLinha = sheet.getLastRow();
    if (ultimaLinha < 2) return false;
    
    // 1. Lê a primeira linha (Cabeçalho) para achar as colunas de forma dinâmica (Evita descompasso de colunas)
    const cabecalho = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Substitua "ID" pelo nome exato da sua coluna de chave primária na planilha
    const colChaveIndice = cabecalho.indexOf("ID_Proposta") + 1; 
    // Nome exato da coluna onde o AppSheet espera ver o ID gerado pelo Drive
    const colDestinoIndice = cabecalho.indexOf("ID_Arquivo_Drive") + 1; 
    
    if (colChaveIndice === 0 || colDestinoIndice === 0) {
      throw new Error("Erro de mapeamento: Certifique-se de que as colunas 'ID_Proposta' e 'ID_Arquivo_Drive' existem na planilha.");
    }
    
    // 2. Lê todos os IDs da coluna de chaves para fazer busca rápida em memória (Performance)
    const dadosChaves = sheet.getRange(2, colChaveIndice, ultimaLinha - 1, 1).getValues();
    const buscaIdStr = String(idLinhaBuscado).trim();
    
    let linhaDaPlanilha = -1;
    for (let i = 0; i < dadosChaves.length; i++) {
      if (String(dadosChaves[i][0]).trim() === buscaIdStr) {
        linhaDaPlanilha = i + 2; // +2 compensando o índice 0 e o cabeçalho
        break;
      }
    }
    
    // 3. Se achou a linha correspondente, faz a gravação precisa na célula
    if (linhaDaPlanilha !== -1) {
      sheet.getRange(linhaDaPlanilha, colDestinoIndice).setValue(idDrive);
      Logger.log(`✅ ID do Drive salvo com sucesso na linha ${linhaDaPlanilha}, Coluna ${colDestinoIndice}`);
      return true;
    }
    
    return false;
  }
};