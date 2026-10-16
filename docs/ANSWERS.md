# Ответы на контрольные вопросы

Практическое занятие №1. Middleware и шаблонизаторы. Где возможно, примеры взяты из кода этого проекта.

---

### 1. Что такое middleware в Express.js и какова его сигнатура (параметры)?

Middleware (промежуточный обработчик) — функция, которая получает запрос до того, как на него ответит конечный обработчик, и может: выполнить любой код, изменить `req`/`res`, завершить цикл «запрос–ответ» (отправить ответ) или передать управление следующему middleware вызовом `next()`.

Сигнатура обычного middleware — три параметра:

```js
function middleware(req, res, next) { /* ... */ next(); }
```

- `req` — объект запроса (URL, заголовки, `params`, `query`, `body`);
- `res` — объект ответа (`send`, `json`, `render`, `redirect`, `status`);
- `next` — функция передачи управления дальше по цепочке.

Middleware обработки ошибок имеет четыре параметра: `(err, req, res, next)`.

### 2. Какой порядок выполнения middleware в Express? Что влияет на порядок?

Middleware и маршруты выполняются **строго в порядке регистрации** (`app.use`, `app.get` и т. д.) сверху вниз в коде. Express проходит по стеку и вызывает каждый слой, чей путь и метод подходят запросу. Цепочка продолжается, только если текущий слой вызвал `next()`; если он отправил ответ — обработка заканчивается.

На порядок влияют:
- место вызова `app.use()`/`router.use()` в коде;
- путь монтирования (middleware с `app.use('/admin', ...)` вызовется только для `/admin...`);
- HTTP-метод (у `app.get` — только GET);
- вызов `next()`, `next('route')` (пропустить оставшиеся обработчики маршрута) или `next(err)` (перейти сразу к обработчикам ошибок).

В проекте ([server.js](../server.js)): `logger` → `express.static` → `express.urlencoded` → `identifyUser` → маршруты → `notFound` → `serverError`.

### 3. Как передать данные из маршрута в шаблон EJS? Приведите пример.

Вторым аргументом `res.render()` — объектом, ключи которого становятся переменными шаблона:

```js
// controllers/documentsController.js
res.render('item', { title: document.title, document, statuses: Documents.STATUSES });
```

```ejs
<!-- views/item.ejs -->
<h1><%= document.title %></h1>
<dd><%= document.owner %></dd>
```

Дополнительно данные можно передать через `res.locals` (на один запрос, например, из middleware) и `app.locals` (глобально для всех шаблонов).

### 4. Что такое `next()` и что произойдёт, если его не вызвать в middleware?

`next()` — функция, передающая управление следующему middleware/обработчику в стеке. Варианты: `next()` — дальше; `next('route')` — к следующему маршруту; `next(err)` — к обработчикам ошибок.

Если middleware не вызвал `next()` и не отправил ответ, запрос **«повиснет»**: клиент будет ждать, пока не сработает таймаут. Поэтому каждый middleware должен либо вызвать `next()`, либо завершить ответ (`res.send`, `res.render`, `res.redirect`...). Вызывать и то и другое тоже нельзя — это приведёт к ошибке `Cannot set headers after they are sent`.

### 5. Как создать middleware для обработки ошибок (с четырьмя параметрами)?

Объявить функцию ровно с четырьмя параметрами — по количеству аргументов (`fn.length === 4`) Express отличает её от обычного middleware — и подключить **после** всех маршрутов:

```js
// middleware/errorHandlers.js
function serverError(err, req, res, next) {
  console.error(`[ОШИБКА] ${req.method} ${req.originalUrl}:`, err.stack);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).render('500', { title: 'Ошибка сервера', message: err.message });
}

app.use(serverError);
```

Даже если `next` не используется, его нельзя убирать из списка параметров — иначе функция станет обычным middleware.

### 6. В чём разница между `app.use()` и `app.METHOD()` (например, `app.get()`)?

| | `app.use(path, fn)` | `app.get(path, fn)` |
| --- | --- | --- |
| HTTP-методы | любые | только указанный (GET) |
| Сопоставление пути | по **префиксу**: `app.use('/docs')` сработает для `/docs`, `/docs/1`, `/docs/a/b` | **точное** совпадение с шаблоном пути: `/docs/:id` |
| Путь по умолчанию | `/` (все запросы) | обязателен |
| `req.url` внутри | префикс монтирования отрезается (`/docs/1` → `/1`) | не меняется |
| Назначение | общие middleware, монтирование роутеров | конечные обработчики маршрутов |

