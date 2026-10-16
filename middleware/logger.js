/**
 * Логирующее middleware: выводит в консоль время, метод и URL запроса,
 * а после отправки ответа — код статуса и длительность обработки.
 */
function logger(req, res, next) {
  const startedAt = Date.now();
  const time = new Date().toLocaleString('ru-RU');

  console.log(`[${time}] ${req.method} ${req.originalUrl}`);

  // Событие 'finish' срабатывает, когда ответ полностью отправлен клиенту.
  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    console.log(`[${time}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration} мс)`);
  });

  next();
}

module.exports = logger;
