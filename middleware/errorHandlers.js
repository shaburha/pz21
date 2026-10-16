/**
 * Обработка ошибок.
 * Оба middleware подключаются в server.js ПОСЛЕ всех маршрутов.
 */

/**
 * 404: сюда доходит запрос, если ни один маршрут не отправил ответ.
 */
function notFound(req, res) {
  res.status(404).render('404', {
    title: 'Страница не найдена',
    url: req.originalUrl,
  });
}

/**
 * 500: error-handling middleware (четыре параметра — по ним Express
 * отличает его от обычного). Вызывается при throw в обработчике,
 * при отклонённом промисе (Express 5) или при next(err).
 */
function serverError(err, req, res, next) {
  console.error(`[ОШИБКА] ${req.method} ${req.originalUrl}:`, err.stack || err);

  // Если заголовки уже отправлены, отдаём ошибку стандартному обработчику Express.
  if (res.headersSent) {
    return next(err);
  }

  const status = Number(err.status) || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(status).render('500', {
    title: 'Ошибка сервера',
    status,
    message: err.message || 'Внутренняя ошибка сервера',
    // Стек показываем только в режиме разработки.
    stack: isDev ? err.stack : null,
  });
}

module.exports = {
  notFound,
  serverError,
};
