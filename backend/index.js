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

// CORS Policy
app.use(function (_, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "https://scraparchive.com");
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Accept, X-PINGOTHER');
  // res.setHeader('Access-Control-Allow-Methods', '*');
  next();
});

// Serve static code and assets
// app.use(`${ADDR_PREFIX}/`, express.static('../frontend/dist/'));

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
    app.options(path, async (req, res) => {
      res.setHeader('Access-Control-Allow-Methods', Object.keys(this.methodFuncs).join(','));
      return res.end();
    });
    app.all(path, Auth.verifySession, async (req, res) => {
      const method = req.method.toUpperCase();
      console.log(path, method, Object.keys(this.methodFuncs))
      // console.log('APIRoute', path, method, req.session, req.params, req.body);
      if (method in this.methodFuncs) {
        const [status, data] = await this.methodFuncs[method](req);
        console.log(status, data)
        res.status(status);
        if (data !== undefined) return res.json(data);
      } else {
        return res.sendStatus(405);
      }
      return res.end();
    })
    for (const child of this.children) {
      child.setup(path);
    }
  }
}

async function frmtData(promise, callback) {
  const [status, data] = await promise;
  return [status, callback(data)];
}

const apiRoutes = new APIRoute('/api', {}, [
  new APIRoute('/users', { GET: () => api.users.getMany() }, [
    new APIRoute('/:id', {
      GET: (req) => api.users.getOne({ id: req.params.id }),
      PUT: (req) => api.users.put(req.session.user.id, req.params.id, req.body),
      DELETE: api.users.del,
    }),
  ]),
  new APIRoute('/scraps', {
    GET: (req) => api.scraps.getManyByUserID(req.session.user.id, false),
    POST: (req) => api.scraps.post(req.session.user.id, req.body),
  }, [
    new APIRoute('/next', {
      GET: (req) => api.scraps.getPileWithSort(req.session.user.id, req.query.sort ?? req.session.user.default_next, req.query.limit ?? 100, 4)
    }),
    new APIRoute('/:uuid', {
      GET: (req) => frmtData(api.scraps.getManyByUserID(req.session.user.id, true, { 'scrap.uuid': req.params.uuid }), scraps => scraps[0]),
      PUT: (req) => api.scraps.put(req.session.user.id, req.params.uuid, req.body),
    }),
  ]),
  new APIRoute('/buckets', {
    GET: (req) => api.buckets.getByUserID(req.session.user.id),
    POST: (req) => api.buckets.post(req.session.user.id, req.body),
  }, [
    new APIRoute('/permissions', {
      PUT: (req) => api.buckets.putPermissions(req.session.user.id, req.body),
    }),
    new APIRoute('/:bucketUUID', {
      GET: (req) => api.buckets.getOne(req.session.user.id, { 'bucket.uuid': req.params.bucketUUID }),
    }, [
      new APIRoute('/scraps', {
        GET: async (req) => {
          const [status1, bucket] = await api.buckets.getOne(req.session.user.id, { 'bucket.uuid': req.params.bucketUUID });
          if (status1 !== 200) return [status1];
          const [status2, scraps] = await api.scraps.getManyByUserID(req.session.user.id, false, { 'scrap.bucket_id': bucket.id });
          if (status2 !== 200) return [status2];
          return [200, {
            bucket,
            scraps,
          }];
        },
      }),
      new APIRoute('/children', {
        GET: (req) => api.buckets.getChildrenByUUID(req.session.user.id, req.params.bucketUUID),
      }),
    ]),
  ]),
  new APIRoute('/contacts', {
    GET: (req) => api.contacts.getByUserID(req.session.user.id),
    POST: (req) => api.contacts.postByUserID(req.session.user.id, req.body),
  }, [
    new APIRoute('/pending', {
      GET: (req) => api.contacts.getByUserID(req.session.user.id, false),
    }),
    new APIRoute('/:id', {
      PUT: (req) => api.contacts.putByUserAndContactID(req.session.user.id, req.params.id),
      DELETE: (req) => api.contacts.deleteByUserAndContactID(req.session.user.id, req.params.id),
    }),
  ]),
]);

apiRoutes.setup(ADDR_PREFIX);

// authentication routes
app.post(`${ADDR_PREFIX}/logout`, async (req, res) => {
  try {
    await api.session.del({ id: req.session.id })
    res.clearCookie('scraparchiveid', req.session.id);
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
        db.queryAsync('UPDATE user SET updated_at = ? WHERE id = ?;', [new Date(), req.loginId]);
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
  // res.redirect(301, 'https://scraparchive.com');
  res.end(`
<!DOCTYPE html>
<html>
    <head>
        <title>${APP_NAME}</title>
    </head>
    <body>
        <h1>Moved</h1>
        <p>Scrap Archive has moved, please go to <a href="https://scraparchive.com">scraparchive.com</a></p>
    </body>
</html>
  `);
//   res.end(`
// <!DOCTYPE html>
// <html>
//     <head>
//         <title>${APP_NAME}</title>
//         <meta charset="utf-8">
//         <meta name="viewport" content="initial-scale=1, width=device-width" />
//         <link rel="preconnect" href="https://fonts.googleapis.com">
//         <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
//         <link href="https://fonts.googleapis.com/css2?family=Open+Sans&family=Raleway&family=Roboto&display=swap" rel="stylesheet">
//     </head>
//     <body>
//         <div id="app"></div>
//         <script>window.ADDR_PREFIX = '${ADDR_PREFIX}';</script>
//         <script src="${ADDR_PREFIX}/bundle.js"></script>
//     </body>
// </html>
//   `);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});