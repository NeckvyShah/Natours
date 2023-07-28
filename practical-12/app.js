const express = require('express');
const app = express();
const path = require('path');
const port = 3000;
const i18n = require('i18n');

// configure i18n
i18n.configure({
  locales: ['en', 'gu', 'hin', 'fr'], // Available languages
  directory: path.join(__dirname, 'locales'), // Directory containing language files
  defaultLocale: 'en', // Default language
  cookie: false, // Disable cookie-based language detection
  queryParameter: 'lang', // Use 'lang' query parameter to detect language
});

app.use(i18n.init);

app.set('view engine', 'ejs');

app.use(express.json()); //This middleware is used to parse JSON data in the body of a request.

// define routes
app.get('/', (req, res) => {
  console.log(i18n.getLocale());
  res.render('index', { locale: req.query.lang || i18n.getLocale() });
});

app.listen(port, () => {
  console.log(`Listening on port ${port} `);
});

// why use i18 middleware
// When the i18n.init middleware is added, it performs the following tasks:

// It initializes the i18n module and sets up the necessary configuration based on the parameters provided in i18n.configure(). This includes loading the translation files, setting the default locale, and handling language selection.

// It adds the __() function to the response object (res) as a helper method. This function is used to translate text or retrieve localized strings.

// By adding i18n.init as middleware, we ensure that the i18n module is properly initialized and ready to handle internationalization and localization tasks throughout the request-response cycle.

// Whenever we call res.__() within a route handler, it triggers the translation process and returns the localized version of the specified string based on the current language setting. The i18n.init middleware ensures that the translation functionality is available and correctly set up in all routes where we use the __() function.

// In summary, adding app.use(i18n.init) as middleware is necessary to initialize the i18n module, provide the __() translation function, and enable the translation and localization features in the Express application.
