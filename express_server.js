const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
// var cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


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

////////// Helper functions /////////
// Gives out a random id for users and shortURLS
function generateRandomString() {
  return Math.random().toString(20).substr(2, 6);
}

// Renders the user information that matches the email input
function getUserByEmail(email) {
  for (const key in users) {
    if (email === users[key].email) {
      return users[key];
    }
  }
}

// Returns the URLs where the userID is equal to the id of the currently logged-in user
function urlsForUser(id) {
  let newDatabase = {};
  for (let u in urlDatabase) {
    if (id === urlDatabase[u].userID) {
      newDatabase[u] = urlDatabase[u];
    }
  }
  return newDatabase;
}

//Bcrypt for passwords
function hashedP(password) {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  return hashedPassword;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } else if (
    req.cookies["user_id"] === getUserByEmail(req.cookies["user_id"]).email
  ) {
    const templateVars = {
      urls: urlsForUser(getUserByEmail(req.cookies["user_id"]).id),
      user: req.cookies["user_id"],
    };
    // console.log(templateVars)
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", function (req, res) {
  if (req.cookies["user_id"]) {
    const templateVars = {
      user: req.cookies["user_id"],
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"],
  };
  // console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", function (req, res) {
  let userid = getUserByEmail(req.cookies["user_id"]).id;
  if (!req.cookies["user_id"]) {
    res.send("<html><body>Not logged in</body></html>\n");
  } else if (Object.keys(urlsForUser(userid)).includes(req.params.shortURL)) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: req.cookies["user_id"],
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("Authorization denied");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.send("<html><body>Please login</body></html>\n");
  } else if (Object.keys(urlsForUser(getUserByEmail(req.cookies["user_id"]).id)).includes(req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(404).send("Authorization denied");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.send("<html><body>Please login</body></html>\n");
  } else if (Object.keys(urlsForUser(getUserByEmail(req.cookies["user_id"]).id)).includes(req.params.shortURL)) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(404).send("Authorization denied");
  }
});

////////// login existing user //////////
// Page that shows the login form
app.get("/login", function (req, res) {
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("login", templateVars);
});

// Login button action
app.post("/login", function (req, res) {
  let email = req.body.email;
  let password = req.body.password;
  // Identify if user already exist or if fields are incorrect
  if (email === "" || password === "") {
    res.sendStatus(404);
  } else if (!getUserByEmail(email)) {
    res.sendStatus(403);
  } else if (!bcrypt.compareSync(password, getUserByEmail(email).password)) {
    console.log('password: ', getUserByEmail(email).password)
    res.sendStatus(403);
  } else {
    let id = getUserByEmail(email).id;
    res.cookie("user_id", users[id].email);
    res.redirect("/urls");
  }
});

////////// logout //////////
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

////////// Register new user //////////
// Page that shows the registration form
app.get("/register", function (req, res) {
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("registration", templateVars);
});

// Register button action > new cookie created, info stored in obj "users"
app.post("/register", function (req, res) {
  let id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  // 404 Error if empty email or password field, or if email matches users obj
  if (email === "" || password === "") {
    res.sendStatus(404);
  } else if (getUserByEmail(email)) {
    res.sendStatus(404);
  } else {
    users[id] = {
      id: id,
      email: email,
      password: hashedP(password),
    };
    console.log(users[id])
    res.cookie("user_id", users[id].email);
    res.redirect("/urls");
  }
});

////////// Connection established //////////
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
