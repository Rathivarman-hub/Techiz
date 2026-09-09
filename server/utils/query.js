export const normalizePagination = (req, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || String(defaultLimit), 10)));
  const sortField = req.query.sortField || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const skip = (page - 1) * limit;

  return { page, limit, skip, sort: { [sortField]: sortOrder } };
};

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

export const normalizeQuestionFilter = (req) => {
  const filter = {};
  const { language, type, difficulty, search } = req.query;

  if (language && typeof language === 'string') filter.language = language;
  if (type && typeof type === 'string') filter.type = type;
  if (difficulty && typeof difficulty === 'string') filter.difficulty = difficulty;
  if (search && typeof search === 'string') {
    filter.question = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }

  return filter;
};
