```js
const store = require('../data/postStore');

function listPosts(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const requestedLimit = Math.max(Number(query.limit) || 20, 1);

  // Cap the client-supplied limit to prevent excessively large requests.
  const limit = Math.min(requestedLimit, 100);

  const posts = store.getAllPosts();

  const total = posts.length;
  const pages = Math.ceil(total / limit);

  const start = (page - 1) * limit;
  const data = posts.slice(start, start + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      pages
    }
  };
}

function getPost(id) {
  return store.getPostById(id);
}

function createPost(body = {}) {
  return store.createPost({
    title: body.title,
    author: body.author
  });
}

function likePost(id) {
  const post = store.incrementLikes(id);

  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';

    throw err;
  }

  return post;
}

function explode() {
  const err = new Error('Internal service failure');
  err.statusCode = 500;
  err.code = 'INTERNAL_ERROR';

  throw err;
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  likePost,
  explode
};
```
