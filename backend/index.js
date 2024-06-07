const express = require('express');
const db = require('./db');
const md5 = require('md5');
const api = require('./api');
const CookieParser = require('./middleware/cookieParser');
const Auth = require('./middleware/auth');

const { PORT, ADDR_PREFIX, DEV_MODE, APP_NAME } = require('./config');

const app = express();
app.use(express.json());
app.use(CookieParser);
app.use(Auth.createSession);

// Logger if in Dev Mode
if (DEV_MODE) {
  app.use('/', (req, res, next) => {
    console.log(req.session?.user?.email, req.method, req.path, req.body || '');
    next();
  })
}

// Serve static code and assets
app.use(`${ADDR_PREFIX}/`, express.static('../frontend/dist/'))

app.get(`${ADDR_PREFIX}/verify`, Auth.verifySession, (req, res) => {
  res.status(200);
  res.json({
    ...(req.session.user),
    gravatar_link: 'https://www.gravatar.com/avatar/' + md5(req.session.user.email),
    ADDR_PREFIX: ADDR_PREFIX,
  });
});

// API routes


class APIRoute {
  constructor(path, methodFuncs, children) {
    this.path = path;
    this.methodFuncs = methodFuncs ?? {};
    this.children = children ?? [];
  }

  setup(parentPath) {
    const path = parentPath + this.path;
    console.log(path);
    app.all(path, Auth.verifySession, async (req, res) => {
      const method = req.method.toUpperCase();
      console.log('APIRoute', path, method, req.session, req.params, req.body);
      if (method in this.methodFuncs) {
        const [status, data] = await this.methodFuncs[method](req);
        res.status(status);
        if (data !== undefined) return res.json(data);
      }
      return res.end();
    })
    for (const child of this.children) {
      child.setup(path);
    }
  }
}

const apiRoutes = new APIRoute('/api', { GET: () => console.log('TODO') }, [
  new APIRoute('/users', { GET: (req) => api.users.getMany() }, [
    new APIRoute('/:id', {
      GET: (req) => api.users.getOne({ id: req.params.id }),
      DELETE: api.users.del,
    }),
  ]),
]);

apiRoutes.setup(ADDR_PREFIX);

// authentication routes
app.post(`${ADDR_PREFIX}/logout`, async (req, res) => {
  try {
    await api.session.del({ id: req.session.id })
    res.clearCookie('budgeteerid', req.session.id);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.post(`${ADDR_PREFIX}/authorize`, async (req, res) => {
  try {  
    const [_, user] = await api.users.getOne({ email: req.body.email }, true);
    if (user) {
      req.loginId = user.id;
      const isValidUser = api.users.validatePassword(req.body.password, user.password, user.salt);
      if (isValidUser) {
        return res.sendStatus(200);
      } else {
        return res.sendStatus(401);
      }
    } else {
      return res.sendStatus(401);
    }
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

app.post(`${ADDR_PREFIX}/login`, async (req, res) => {
  try {  
    const [_, user] = await api.users.getOne({ email: req.body.email }, true);
    if (user) {
      req.loginId = user.id;
      const isValidUser = api.users.validatePassword(req.body.password, user.password, user.salt);
      if (isValidUser) {
        await api.session.put({ id: req.session.id }, { user_id: req.loginId });
        res.sendStatus(200);
      } else {
        return res.sendStatus(401);
      }
    } else {
      return res.sendStatus(401);
    }
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

app.post(`${ADDR_PREFIX}/signup`, async (req, res) => {
  try {
    const data = await api.users.post( req.body );
    try {
      await api.session.put({ id: req.session.id }, { user_id: data.insertId });
      res.status(201);
      return res.redirect(`${ADDR_PREFIX}/`);
    } catch (err) {
      console.error(err);
      return res.sendStatus(500);
    }
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400);
      return res.end('username or email taken')
    } else if (err.message === 'malformed email') {
      res.status(400);
      return res.end('malformed email')
    } else if (err.message === 'malformed username') {
      res.status(400);
      return res.end('malformed username')
    }
    return res.sendStatus(500);
  }
});


app.get(`${ADDR_PREFIX}/*`, (req, res) => {
  res.end(`
<!DOCTYPE html>
<html>
    <head>
        <title>${APP_NAME}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans&family=Raleway&family=Roboto&display=swap" rel="stylesheet">
        </head>
        <body>
        <div id="app"></div>
        <script>window.ADDR_PREFIX = '${ADDR_PREFIX}';</script>
        <script src="${ADDR_PREFIX}/bundle.js"></script>
    </body>
</html>
  `);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});