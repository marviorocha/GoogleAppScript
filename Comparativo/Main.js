function doPost(e) {
    try {
        if (!e) {
            return ContentService.createTextOutput(JSON.stringify({ error: 'No event object' }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        let body = null;
        if (e.postData && e.postData.contents) {
            try {
                body = JSON.parse(e.postData.contents);
            } catch (err) {
                return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid JSON in body', detail: err.toString() }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        } else if (e.parameter) {
            body = e.parameter;
        }

        let detalhes_proposta = null;
        if (body) {
            detalhes_proposta = body.data || body;
        }


        const config = {
            modeloId: '1gt6u879U2olNMnhK1SOrja1y5HA0lOk53_Cn5v91hng',
            baseFolderId: null
        };


        const presentationUrl = SlidesUtils.gerarApresentacaoDoModelo(detalhes_proposta, config);

        return ContentService.createTextOutput(JSON.stringify({ status: 'ok', url: presentationUrl }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        Logger.log('doPost error: ' + err);
        return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
