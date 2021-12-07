const express = require("express");
const session = require("express-session");
const jwt = require("jsonwebtoken");

const env_lib = require("dotenv");
env_lib.config();

const PORT = process.env["PORT"] ? parseInt(process.env["PORT"]) : 3001;

console.log(process.env);

// these should match the settings in your Metabase instance
let MB_SITE_URL = process.env['MB_SITE_URL'];
let MB_EMBEDDING_SECRET_KEY = process.env['MB_EMBEDDING_SECRET_KEY'];
let manager = process.env['MANAGER'];
let MOCK_ID = 42;

// the dashboard ID of a dashboard that has a `user_id` parameter
const DASHBOARD_ID = 32;

function checkAuth(req, res, next) {
    const userId = req.session.userId;
    if(userId) {
        return next();
    }
    req.session.redirectTo = req.path;
    return res.redirect('/login');
}

if (!MB_EMBEDDING_SECRET_KEY) {
    throw new Error("Please set MB_EMBEDDING_SECRET_KEY.");
}
if (typeof DASHBOARD_ID !== "number" || isNaN(DASHBOARD_ID)) {
  throw new Error("Please set DASHBOARD_ID.");
}

const app = express();

app.set("view engine", "pug");
app.use(session({ secret: "FIXME", resave: false, saveUninitialized: true }));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.render("index"));

// basic auth routes,
// you should replace this with the auth scheme of your choice
app.route("/login")
    .get((req, res) => {
      res.render("login")
    })
    .post((req, res) => {
      const { username, password, redirect } = req.body;
      if(username === 'admin' && password === 'admin') {
          // set a user id for our 'admin' user. you'd do user lookup here
          req.session.userId = 1;
          res.redirect(req.session.redirectTo);
      } else {
          res.redirect('/login');
      }
    });

app.get("/logout", (req, res) => {
    delete req.session.userId;
    res.redirect("/");
});

app.get("/signed_chart", checkAuth, (req, res) => { 
    var payload = {
        resource: { dashboard: DASHBOARD_ID },
        params: { "gerente": manager},
        exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
    };

    var token = jwt.sign(payload, MB_EMBEDDING_SECRET_KEY);

    var iframeUrl = MB_SITE_URL + "/embed/dashboard/" + token + "#bordered=true&titled=true";
    res.render("chart", { userId: MOCK_ID, iframeUrl: iframeUrl });
})

app.get("/signed_dashboard/:id", checkAuth, (req, res) => {
    const userId = req.session.userId;
    const unsignedToken = {
        resource: { dashboard: DASHBOARD_ID },
        params: { },
        exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
    };
    // sign the JWT token with our secret key
    const signedToken = jwt.sign(unsignedToken, MB_EMBEDDING_SECRET_KEY);

    // construct the URL of the iframe to be displayed
    const iframeUrl = `${MB_SITE_URL}/embed/dashboard/${signedToken}`;
    res.render("dashboard", { userId: MOCK_ID, iframeUrl: iframeUrl });
})

app.get("/signed_public_dashboard/", (req, res) => {
  const userId = req.session.userId;
  const unsignedToken = {
      resource: { dashboard: 1 },
      params: { },
      exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
  };
  // sign the JWT token with our secret key
  const signedToken = jwt.sign(unsignedToken, MB_EMBEDDING_SECRET_KEY);
  // construct the URL of the iframe to be displayed
  const iframeUrl = `${MB_SITE_URL}/embed/dashboard/${signedToken}`;
  res.render("public_dashboard", { iframeUrl: iframeUrl });
})

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT + "!");
});
