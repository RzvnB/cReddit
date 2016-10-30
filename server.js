var express  = require('express');
var app      = express();
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var pg = require('pg');
var connectionInfo = 'postgres://postgres:@localhost:5432/postgres';
var passport = require('passport')
var session = require('express-session')
var redisClient = require('redis').createClient();
var RedisStore = require('connect-redis')(session)
var cookieParser = require('cookie-parser')
var _ = require("lodash")
var bcrypt = require('bcryptjs');
var LocalStrategy = require('passport-local').Strategy;
var Pool = pg.Pool;
var pool = new Pool({
    user: 'postgres',
    password: 'parola',
    host: 'localhost',
    database: 'postgres',
    max: 10,
    idleTimeoutMillis: 1000
});

PORT = 3000

function authenticationMiddleware () {
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/')
  }
}


app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
    store: new RedisStore({ host: 'localhost', port: 6379, client: redisClient, ttl:  260}),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}))


passport.use(new LocalStrategy({    usernameField: 'username',
                                    passwordField: 'password'},
    function(username, password, done) {

        var hashPassCheck = true;
        var userInfo = {};

        pool.query("SELECT * FROM users WHERE username=$1", [username])
            .then((res) => {
                // console.log(res.rows[0]);
                if(!bcrypt.compareSync(password, res.rows[0].password)) {
                    return done(null, false, { message: 'Wrong password!' })
                }
                return done(null, res.rows[0])
            })
            .catch((err) => {
                return done(null, false, { message: "Wrong username!" })
            })

    }
))


passport.serializeUser((user, done) => {
    done(null, user.user_id);
})

passport.deserializeUser((id, done) => {
    pool.query("SELECT * FROM users WHERE user_id=($1)", [id])
            .then((res) => {
                done(null, res.rows[0])
            })
            .catch((err) => {
                done(new Error("User with the id " + id + " does not exist!"))
            })
})

app.use(passport.initialize());
app.use(passport.session());


app.listen(PORT);
console.log("App listening on port " + PORT);


app.post('/api/articles', function(req, res) {
    // console.log(req.body)
    var results = [];
    var data = _.pick(req.body, 'title', 'text', 'link');
    // console.log(req.user.username);

    pg.connect(connectionInfo, function(err, client, done){
        if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
        }

        client.query('INSERT INTO articles(title, text, link, username) values($1, $2, $3, $4)', [data.title, data.text, data.link, req.user.username]);

        query = client.query('SELECT * FROM articles ORDER BY article_id ASC');
        query.on('row', function(row){
            results.push(row);
        })

        query.on('end', function(){
            done();
            return res.json(results);
        })
    })
})


app.get('/api/articles', function(req, res) {
    var results = [];
    // var something = [];
    // something[20] = "none";
    // something[21] = "none";
    // console.log(something)

    pg.connect(connectionInfo, function(err, client, done){
        if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
        }

        query = client.query('SELECT * FROM articles ORDER BY article_id ASC');
        query.on('row', function(row){
            results.push(row);
        })

        query.on('end', function(){
            done();
            // console.log(results);
            return res.json(results);
        })
    })
})


app.delete('/api/articles/:article_id', function(req, res) {
    var results = [];
    var id = req.params.article_id;

    pg.connect(connectionInfo, function(err, client, done) {
        if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
        }

        client.query('DELETE FROM articles WHERE article_id=($1)', [id]);

        query = client.query('SELECT * FROM articles ORDER BY article_id ASC');
        query.on('row', function(row) {
            results.push(row);
        })

        query.on('end', function() {
            done();
            return res.json(results)
        })
    })
});


app.get('/api/comment/:article_id', function(req, res) {
    var results = [];
    var id = req.params.article_id;
    // console.log("Get comments from article id: " + id)

    pg.connect(connectionInfo, function(err, client, done){
        if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
        }

        query = client.query('SELECT * FROM comments WHERE article_id=($1) ORDER BY id ASC', [id]);
        query.on('row', function(row){
            results.push(row);
        })

        query.on('end', function(){
            done();
            return res.json(results);
        })
    })
})


app.post('/api/comment', function(req, res) {
    // console.log(req.body)
    var results = [];
    var data = _.pick(req.body, 'content', 'article_id');
    // console.log(req.user.username);

    pg.connect(connectionInfo, function(err, client, done){
        if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
        }

        client.query('INSERT INTO comments(content, username, article_id) values($1, $2, $3)', [data.content, req.user.username, data.article_id]);

        query = client.query('SELECT * FROM comments WHERE article_id=($1) ORDER BY id ASC', [data.article_id]);
        query.on('row', function(row){
            results.push(row);
        })

        query.on('end', function(){
            done();
            return res.json(results);
        })
    })
})



app.post('/api/update', function(req, res) {
    var results = [];
    var data = _.pick(req.body, 'title', 'text', 'link');
    var id = req.body.article_id

    pg.connect(connectionInfo, function(err, client, done){
        if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
        }

        client.query('UPDATE articles SET title=$1, text=$2, link=$3 WHERE article_id=($4)', [data.title, data.text, data.link, id]);

        query = client.query('SELECT * FROM articles ORDER BY article_id ASC');
        query.on('row', function(row){
            results.push(row);
        })

        query.on('end', function(){
            done();
            return res.json(results);
        })
    })
});


