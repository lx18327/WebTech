const express = require('express')

// replace with your stripe public and secret keys
const keyPublishable='pk_test_wv4QOIFShqpurnnwXQ23akMV00AbH4AZUN';
const keySecret = 'sk_test_s6oVp3RJwAfhrRhAYwN3nFkQ007cO7nzDY';


// creating an express instance
const app = express()  
const cookieSession = require('cookie-session')  
const bodyParser = require('body-parser')  
const passport = require('passport')
// import and create stripe object
const paypal = require('paypal-rest-sdk');

//sql
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('db/login.db');

// getting the local authentication type
const LocalStrategy = require('passport-local').Strategy
 
app.use(express.static('./public'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))

// configure paypal with the credentials you got when you created your paypal app
paypal.configure({
  'mode': 'sandbox', //sandbox or live 
  'client_id': 'AWgUW2f1C3x7eU72wOVS0y94OnONHS7FMtVq1JLbxTVBaZkc26GKX-n4kodQGBFZ-OFHkI3l3e0x2jiv', // please provide your client id here 
  'client_secret': 'EO1twEHqK-sR4o7cVI9aI3fUPnrbKHxe3ybN0zShdJk4_2EjIY2c2vjg89g7Uym_rRKW1F_DD4V_3aKn' // provide your client secret here 
});



app.use(cookieSession({  
    name: 'mysession',
    keys: ['vueauthrandomkey'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use(passport.initialize());
app.use(passport.session());

//USERS LIST
/*let users = [  
  {
    id: 1,
    name: "Jude",
    email: "user@email.com",
    password: "password"
  },
  {
    id: 2,
    name: "Emma",
    email: "emma@email.com",
    password: "password2"
  }
]*/

//LOGIN CALL
app.post("/api/login", (req, res, next) => {  
//var username = req.body.create_first_name;
 //var password = req.body.create_last_name;

  passport.authenticate("local", (err, user, info) => {

    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(400).send([user, "Cannot log in", info]);
    }

    req.login(user, err => {
      //res.send("Logged in");
	return res.redirect('/drinks.html');
    });
  })(req, res, next);
});

//SIGNUP CALL
app.post("/api/signup", (req, res, next) => {  
    	console.log("Sign in"+req.body.email);
    db.run("INSERT INTO login(email, password) VALUES (?,?)", [req.body.email, req.body.password], function(err){
    if (err) {
       console.log(err.message);
       
      }
      else{
       console.log("sucess");
       
       }
      
    });
	return res.redirect('/drinks.html');
  
});


//LOGOUT

app.get("/api/logout", function(req, res) {  
  req.logout();

  console.log("logged out")

  return res.send();
});
//MIDDLEWARE
const authMiddleware = (req, res, next) => {  
  if (!req.isAuthenticated()) {
    res.status(401).send('You are not authenticated')
  } else {
    return next()
  }
}

//USER
app.get("/api/user", authMiddleware, (req, res) => {  
  let user = users.find(user => {
    return user.id === req.session.passport.user
  })

  console.log([user, req.session])
  console.log("successs")

  res.send({ user: user })
})


//PASSPORT TO VALIDATE USER
/*passport.use(  
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password"
    },

    (username, password, done) => {
      let user = users.find((user) => {
        return user.email === username && user.password === password
      })

      if (user) {
        done(null, user)
      } else {
        done(null, false, { message: 'Incorrect username or password'})
      }
    }
  )
)*/

passport.use(new LocalStrategy(
   {
      usernameField: "username",
      passwordField: "password"
    },

	function(username, password, done) {
  
    db.get('SELECT email, id FROM login WHERE email = ? AND password = ?', username, password, function(err, row) {
      if (!row) return done(null, false,  { message: 'Incorrect username or password'});
      return done(null, row);
    
  });
}));

//NEED THIS
/*passport.serializeUser((user, done) => {  
  done(null, user.id)
})


//REVERSE
passport.deserializeUser((id, done) => {  
  let user = users.find((user) => {
    return user.id === id
  })

  done(null, user)
})
*/

passport.serializeUser(function(user, done) {
  return done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  db.get('SELECT id, username FROM users WHERE id = ?', id, function(err, row) {
    if (!row) return done(null, false);
    return done(null, row);
  });
});

//PAYMENT

app.post("/api/payment", function(req, res) {
console.log("Example app ")

    let amount = 5*100; // 500 cents means $5 

    // create a customer 
    stripe.customers.create({
        email: req.body.stripeEmail, // customer email, which user need to enter while making payment
        source: req.body.stripeToken // token for the given card 

    })
    .then(customer =>
        stripe.charges.create({ // charge the customer
        amount,
        description: "Payment",
            currency: "usd",
            customer: customer.id
        }))
    .then(res.redirect('/index.html'));


});

// start payment process 
app.get('/api/buy' , ( req , res ) => {
	// create payment object 
    var payment = {
            "intent": "authorize",
	"payer": {
		"payment_method": "paypal"
	},
	"redirect_urls": {
		"return_url": "https://www.google.com/",
		"cancel_url": "https://uk.yahoo.com/"
	},
	"transactions": [{
		"amount": {
			"total": 39.00,
			"currency": "USD"
		},
		"description": " a book on mean stack "
	}]
    }
	
	
	// call the create Pay method 
    createPay( payment ) 
        .then( ( transaction ) => {
            var id = transaction.id; 
            var links = transaction.links;
            var counter = links.length; 
            while( counter -- ) {
                if ( links[counter].method == 'REDIRECT') {
					// redirect to paypal where user approves the transaction 
                    return res.redirect( links[counter].href)
                }
            }
        })
        .catch( ( err ) => { 
            console.log( err ); 
            //res.redirect('/err');
        });
}); 


//RUN THE SERVER
app.listen(3000, () => {  
  console.log("Example app listening on port 3000")
})


// helper functions 
var createPay = ( payment ) => {
    return new Promise( ( resolve , reject ) => {
        paypal.payment.create( payment , function( err , payment ) {
         if ( err ) {
             reject(err); 
         }
        else {
            resolve(payment); 
        }
        }); 
    });
}