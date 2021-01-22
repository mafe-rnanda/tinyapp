const { getUserByEmail, generateRandomString, urlsForUser, hashedP } = require("./helpers");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"],
  })
);

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID" },
  "b6UTxQ": { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  "i3BoGr": { longURL: "https://www.google.ca", userID: "aJ48lW" },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
  aJ48lW: {
    id: "aJ48lW",
    email: "user3@example.com",
    password: "hello",
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

////////// Users URLs displaying //////////
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else if (users[req.session.user_id]) {
    const templateVars = {
      urls: urlsForUser(req.session.user_id, urlDatabase),
      user: users[req.session.user_id],
    };
    console.log(templateVars);
    res.render("urls_index", templateVars);
  }
});

////////// new URL form //////////
app.get("/urls/new", function (req, res) {
  if (req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

////////// new URL Submit button //////////
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
  };
  res.redirect(`/urls`);
});

////////// short URL displaying //////////
app.get("/urls/:shortURL", function (req, res) {
  let userid = req.session.user_id;
  if (!req.session.user_id) {
    res.status(404).send("You are not logged in. Please go back.");
  } else if (Object.keys(urlsForUser(userid, urlDatabase)).includes(req.params.shortURL)) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.user_id],
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("URL not found");
  }
});

////////// shortURL redirection to longURL //////////
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

////////// delete button //////////
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.user_id) {
    res.send("<html><body>Please login</body></html>\n");
  } else if (Object.keys(urlsForUser(req.session.user_id, urlDatabase)).includes(req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(404).send("Authorization denied");
  }
});

////////// edit URL button //////////
app.post("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    res.send("<html><body>Please login</body></html>\n");
  } else if (Object.keys(urlsForUser(req.session.user_id, urlDatabase)).includes(req.params.shortURL)) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(404).send("Authorization denied");
  }
});

////////// login form //////////
// Page that shows the login form
app.get("/login", function (req, res) {
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("login", templateVars);
});

////////// login button //////////
app.post("/login", function (req, res) {
  let email = req.body.email;
  let password = req.body.password;
  // Identify if user already exist or if fields are incorrect
  if (email === "" || password === "") {
    res.sendStatus(404);
  } else if (!getUserByEmail(email, users)) {
    res.sendStatus(403);
  } else if (
    !bcrypt.compareSync(password, getUserByEmail(email, users).password)
  ) {
    console.log("password: ", getUserByEmail(email, users).password);
    res.sendStatus(403);
  } else {
    let id = getUserByEmail(email, users).id;
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

////////// logout button //////////
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

////////// Register new user form //////////
app.get("/register", function (req, res) {
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("registration", templateVars);
});

////////// Register button //////////
app.post("/register", function (req, res) {
  let id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  if (email === "" || password === "") {
    res.sendStatus(404);
  } else if (getUserByEmail(email, users)) {
    res.sendStatus(404);
  } else {
    users[id] = {
      id: id,
      email: email,
      password: hashedP(password),
    };
    console.log(users[id]);
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

////////// Connection established //////////
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
