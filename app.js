const express = require('express');
const app = express();
const path = require('path');
const posts = require('./posts.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', { posts });
});

app.get('/post/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    res.render('post', { post });
  } else {
    res.status(404).send('找不到這篇文章');
  }
});

module.exports = app;
