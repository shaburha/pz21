const path = require('path');
const express = require('express');

const logger = require('./middleware/logger');
const { identifyUser } = require('./middleware/auth');
const { notFound, serverError } = require('./middleware/errorHandlers');
const documentsRouter = require('./routes/documents');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Настройка шаблонизатора EJS ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper-функции, доступные во всех шаблонах.
app.locals.formatDate = (date) =>
  new Date(date).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
app.locals.appName = 'CollabDocs';

// --- Middleware (порядок важен: выполняются сверху вниз) ---
app.use(logger); // 1. логирование каждого запроса
app.use(express.static(path.join(__dirname, 'public'))); // 2. статика (CSS)
app.use(express.urlencoded({ extended: true })); // 3. разбор данных HTML-форм в req.body
app.use(identifyUser); // 4. имитация авторизации (?auth=1)

// --- Маршруты ---
app.use('/', documentsRouter);

app.get('/login', (req, res) => {
  const returnTo = typeof req.query.returnTo === 'string' && req.query.returnTo.startsWith('/') ? req.query.returnTo : '/';
  res.render('login', { title: 'Вход', returnTo });
});

// Маршрут для демонстрации обработки ошибки 500.
app.get('/error', () => {
  throw new Error('Тестовая ошибка: сбой при синхронизации документа');
});

// --- Обработка ошибок (строго после всех маршрутов) ---
app.use(notFound);
app.use(serverError);

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
