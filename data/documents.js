/**
 * Хранилище документов в памяти (без базы данных).
 * Данные живут, пока запущен процесс Node.js, и сбрасываются при перезапуске.
 */

const STATUSES = {
  draft: 'Черновик',
  in_review: 'На ревью',
  published: 'Опубликован',
};

const documents = [
  {
    id: 1,
    title: 'Техническое задание',
    content:
      'Описание системы совместного редактирования документов: роли пользователей, права доступа, история изменений.',
    status: 'published',
    owner: 'ivanov@example.com',
    collaborators: ['petrov@example.com', 'sidorova@example.com'],
    createdAt: new Date('2026-09-01T10:00:00Z'),
    updatedAt: new Date('2026-09-01T12:30:00Z'),
  },
  {
    id: 2,
    title: 'Протокол совещания',
    content: 'Решения по архитектуре realtime-синхронизации: WebSocket-канал на каждый открытый документ.',
    status: 'in_review',
    owner: 'petrov@example.com',
    collaborators: ['ivanov@example.com'],
    createdAt: new Date('2026-09-02T09:15:00Z'),
    updatedAt: new Date('2026-09-02T09:15:00Z'),
  },
  {
    id: 3,
    title: 'Черновик статьи',
    content: 'Введение в операционные преобразования (OT) и CRDT для совместного редактирования текста.',
    status: 'draft',
    owner: 'sidorova@example.com',
    collaborators: [],
    createdAt: new Date('2026-09-03T08:00:00Z'),
    updatedAt: new Date('2026-09-03T11:45:00Z'),
  },
];

let nextId = documents.length + 1;

function getAll() {
  return documents;
}

function getById(id) {
  return documents.find((doc) => doc.id === id) || null;
}

function create({ title, content, status, owner, collaborators }) {
  const now = new Date();
  const document = {
    id: nextId++,
    title,
    content,
    status,
    owner,
    collaborators,
    createdAt: now,
    updatedAt: now,
  };
  documents.push(document);
  return document;
}

module.exports = {
  STATUSES,
  getAll,
  getById,
  create,
};
