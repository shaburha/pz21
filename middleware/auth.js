/**
 * Имитация авторизации по query-параметру ?auth=1.
 * Настоящей проверки логина/пароля нет — это учебная заглушка.
 */

const DEMO_USER = { name: 'Иван Иванов', email: 'ivanov@example.com', isGuest: false };
const GUEST = { name: 'Гость', isGuest: true };

/**
 * Глобальное middleware: определяет текущего пользователя.
 * С ?auth=1 — демо-пользователь, без него — req.user = { name: 'Гость' }.
 * Данные кладутся в res.locals, чтобы быть доступными во всех шаблонах.
 */
function identifyUser(req, res, next) {
  const isAuthorized = req.query.auth === '1';

  req.user = isAuthorized ? DEMO_USER : GUEST;

  res.locals.user = req.user;
  // Суффикс для ссылок, чтобы не терять авторизацию при переходах между страницами.
  res.locals.authQuery = isAuthorized ? '?auth=1' : '';

  next();
}

/**
 * Middleware для защищённых маршрутов: гостя перенаправляет на /login.
 * В query передаётся адрес, куда вернуться после входа.
 */
function requireAuth(req, res, next) {
  if (req.user && !req.user.isGuest) {
    return next();
  }

  const returnTo = encodeURIComponent(req.path);
  res.redirect(`/login?returnTo=${returnTo}`);
}

module.exports = {
  identifyUser,
  requireAuth,
};
