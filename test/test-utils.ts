import * as chai from 'chai';
import app from './../src/app';
import db from './../src/models';

const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const  handleError = error => {
    const message: string = (error.response) ? error.response.res.text : error.message || error;
    return Promise.reject(`${error.name}: ${message}`);
}

export {
    app,
    db,
    chai,
    expect,
    handleError
}