/**
 * Adds a one hour long calendar event to the caller's default calendar
 *
 * @param {string} eventName the name of the event
 * @param {string} startDatetime the starting date time of the event
 */

function createHourLongCalendarEvent(
  title,
  startDatetime,
  vendedorEmail,
  convidadoEmail
) {
  const eventName = typeof title === "string" ? title : "Evento Teste Marvio";
  const startDate = parseDateString(startDatetime);
  const vendedor =
    typeof vendedorEmail === "string"
      ? CalendarApp.getCalendarById(vendedorEmail)
      : CalendarApp.getDefaultCalendar();
  const endTime = addHoursToDate(startDate, 1);

  deletePreviousEvents(eventName, vendedor, startDate);

  // Configurando as opções do evento, incluindo os convidados
  const options = {
    description: "Você tem uma reunião de: " + eventName,
  };

  // Verifica se um e-mail de convidado foi passado e adiciona às opções
  if (typeof convidadoEmail === "string" && convidadoEmail.trim() !== "") {
    options.guests = convidadoEmail; // Para múltiplos convidados, separe por vírgula: 'email1@teste.com, email2@teste.com'
    options.sendInvites = true; // Opcional: Envia a notificação por e-mail para os convidados
  }

  var event = vendedor.createEvent(
    eventName,
    startDate,
    endTime,
    options // Passa o objeto de opções atualizado
  );

  console.log("Created event with id", event.getId());
}

function deletePreviousEvents(title, calendar, keepStartDate) {
  if (!title || !calendar || !(keepStartDate instanceof Date)) return;
  var windowStart = new Date(keepStartDate.getTime());
  windowStart.setFullYear(windowStart.getFullYear() - 1);
  var windowEnd = new Date(keepStartDate.getTime());
  windowEnd.setFullYear(windowEnd.getFullYear() + 1);

  var events = calendar.getEvents(windowStart, windowEnd, { search: title });
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    try {
      if (
        ev.getTitle() === title &&
        ev.getStartTime().getTime() !== keepStartDate.getTime()
      ) {
        console.log("Deleting previous event", ev.getId(), ev.getStartTime());
        ev.deleteEvent();
      }
    } catch (err) {
      console.log("Erro ao tentar deletar evento anterior:", err);
    }
  }
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  var calendar = CalendarApp.getDefaultCalendar();

  calendar.createEvent(
    data.titulo,
    parseDateString(data.inicio),
    parseDateString(data.fim),
    {
      description: data.descricao,
      location: data.local,
    }
  );

  return ContentService.createTextOutput("Evento criado").setMimeType(
    ContentService.MimeType.TEXT
  );
}

/**
 * Returns a new date with x hours added to it.
 * Meant as a helper function
 *
 * @param {Date} startingDate the starting date to add hours to
 * @param {number} hours number of hours to add
 * @return {Date} the new date
 */
function addHoursToDate(startingDate, hours) {
  var newDate = new Date(startingDate.getTime());
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
}

/**
 * Parseia strings em diferentes formatos em um objeto Date.
 * Aceita:
 *  - Strings no formato DDMMYYYYTHHMMSS ou DDMMYYYYHHMMSS
 *  - ISO 8601 ou outros formatos aceitos por new Date()
 *  - Objetos Date (retorna o mesmo)
 */
function parseDateString(input) {
  if (input instanceof Date) return input;
  if (typeof input !== "string" || input.trim() === "") return new Date();

  var match = input.match(/^(\d{2})(\d{2})(\d{4})T?(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    var day = parseInt(match[1], 10);
    var month = parseInt(match[2], 10) - 1;
    var year = parseInt(match[3], 10);
    var hours = parseInt(match[4], 10);
    var minutes = parseInt(match[5], 10);
    var seconds = parseInt(match[6], 10);
    return new Date(Date.UTC(year, month, day, hours + 3, minutes, seconds));
  }

  var isoMatch = input.match(
    /^(\d{4})-(\d{2})-(\d{2})T?(\d{2}):(\d{2}):(\d{2})(\.\d+)?([Z+-].*)?$/
  );
  if (isoMatch) {
    var y = parseInt(isoMatch[1], 10);
    var m = parseInt(isoMatch[2], 10) - 1;
    var d = parseInt(isoMatch[3], 10);
    var h = parseInt(isoMatch[4], 10);
    var min = parseInt(isoMatch[5], 10);
    var s = parseInt(isoMatch[6], 10);
    if (isoMatch[8]) {
      var parsedWithTz = new Date(input);
      if (!isNaN(parsedWithTz.getTime())) return parsedWithTz;
    }
    return new Date(Date.UTC(y, m, d, h + 3, min, s));
  }

  var parsed = new Date(input);
  if (!isNaN(parsed.getTime())) return parsed;
  return new Date();
}