### 7. Как в EJS использовать циклы и условные операторы? Напишите пример вывода списка.

В тегах `<% %>` пишется обычный JavaScript (без вывода), в `<%= %>` — выражение с выводом:

```ejs
<% if (documents.length === 0) { %>
  <p>Документов нет.</p>
<% } else { %>
  <ul>
    <% documents.forEach((doc) => { %>
      <li>
        <a href="/item/<%= doc.id %>"><%= doc.title %></a>
        <% if (doc.status === 'published') { %>(опубликован)<% } %>
      </li>
    <% }) %>
  </ul>
<% } %>
```

Можно использовать и `for (const doc of documents) { ... }`, `for (let i = 0; ...)`, тернарный оператор: `<%= key === currentStatus ? 'selected' : '' %>`.

### 8. Что такое `partials` (частичные шаблоны) в EJS и как их подключить?

Partials — небольшие шаблоны-фрагменты (шапка, подвал, карточка, бейдж), которые вставляются в другие шаблоны, чтобы не дублировать разметку. Подключаются функцией `include` с тегом `<%-` (без экранирования, иначе HTML фрагмента выведется как текст):

```ejs
<%- include('partials/header') %>
...
<%- include('partials/status-badge', { status: doc.status }) %>
...
<%- include('partials/footer') %>
```

Путь указывается относительно текущего шаблона, расширение `.ejs` можно не писать. Вторым аргументом передаются дополнительные локальные переменные.

### 9. Как в EJS передать массив объектов и отрендерить его в таблицу?

```js
res.render('index', { documents: Documents.getAll() });
```

```ejs
<table>
  <thead>
    <tr><th>#</th><th>Название</th><th>Владелец</th></tr>
  </thead>
  <tbody>
    <% documents.forEach((doc) => { %>
      <tr>
        <td><%= doc.id %></td>
        <td><%= doc.title %></td>
        <td><%= doc.owner %></td>
      </tr>
    <% }) %>
  </tbody>
</table>
```

Полный пример — [views/index.ejs](../views/index.ejs).

### 10. Как реализовать middleware, которое выполняется только для определённого маршрута?

Способы:

1. Передать его в маршрут перед обработчиком:
   ```js
   router.get('/add', requireAuth, controller.addForm);
   ```
2. Смонтировать на путь: `app.use('/admin', adminOnly);` — сработает для `/admin` и всех вложенных путей.
3. Подключить к отдельному роутеру: `adminRouter.use(adminOnly); app.use('/admin', adminRouter);`.
4. Через `router.route('/add').all(requireAuth).get(...).post(...)`.

### 11. Как в Express отличить middleware для статики (`express.static`) от других?

`express.static(root)` — встроенный middleware, который ищет файл, соответствующий `req.path`, в указанной папке. Если файл найден — сам отправляет его (с `Content-Type`, `ETag`, `Last-Modified`, поддержкой кэша и кодом 304) и **не вызывает `next()`**. Если файла нет — вызывает `next()`, и запрос идёт к следующим middleware и маршрутам. Он реагирует только на GET и HEAD.

Отличить его можно по назначению и по поведению: он не изменяет `req`, а только отвечает файлами. В коде он обычно подключается одной строкой: `app.use(express.static(path.join(__dirname, 'public')))`, а при монтировании на префикс — `app.use('/static', express.static('public'))`.

### 12. Как реализовать middleware для проверки, авторизован ли пользователь (имитация по сессии)?

С пакетом `express-session` данные пользователя сохраняются в `req.session` после входа, а middleware проверяет их:

```js
const session = require('express-session');
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: false }));

app.post('/login', (req, res) => {
  req.session.user = { name: 'Иван Иванов' }; // имитация успешного входа
  res.redirect('/');
});

function requireAuth(req, res, next) {
  if (req.session.user) {
    req.user = req.session.user;
    return next();
  }
  res.redirect('/login');
}

app.get('/add', requireAuth, controller.addForm);
```

В этом проекте по заданию используется имитация через query-параметр `?auth=1` ([middleware/auth.js](../middleware/auth.js)): `identifyUser` выставляет `req.user`, а `requireAuth` перенаправляет гостя на `/login`.

### 13. Какая разница между `res.render()` и `res.send()`? Когда что использовать?

