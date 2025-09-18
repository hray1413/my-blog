const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'goblin-secret', resave: false, saveUninitialized: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const users = require('./users.json');
const postsPath = path.join(__dirname, 'posts.json');
const getPosts = () => JSON.parse(fs.readFileSync(postsPath));

// 中間件：保護 Dash 路由
function requireAuth(req, res, next) {
  if (req.session.authenticated) return next();
  res.redirect('/login');
}

// 登入頁面
app.get('/login', (req, res) => res.render('login'));

// 登入處理
app.post('/login', async (req, res) => {
  const user = users.find(u => u.username === req.body.username);
  if (user && await bcrypt.compare(req.body.password, user.passwordHash)) {
    req.session.authenticated = true;
    res.redirect('/dash');
  } else {
    res.send('帳號或密碼錯誤');
  }
});

// Dash 主頁（需登入）
app.get('/dash', requireAuth, (req, res) => {
  const posts = getPosts();
  res.render('dash', { posts });
});

// 新增文章頁面
app.get('/dash/new', requireAuth, (req, res) => res.render('new'));

// 新增文章處理
app.post('/dash/new', requireAuth, (req, res) => {
  const posts = getPosts();
  const id = `${slugify(req.body.title, { lower: true })}-${Date.now()}`;
  posts.push({ id, title: req.body.title, content: req.body.content });
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  res.redirect('/dash');
});

// 編輯文章頁面
app.get('/dash/edit/:id', requireAuth, (req, res) => {
  const post = getPosts().find(p => p.id === req.params.id);
  res.render('edit', { post });
});

// 編輯文章處理
app.post('/dash/edit/:id', requireAuth, (req, res) => {
  const posts = getPosts().map(p =>
    p.id === req.params.id ? { ...p, title: req.body.title, content: req.body.content } : p
  );
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  res.redirect('/dash');
});

// 刪除文章
app.post('/dash/delete/:id', requireAuth, (req, res) => {
  const posts = getPosts().filter(p => p.id !== req.params.id);
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  res.redirect('/dash');
});
