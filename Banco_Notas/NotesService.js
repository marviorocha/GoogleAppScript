/**
 * MÓDULO DE MAPEAMENTO E TRATAMENTO DE NOTAS
 */
const NotesService = {

  /**
   * Converte uma linha da planilha em um objeto JSON para a API
   */
  rowToObj: function(row) {
    return {
      content: row[CONFIG.COLUNAS.CONTEUDO],
      status: row[CONFIG.COLUNAS.STATUS] || "published",
      author_id: parseInt(row[CONFIG.COLUNAS.AUTOR]) || null,
      subcategory_id: parseInt(row[CONFIG.COLUNAS.SUBCATEGORIA]) || null,
      tags: row[CONFIG.COLUNAS.TAGS] ? row[CONFIG.COLUNAS.TAGS].split(",").map(t => t.trim()) : []
    };
  },

  /**
   * Converte um objeto JSON da API em uma linha para a planilha
   */
  objToRow: function(note) {
    const row = [];
    row[CONFIG.COLUNAS.ID] = note.id;
    row[CONFIG.COLUNAS.CONTEUDO] = note.content;
    row[CONFIG.COLUNAS.STATUS] = note.status;
    row[CONFIG.COLUNAS.AUTOR] = note.author_id;
    row[CONFIG.COLUNAS.SUBCATEGORIA] = note.subcategory_id;
    row[CONFIG.COLUNAS.TAGS] = note.tags ? note.tags.join(", ") : "";
    row[CONFIG.COLUNAS.SINCRONIZADO] = true;
    row[CONFIG.COLUNAS.EXCLUIR] = false;
    return row;
  },

  /**
   * Compara se uma linha da planilha foi alterada em relação ao estado da API
   */
  hasChanged: function(row, noteFromApi) {
    if (!noteFromApi) return true;

    const currentTags = row[CONFIG.COLUNAS.TAGS] ? row[CONFIG.COLUNAS.TAGS].split(",").map(t => t.trim()).join(",") : "";
    const apiTags = noteFromApi.tags ? noteFromApi.tags.join(",") : "";

    return (
      row[CONFIG.COLUNAS.CONTEUDO] !== noteFromApi.content ||
      row[CONFIG.COLUNAS.STATUS] !== noteFromApi.status ||
      parseInt(row[CONFIG.COLUNAS.AUTOR]) !== noteFromApi.author_id ||
      parseInt(row[CONFIG.COLUNAS.SUBCATEGORIA]) !== noteFromApi.subcategory_id ||
      currentTags !== apiTags
    );
  }
};