- `res.render(view, data)` — прогоняет шаблон через view engine (EJS), подставляет данные и отправляет **получившийся HTML** с `Content-Type: text/html`. Используется для серверного рендеринга страниц.
- `res.send(body)` — отправляет **готовые данные как есть**: строку (`text/html`), Buffer (`application/octet-stream`), объект/массив (превращается в JSON). Используется для простых ответов, текста, API (хотя для JSON нагляднее `res.json()`).

Итого: страница из шаблона → `render`; короткий текст, бинарные данные, ответ API → `send`/`json`.

### 14. Как обработать ошибку в асинхронном middleware (без `try/catch`)?

1. **Express 5** (используется в проекте) сам перехватывает отклонённые промисы и исключения в `async`-обработчиках и передаёт их в `next(err)`:
   ```js
   app.get('/docs/:id', async (req, res) => {
     const doc = await loadDocument(req.params.id); // ошибка уйдёт в error handler
     res.render('item', { document: doc });
   });
   ```
2. В **Express 4** — обёртка, которая ловит ошибку промиса через `.catch(next)`:
   ```js
   const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
   app.get('/docs/:id', asyncHandler(async (req, res) => { /* ... */ }));
   ```
   либо готовый пакет `express-async-errors` / `express-async-handler`.
3. Для промисов без `async/await`: `loadDocument(id).then(...).catch(next)`.

### 15. Как в EJS задать "базовый шаблон" (layout), чтобы не повторять `<html><head>` на каждой странице?

EJS не поддерживает layout «из коробки», поэтому есть два подхода:

1. **Partials «шапка/подвал»** (используется в проекте): общая разметка вынесена в `partials/header.ejs` (открывает `<html>`, `<head>`, `<body>`, `<main>`) и `partials/footer.ejs` (закрывает их), каждая страница подключает их в начале и в конце:
   ```ejs
   <%- include('partials/header') %>
   <h1>Содержимое страницы</h1>
   <%- include('partials/footer') %>
   ```
2. **Пакет `express-ejs-layouts`**: создаётся `views/layout.ejs` с `<%- body %>` в месте вставки содержимого страницы:
   ```js
   const expressLayouts = require('express-ejs-layouts');
   app.use(expressLayouts);
   app.set('layout', 'layout');
   ```
   ```ejs
   <!-- views/layout.ejs -->
   <html><head><title><%= title %></title></head>
   <body><%- body %></body></html>
   ```

### 16. Где в Express лучше определять middleware – до или после маршрутов? Почему?

Зависит от назначения, потому что middleware выполняются в порядке регистрации:

- **До маршрутов** — всё, что должно подготовить запрос или сработать для каждого запроса: логирование, статика, парсеры тела (`express.json`, `express.urlencoded`), cookies, сессии, CORS, авторизация. Если поставить, например, `express.urlencoded` после маршрута, в обработчике `req.body` будет `undefined`.
- **После маршрутов** — то, что должно сработать, когда маршруты не справились: обработчик 404 (до него доходит запрос, который никто не обработал) и error-handling middleware (ловит ошибки из всего, что зарегистрировано выше).

### 17. Как с помощью middleware перехватить и изменить `req.body`?

Подключить своё middleware **после** парсера тела (до него `req.body` ещё не заполнен) и изменить объект:

```js
app.use(express.urlencoded({ extended: true }));

// Обрезаем пробелы во всех строковых полях формы
function trimBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') req.body[key] = req.body[key].trim();
    }
  }
  next();
}

app.use(trimBody);
```

Так же можно добавлять поля (`req.body.owner = req.user.email`), удалять лишнее, приводить типы, санитизировать данные.

### 18. Можно ли использовать несколько middleware последовательно для одного маршрута? Приведите пример.

Да. Их можно перечислить через запятую или массивом — они выполнятся по порядку, каждый должен вызвать `next()`:

```js
router.post('/add', requireAuth, validateDocument, controller.create);
// или
const guards = [requireAuth, checkRole('editor')];
router.post('/add', guards, controller.create);
```

В проекте: `router.post('/add', requireAuth, controller.create)` — сначала проверка авторизации, затем создание документа.

### 19. Как в EJS получить доступ к переменной, переданной в `res.render()`, внутри частичного шаблона?

