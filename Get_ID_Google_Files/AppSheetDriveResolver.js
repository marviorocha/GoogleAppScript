const AppSheetDriveResolver = {
  
  /**
   * Pega o caminho do AppSheet e localiza o ID real do arquivo no Drive
   * @param {string} caminhoCompleto Ex: "Especificacao_Images/f1ccf75d.Imagem.png" ou "Pasta/Subpasta/Doc.pdf"
   * @returns {string|null} ID do arquivo ou null se não achar
   */
  resolverIdPorCaminho: function(caminhoCompleto) {
    if (!caminhoCompleto) return null;
    
    // 1. Trata problemas de codificação comuns do AppSheet (Ex: espaços virando %20)
    let caminhoSanitizado = decodeURIComponent(caminhoCompleto).trim();
    
    // 2. Quebra o caminho pelas barras para separar pastas do nome do arquivo
    // Ex: ["Especificacao_Images", "f1ccf75d.Imagem.png"]
    const partes = caminhoSanitizado.split("/").filter(Boolean);
    if (partes.length === 0) return null;
    
    const nomeArquivo = partes.pop(); // Pega o último elemento (o arquivo de fato)
    
    // 3. Começa a busca a partir da Raiz do Drive ou de uma pasta mãe do AppSheet
    let pastaAtual = DriveApp.getRootFolder();
    
    // 4. Navega de pasta em pasta se houver subdiretórios no caminho
    for (const nomePasta of partes) {
      const subPastas = pastaAtual.getFoldersByName(nomePasta);
      if (subPastas.hasNext()) {
        pastaAtual = subPastas.next();
      } else {
        Logger.log(`⚠️ Pasta '${nomePasta}' não encontrada no caminho.`);
        return null; // Interrompe se o caminho de pastas estiver quebrado
      }
    }
    
    // 5. Busca o arquivo exato dentro da pasta final localizada
    // Usamos o operador 'name = ...' que é extremamente indexado e performático no Drive
    const query = `name = '${nomeArquivo.replace(/'/g, "\\'")}' and trashed = false`;
    const arquivos = pastaAtual.searchFiles(query);
    
    if (arquivos.hasNext()) {
      const arquivoFinal = arquivos.next();
      const fileId = arquivoFinal.getId();
      Logger.log(`🎯 Arquivo localizado com sucesso! Nome: ${nomeArquivo} -> ID: ${fileId}`);
      return fileId;
    }
    
    Logger.log(`❌ Arquivo '${nomeArquivo}' não foi encontrado dentro da pasta de destino.`);
    return null;
  }
};