app.post('/api/register', function(req, res) {
    console.log("HELLOOOOOOOO")
    console.log(req.body)
    var data = _.pick(req.body, 'username', 'password');


    console.log("Password is " + data.password);
    data.password = bcrypt.hashSync(data.password, 10);
    console.log("Password hashed is " + data.password)

    pg.connect(connectionInfo, function(err, client, done){
        if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
        }

        client.query('INSERT INTO users(username, password) values($1, $2)', [data.username, data.password]);
        client.on('drain', function() {
            console.log('drained');
            passport.authenticate('local')(req, res, function () {
                res.redirect(200, '/');
            });
        })


    })
})


app.post('/api/login',
  passport.authenticate('local'),
  (req, res) => {
    // res.send(req.user);
    res.redirect(200, '/')
});


app.get('/api/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.get('/api/status', function(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(200).json({
      status: false
    });
  }
  // console.log("De aicisa <<< " +req.user.username)
  res.status(200).json({
    status: true,
    username: req.user.username
  });
});


app.get('*', function(req, res) {
    res.sendfile('./public/index.html');
});



















// var database =  {
//     protocol : "postgresql", // or "mysql"
//     query    : { pool: true },
//     host     : "127.0.0.1",
//     database : "postgres",
//     user     : "postgres",
//     password : ""
//   }


// var knex = Knex({
//   client: 'postgresql',
//   connection: {
//     host : '127.0.0.1',
//     user : 'postgres',
//     password : '',
//     database : 'postgres'
//   }
// });

// Model.knex(knex);
// mongoose.connect('mongodb://localhost/reddit-clone',function(){
//     /* Drop the DB */
//     mongoose.connection.db.dropDatabase();
// });
// orm.connect(database, function(err, db) {
//     if (err) throw err;
//     console.log("Succesful connection to database")
//     var Article = db.define("article", {
//             title : { type: 'text', required: true },
//             link : { type: 'text', required: true },
//             comments : { type: 'object', required: false },
//             text : { type: 'text', required: true }
//         },
//         {
//             hooks: {
//                 beforeCreate: function () {
//                     this.createdAt = new Date();
//                 }
//             },

//             methods: {
//                 serialize: function () {
//                     return {
//                       id        : this.id,
//                       title     : this.title,
//                       text      : this.text,
//                       link      : this.link,
//                       createdAt : this.createdAt,
//                       comments  : comments
//                     };
//                 }
//             }
//         });
// })

// app.use(orm.express(database, {
//     define: function (db, models, next) {
//         models.article = db.define('article', {
//             title : { type: 'text', required: true },
//             link : { type: 'text', required: true },
//             comments : Object,
//             text : { type: 'text', required: true }
//         },
//         {
//             hooks: {
//                 beforeCreate: function () {
//                     this.createdAt = new Date();
//                 }
//             },

//             methods: {
//                 serialize: function () {
//                     return {
//                       id        : this.id,
//                       title     : this.title,
//                       text      : this.text,
//                       link      : this.link,
//                       createdAt : this.createdAt,
//                       comments  : comments
//                     };
//                 }
//             }
//         });
//         next();
//     }
// }));


// var Article = mongoose.model('Article', {
//     title : String,
//     link : String,
//     comments : [String],
//     text : String
// });

// var art1 = new Article( {
//     title: "Hello WOrld1!",
//     text : "Lorem ipsum dolor sit amet, nec et scripta instructior, et dolores petentium abhorreant quo, modo nulla verear ea sed. Alienum perpetua repudiare mel no, no eum labore quaerendum. No cum putant alienum, pro ei tantas populo latine. Ex vero essent deseruisse pro. Pro an falli probatus, probo voluptua mea id, id diam modus scribentur sea."
// });
// var art2 = new Article( {
//     title: "Hello WOrld2!",
//     text : "Timeam appareat ad quo, et quo indoctum laboramus moderatius. In eos debet nullam, id dicant delicata vis. Tantas lobortis no vis, quis probo te vix, cum ut delicata principes percipitur. Et idque minim lobortis vim. Falli harum cetero sed et."
// });

// art1.save(function(err, art1) {
//     if(err) return console.error(err);
// })

// art2.save(function(err, art2) {
//     if(err) return console.error(err);
// })

// app.get('/api/articles', function(req, res) {
//     req.models.article.find(function (err, articles) {
//         if (err) return res.send(err);

//         var art = articles.map(function(a) {
//             return a.serialize();
//         })

//         console.log(art);
//         res.json(art);
//     })
// });

// app.get('/api/articles', function(req, res) {
//     Article.find(function(err, articles) {
//         if (err) return res.send(err);

//         var art = articles.map(function(a) {
//             return a.serialize();
//         })

//         console.log(art);
//         res.json(art);
//     })
// })


// app.post('/api/articles', function(req, res) {
//     Article.create({
//         title : req.body.title,
//         link : req.body.link,
//         text : req.body.text,
//         done : false
//     }, function(err, article) {
//         if (err)
//             res.send(err);


//         Article.find(function(err, articles) {
//             if (err)
//                 res.send(err)
//             res.json(articles);
//         });
//     });

// });

// app.post('/api/articles', function(req, res) {
//     var params = _.pick(req.body, 'title', 'link', 'text');

//     console.log(params);
//     req.models.article.create(params, function (err, art) {
//         if(err)
//             res.send(err);
//     })
//         // res.json(art.serialize());

//         req.models.article.find(function (err, articles) {
//             if (err) res.send(err);

//             var arti = articles.map(function(a) {
//                 return a.serialize();
//             });

//             res.json(art);
//         })
// })


// app.delete('/api/articles/:article_id', function(req, res) {
//     Article.remove({
//         _id : req.params.article_id
//     }, function(err, article) {
//         if (err)
//             res.send(err);


//         Article.find(function(err, articles) {
//             if (err)
//                 res.send(err)
//             res.json(articles);
//         });
//     });
// });


