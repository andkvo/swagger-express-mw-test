/**************************************************************************************************
 * This sample demonstrates the most simplistic usage of Swagger-Express-Middleware.
 * It simply creates a new Express Application and adds all of the Swagger middleware
 * without changing any options, and without adding any custom middleware.
 **************************************************************************************************/
'use strict';

const express = require('express');
const createMiddleware = require('swagger-express-middleware');

// Create an Express app
const app = express();
app.use(express.json());

createMiddleware('src/PushPress.yaml', app, (err, middleware) => {

    if(err)
        throw err;

    // Add all the Swagger Express Middleware, or just the ones you need.
    // NOTE: Some of these accept optional options (omitted here for brevity)

    app.use((req, res, next) => {
        const {method, url } = req;
        console.log(`Handling request for ${method} ${url}`);
        next();
    });

    app.use(
        middleware.metadata(), // supplies metadata for functioning later on
        middleware.CORS(), // cors whatever
        //middleware.files(), // stupid
        middleware.validateRequest() // some simple sanity checks
    );

    // CUSTOM VALIDATION
    //
    // The validation middleware specified here will override later, default validation rules
    // So long as you don't call next() of course
    app.post("/subscription", myCustomValidation);

    // FALLBACK VALIDATION
    //
    // This middleware provides default validation
    // This implementation is actually dangerous however
    // This will not be totally overriden and will still coerce certain values
    // Be especially aware of dates (submitted in ISO format) that are automatically coerced into UTC time
    app.use(
        middleware.parseRequest() // note that this will coerce some values, which is not optimal especially timezone handling since that part just seems broken
    );

    // CUSTOM ROUTE HANDLING
    //
    // The routes handled here will override later, default mock routes
    // So long as you don't call next() of course
    // This allows back-end developers to slowly override the mock implementations
    app.get("/subscription", (req, res) => { 
        res.send("Actual implementation");
    });

    app.post("/subscription", /* middleware.parseRequest(), */ (req, res) => {
        res.send("You should not be seeing this");
    });

    // FALLBACK ROUTE HANDLING
    //
    // The mock implementations provided by SEMW
    app.use(
        middleware.mock()
    );

    // Error handler to display the validation error as HTML
    app.use(function(err, req, res, next) {
        res.status(err.status);
        res.send(
            '<h1>' + err.status + ' Error</h1>' +
            '<pre>' + err.message + '</pre>'
        );
    });

    // Start the app
    const port = 8081;

    app.listen(port, function() {
        console.log(`The PetStore sample is now running at http://localhost:${port}`);
    });
});

function myCustomValidation(req, res, next) {
    console.log("middleware");
    
    if(!req.body.name)
    {
        res.json({  errors: { name: [ 'Name is required' ] } });
        res.end();
    }
    else
    {
        next();
    }
}
