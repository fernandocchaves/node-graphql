import * as jwt from 'jsonwebtoken';

import { db, chai, app, handleError, expect } from '../../test-utils';

describe('Token', () => {
    
    beforeEach(() => {
        return db.Comment.destroy({ where: {} })
            .then((rows: number) => db.Post.destroy({ where: {} }))
            .then((rows: number) => db.User.destroy({ where: {} }))
            .then((rows: number) => db.User.create({
                    name: 'Fernando',
                    email: 'fernando@gmail.com',
                    password: '123'
                })).catch(handleError);
    });


    describe('Mutations', () => {
        
        describe('application/json', () => {

            describe('createToken', () => {

                it('shoud return valid Token', () => {
                    let body = {
                        query: `
                            mutation createNewToken($email: String!, $password: String!) {
                                createToken(email: $email, password: $password) {
                                    token
                                }
                            }
                        `,
                        variables: {
                            email: 'fernando@gmail.com',
                            password: '123'
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data).to.be.have.key('createToken');
                            expect(res.body.data.createToken).to.be.have.key('token');
                            expect(res.body.data.createToken.token).to.be.string;
                            expect(res.body.errors).to.be.undefined;
                        }).catch(handleError); 
                });

                it('shoud return error if password incorrect', () => {
                    let body = {
                        query: `
                            mutation createNewToken($email: String!, $password: String!) {
                                createToken(email: $email, password: $password) {
                                    token
                                }
                            }
                        `,
                        variables: {
                            email: 'fernando@gmail.com',
                            password: 'WRONG_PASS'
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body).to.be.have.keys(['data', 'errors']);
                            expect(res.body.data.createToken).to.be.null;
                            expect(res.body.errors).to.be.an('array').with.length(1);
                            expect(res.body.errors[0].message).to.equal('Unauthorized, wrong email or password!');

                        }).catch(handleError); 
                });

                it('shoud return error if invalid user', () => {
                    let body = {
                        query: `
                            mutation createNewToken($email: String!, $password: String!) {
                                createToken(email: $email, password: $password) {
                                    token
                                }
                            }
                        `,
                        variables: {
                            email: 'WRONG_EMAIL',
                            password: '123'
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body).to.be.have.keys(['data', 'errors']);
                            expect(res.body.data.createToken).to.be.null;
                            expect(res.body.errors).to.be.an('array').with.length(1);
                            expect(res.body.errors[0].message).to.equal('Unauthorized, wrong email or password!');
                        }).catch(handleError);
                });

            });
        
        });

    });

});