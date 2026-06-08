/**
 * MÓDULO DE COMUNICAÇÃO COM A API REST
 */
const ApiService = {

  /**
   * Executa uma requisição HTTP genérica para a API
   */
  _request: function(endpoint, method, payload = null) {
    const url = `${CONFIG.API.URL}${endpoint}`;

    const headers = {
      "Authorization": `Bearer ${CONFIG.API.TOKEN}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const options = {
      method: method,
      headers: headers,
      muteHttpExceptions: true,
      followRedirects: true
    };

    if (payload && (method === "POST" || method === "PATCH")) {
      options.payload = JSON.stringify(payload);
    }

    try {
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (statusCode >= 200 && statusCode < 300) {
        return responseText ? JSON.parse(responseText) : true;
      } else {
        Logger.log(`❌ Erro de API [${statusCode}] em ${method} ${endpoint}: ${responseText}`);
        throw new Error(`Erro ${statusCode}: ${responseText}`);
      }
    } catch (error) {
      Logger.log(`🚨 Falha de conexão/timeout em ${method} ${endpoint}: ${error.toString()}`);
      throw error;
    }
  },

  getNotes: function() {
    return this._request("/notes", "GET");
  },

  createNote: function(noteData) {
    return this._request("/notes", "POST", noteData);
  },

  updateNote: function(id, noteData) {
    return this._request(`/notes/${id}`, "PATCH", noteData);
  },

  deleteNote: function(id) {
    return this._request(`/notes/${id}`, "DELETE");
  }
};
