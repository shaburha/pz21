const Documents = require('../data/documents');

/** GET / — список документов (с фильтром по статусу ?status=...). */
function list(req, res) {
  const { status } = req.query;
  const all = Documents.getAll();
  const documents = Documents.STATUSES[status] ? all.filter((doc) => doc.status === status) : all;

  res.render('index', {
    title: 'Документы',
    documents,
    total: all.length,
    statuses: Documents.STATUSES,
    currentStatus: Documents.STATUSES[status] ? status : '',
  });
}

/** GET /item/:id — детальная страница документа. */
function show(req, res, next) {
  const id = Number(req.params.id);
  const document = Number.isInteger(id) ? Documents.getById(id) : null;

  if (!document) {
    // Нет такого документа — передаём управление дальше, до middleware 404.
    return next();
  }

  res.render('item', {
    title: document.title,
    document,
    statuses: Documents.STATUSES,
  });
}

/** GET /add — форма добавления документа. */
function addForm(req, res) {
  res.render('add', {
    title: 'Новый документ',
    statuses: Documents.STATUSES,
    errors: [],
    values: { title: '', content: '', status: 'draft', collaborators: '' },
  });
}

/** POST /add — валидация, добавление в массив и редирект на главную. */
function create(req, res) {
  const values = {
    title: (req.body.title || '').trim(),
    content: (req.body.content || '').trim(),
    status: req.body.status || 'draft',
    collaborators: (req.body.collaborators || '').trim(),
  };

  const errors = [];
  if (values.title.length < 3) {
    errors.push('Название должно содержать минимум 3 символа.');
  }
  if (Documents.getAll().some((doc) => doc.title.toLowerCase() === values.title.toLowerCase())) {
    errors.push('Документ с таким названием уже существует.');
  }
  if (!Documents.STATUSES[values.status]) {
    errors.push('Выбран неизвестный статус.');
  }

  const collaborators = values.collaborators
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
  if (collaborators.some((email) => !/^\S+@\S+\.\S+$/.test(email))) {
    errors.push('Участники указываются через запятую в формате email.');
  }

  if (errors.length > 0) {
    // Повторно показываем форму с ошибками и уже введёнными значениями.
    return res.status(400).render('add', {
      title: 'Новый документ',
      statuses: Documents.STATUSES,
      errors,
      values,
    });
  }

  Documents.create({
    title: values.title,
    content: values.content,
    status: values.status,
    owner: req.user.email,
    collaborators,
  });

  res.redirect(`/${res.locals.authQuery}`);
}

module.exports = {
  list,
  show,
  addForm,
  create,
};
