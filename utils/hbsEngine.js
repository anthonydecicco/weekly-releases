const express = require('express');
const path = require('path');
const handlebars = require('express-handlebars');

const hbs = handlebars.create({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '..', 'public', 'views', 'layouts')
});

module.exports = hbs;