Partial, подключённый через `include`, **автоматически получает все переменные** родительского шаблона (переданные в `res.render`, а также `res.locals` и `app.locals`). Например, `partials/header.ejs` в проекте использует `title`, `user`, `authQuery`, `appName`, хотя явно их не получает.

Не передаются только локальные переменные, объявленные внутри родительского шаблона (например, переменная цикла `doc`). Их нужно передать вторым аргументом:

```ejs
<% documents.forEach((doc) => { %>
  <%- include('partials/status-badge', { status: doc.status }) %>
<% }) %>
```

### 20. Как реализовать middleware, которое добавляет к ответу общий заголовок (например, `X-Powered-By`)?

```js
app.disable('x-powered-by'); // убрать стандартный "X-Powered-By: Express"

app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'CollabDocs');
  res.set('X-App-Version', '1.0.0');
  next();
});
```

Middleware подключается до маршрутов, чтобы заголовок был выставлен до отправки ответа. Отключение стандартного заголовка ещё и полезно для безопасности — не раскрывается используемая технология.

### 21. Какие middleware «из коробки» предоставляет Express для обработки форм (urlencoded)?

- `express.urlencoded({ extended: true })` — разбирает тело с `Content-Type: application/x-www-form-urlencoded` (обычная HTML-форма `method="post"`) и кладёт результат в `req.body`. `extended: true` — разбор библиотекой `qs` с поддержкой вложенных объектов и массивов (`user[name]=...`), `false` — простой `querystring`. Есть опции `limit` (максимальный размер тела) и `parameterLimit`.
- `express.json()` — для `application/json` (формы, отправленные через `fetch`).
- `express.text()` и `express.raw()` — тело как строка / Buffer.

Формы с файлами (`multipart/form-data`) встроенными средствами не разбираются — нужен сторонний пакет, например `multer`.

### 22. Как в Express отключить стандартный HTML-вывод ошибок? Как вернуть JSON-ошибку?

Стандартный обработчик Express выводит HTML-страницу со стеком (в режиме разработки). Чтобы его не использовать, нужно определить свой error-handling middleware последним и отвечать в нём сам. Стек скрывается и при `NODE_ENV=production`.

```js
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});
```

Аналогично для 404 в API: `app.use((req, res) => res.status(404).json({ error: 'Not found' }))`. Можно также выбирать формат по заголовку `Accept` через `res.format()` или `req.accepts('json')`.

### 23. Как в EJS подключить внешний CSS и JS (правильный путь в статических файлах)?

1. Подключить статику: `app.use(express.static(path.join(__dirname, 'public')))`.
2. Положить файлы в `public/` (`public/css/style.css`, `public/js/app.js`).
3. В шаблоне указывать путь **от корня сайта без слова `public`** и с ведущим `/`:
   ```ejs
   <link rel="stylesheet" href="/css/style.css">
   <script src="/js/app.js" defer></script>
   ```

Ведущий `/` важен: относительный путь `css/style.css` на странице `/item/1` превратится в `/item/css/style.css` и не найдётся. Если статика смонтирована с префиксом (`app.use('/static', express.static('public'))`), то путь — `/static/css/style.css`. Внешние библиотеки с CDN подключаются полным URL.

### 24. Как реализовать middleware, которое измеряет время выполнения запроса и записывает его в консоль?

Запомнить время в начале и вычислить разницу в обработчике события `finish` объекта ответа (оно срабатывает после отправки ответа):

```js
// middleware/logger.js (упрощённо)
function logger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms.toFixed(1)} мс)`);
  });
  next();
}
```

Подключается первым, чтобы замер охватывал все остальные middleware. Готовое решение — пакет `morgan` (формат `:response-time`).

### 25. Как в Express реализовать защиту от CSRF с помощью middleware (теоретически)?

CSRF-атака — вредоносный сайт заставляет браузер пользователя отправить запрос на наш сайт с его cookies. Защита через middleware по схеме **synchronizer token**:

1. При выдаче формы сервер генерирует случайный токен (`crypto.randomBytes(32)`), сохраняет его в сессии и передаёт в шаблон.
2. Шаблон кладёт токен в скрытое поле: `<input type="hidden" name="_csrf" value="<%= csrfToken %>">`.
3. Middleware на всех изменяющих запросах (POST/PUT/PATCH/DELETE) сравнивает токен из тела/заголовка с токеном из сессии; при несовпадении — ответ 403.

```js
function csrfProtection(req, res, next) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const token = req.body._csrf || req.get('x-csrf-token');
  if (token !== req.session.csrfToken) return res.status(403).send('Неверный CSRF-токен');
  next();
}
```

Дополнительно: cookies с атрибутом `SameSite=Lax/Strict`, проверка заголовков `Origin`/`Referer`, схема double submit cookie. Готовые пакеты: `csrf-csrf`, `csrf-sync` (старый `csurf` устарел).

### 26. Как в EJS использовать функцию helper (например, для форматирования даты) в шаблоне?

Передать функцию в шаблон так же, как данные. Чтобы она была доступна во всех шаблонах — положить в `app.locals`:

```js
// server.js
app.locals.formatDate = (date) =>
  new Date(date).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
