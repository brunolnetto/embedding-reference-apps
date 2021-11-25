const express = require("express");
const session = require("express-session");
const jwt = require("jsonwebtoken");
require("dotenv").config;

const PORT = process.env["PORT"] ? parseInt(process.env["PORT"]) : 3001;

// these should match the settings in your Metabase instance
let MB_SITE_URL = "http://3.231.180.105:8080";
let MB_EMBEDDING_SECRET_KEY = "bada589e31ea1d6c11695653952d66ea2d5cb0dde8e37da1970489bc0a4e616e";
let manager = "Rafael Moreira";
let MOCK_ID = 42;


function checkAuth(req, res, next) {
    const userId = req.session.userId;
    if(userId) {
        return next();
    }
    req.session.redirectTo = req.path;
    return res.redirect('/login');
}

// the dashboard ID of a dashboard that has a `user_id` parameter
const DASHBOARD_ID = 2;

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

// authenticated routes

app.get("/signed_chart", checkAuth, (req, res) => { 
    var payload = {
                    resource: { question: 136 },
                    params: {
                                "gerente": manager
                            },
                    exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
                  };
    var token = jwt.sign(payload, MB_EMBEDDING_SECRET_KEY);

    var iframeUrl = MB_SITE_URL + "/embed/question/" + token + "#bordered=true&titled=true";
    console.log(iframeUrl);
    res.render("chart", { userId: MOCK_ID, iframeUrl: iframeUrl });
})

app.get("/signed_dashboard/:id", checkAuth, (req, res) => {
    const userId = req.session.userId;
    const unsignedToken = {
        resource: { dashboard: DASHBOARD_ID },
        params: { id: userId },
        exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
    };
    // sign the JWT token with our secret key
    const signedToken = jwt.sign(unsignedToken, MB_EMBEDDING_SECRET_KEY);
    // construct the URL of the iframe to be displayed
    const iframeUrl = `${MB_SITE_URL}/embed/dashboard/${signedToken}`;
    res.render("dashboard", { userId: req.params.id, iframeUrl: iframeUrl });
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
