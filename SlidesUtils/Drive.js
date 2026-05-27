const DriveManager = {
  getOrCreateFolder: function(folderId, path) {
    if (!folderId) throw new Error("folderId inválido");
    let currentFolder;
    try {
      currentFolder = DriveApp.getFolderById(folderId);
    } catch (err) {
      throw new Error(`Não foi possível acessar a pasta ID=${folderId}: ${err}`);
    }

    if (!path) return currentFolder;

    const parts = path.split("/").map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      const folders = currentFolder.getFoldersByName(part);
      currentFolder = folders.hasNext() ? folders.next() : currentFolder.createFolder(part);
    }
    return currentFolder;
  },

  extractId: function(value) {
    if (!value || typeof value !== "string") return { id: null, type: null };
    const trimmed = value.trim();
    
    const patterns = {
      textFunction: /text\("([a-zA-Z0-9_-]{20,})"\)/,
      folder: /\/folders\/([a-zA-Z0-9_-]{20,})/,
      file: /\/file\/d\/([a-zA-Z0-9_-]{20,})/,
      pure: /^([a-zA-Z0-9_-]{20,})$/
    };

    if (patterns.textFunction.test(trimmed)) return { id: trimmed.match(patterns.textFunction)[1], type: "file" };
    if (patterns.folder.test(trimmed)) return { id: trimmed.match(patterns.folder)[1], type: "folder" };
    if (patterns.file.test(trimmed)) return { id: trimmed.match(patterns.file)[1], type: "file" };
    if (patterns.pure.test(trimmed)) return { id: trimmed.match(patterns.pure)[1], type: "file" };

    return { id: null, type: null };
  },

  buildUrl: function(id, type = "file") {
    if (!id || typeof id !== "string") throw new Error("ID do Drive inválido");
    return type === "folder" 
      ? `https://drive.google.com/drive/folders/${id.trim()}`
      : `https://drive.google.com/file/d/${id.trim()}/view`;
  }
};