```

```ejs
<td><%= formatDate(doc.updatedAt) %></td>
```

Альтернативы: передать в конкретный `res.render('page', { formatDate })`, через `res.locals` в middleware, или подключить целую библиотеку: `app.locals.dayjs = require('dayjs')`.

### 27. Почему middleware для статики обычно подключается до всех маршрутов?

1. **Производительность**: запрос за CSS/JS/картинкой сразу обслуживается и не проходит через лишние middleware (авторизацию, парсинг тела, сессии, обращения к БД).
2. **Корректность**: если статика стоит после обработчика 404 или после middleware, требующего авторизацию, файлы стилей не загрузятся (вернётся 404 или редирект на `/login`) — в том числе на самой странице входа.
3. **Конфликты путей**: маршрут вроде `app.get('/:slug')` перехватил бы `/style.css`.

Логгер при этом часто ставят ещё раньше статики, чтобы видеть и запросы файлов (как в проекте).

### 28. Как в Express реализовать middleware, которое блокирует запросы с определённого IP-адреса?

```js
const BLOCKED_IPS = new Set(['203.0.113.5', '::ffff:203.0.113.5']);

function ipBlocker(req, res, next) {
  if (BLOCKED_IPS.has(req.ip)) {
    return res.status(403).send('Доступ запрещён');
  }
  next();
}

app.use(ipBlocker); // подключается одним из первых
```

`req.ip` — адрес клиента; IPv4 может приходить в IPv6-виде `::ffff:x.x.x.x`. Если приложение стоит за прокси (nginx, балансировщик), нужно включить `app.set('trust proxy', true)`, иначе `req.ip` будет адресом прокси. Для диапазонов (CIDR) используют пакеты вроде `ipaddr.js`, `express-ipfilter`.

### 29. Как в EJS отрендерить переменную без HTML-экранирования (опасно)?

Тегом `<%-` вместо `<%=`:

```ejs
<%= html %>   <!-- экранирует: <b> выведется как текст &lt;b&gt; -->
<%- html %>   <!-- вставляет как есть: <b> станет жирным текстом -->
```

Опасность — **XSS**: если в переменной окажутся пользовательские данные (например, `<script>...</script>` в названии документа), скрипт выполнится в браузерах всех, кто откроет страницу. Поэтому `<%-` применяют только для доверенного HTML: подключения partials (`<%- include(...) %>`) и разметки, которую сформировал сам сервер или которая прошла санитизацию (например, `sanitize-html`, DOMPurify).

### 30. Как в Express организовать `error-handling` middleware, которая ловит все ошибки приложения?

1. Зарегистрировать error-handling middleware (4 параметра) **последним**, после всех маршрутов и обработчика 404.
2. Сделать так, чтобы ошибки до него доходили:
   - синхронные `throw` в обработчиках Express ловит сам;
   - в асинхронном коде — Express 5 ловит отклонённые промисы `async`-функций автоматически, в Express 4 — `next(err)` / обёртка `asyncHandler`;
   - в колбэках (`fs.readFile(..., (err) => ...)`) — вручную `next(err)`.
3. В обработчике: залогировать, проверить `res.headersSent`, выбрать код (`err.status || 500`), ответить страницей или JSON, не раскрывать стек в production.
4. Для ошибок вне цикла запроса — подписка на `process.on('unhandledRejection')` и `process.on('uncaughtException')` (логирование и корректный перезапуск).

```js
app.use(routes);
app.use(notFound);     // 404
app.use(serverError);  // (err, req, res, next) — ловит всё, что выше
```

Реализация в проекте — [middleware/errorHandlers.js](../middleware/errorHandlers.js), демонстрация — маршрут `GET /error`.
