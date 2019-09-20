import * as jwt from 'jsonwebtoken';

import { db, chai, app, handleError, expect } from '../../test-utils';
import { UserInstance } from '../../../src/models/UserModel';
import { JWT_SECRET } from '../../../src/utils/utils';

describe('User', () => {
    
    let token: string;
    let userId: number;
    
    beforeEach(() => {
        return db.Comment.destroy({ where: {} })
            .then((rows: number) => db.Post.destroy({ where: {} }))
            .then((rows: number) => db.User.destroy({ where: {} }))
            .then((rows: number) => db.User.bulkCreate([
                {
                    name: 'João',
                    email: 'jao@gmail.com',
                    password: '123'
                },
                {
                    name: 'Fernando',
                    email: 'fernando@gmail.com',
                    password: '123'
                },
                {
                    name: 'Jurema',
                    email: 'jurema@gmail.com',
                    password: '123'
                }
            ])).then((users: UserInstance[]) => {
                userId = users[0].id;
                const payload = { sub: userId };
                token = jwt.sign(payload, JWT_SECRET);
            });
    });

    describe('Queries', () => {
        
        describe('application/json', () => {

            describe('users', () => {
                it('should return a list of users', () => {
                    let body = {
                        query: `
                            query {
                                users {
                                    name
                                    email
                                }
                            }
                        `
                    }

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const userList = res.body.data.users;
                            expect(res.body.data).to.be.an('object');
                            expect(userList).to.be.an('array');
                            expect(userList[0]).to.not.have.keys(['id', 'photo', 'posts']);
                            expect(userList[0]).to.have.keys(['name', 'email']);
                        }).catch(handleError);
                });

                it('should paginate a list of users', () => {
                    let body = {
                        query: `
                            query getUsersList($first: Int, $offset: Int) {
                                users(first: $first, offset: $offset) {
                                    name
                                    email,
                                    createdAt
                                }
                            }
                        `,
                        variables: {
                            first: 2,
                            offset: 1
                        }
                    }

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const userList = res.body.data.users;
                            expect(res.body.data).to.be.an('object');
                            expect(userList).to.be.an('array').of.length(2);
                            expect(userList[0]).to.not.have.keys(['id', 'photo', 'posts']);
                            expect(userList[0]).to.have.keys(['name', 'email', 'createdAt']);
                        }).catch(handleError);


                });
            });

            describe('user', () => {
                it('should a single users', () => {
                    let body = {
                        query: `
                            query getSingleUser($id: ID!) {
                                user(id: $id) {
                                    id
                                    name
                                    email
                                    posts {
                                        title
                                    }
                                }
                            }
                        `,
                        variables: {
                            id: userId
                        }
                    }

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const singleUser = res.body.data.user;
                            expect(res.body.data).to.be.an('object');
                            expect(singleUser).to.be.an('object');
                            expect(singleUser).to.not.have.keys(['id', 'photo', 'posts']);
                            expect(singleUser).to.have.keys(['id', 'name', 'email', 'posts']);
                            expect(singleUser.name).to.equal('João');
                            expect(singleUser.email).to.equal('jao@gmail.com');
                        }).catch(handleError);

                });

                it('should return only \'name\' attribute', () => {
                    let body = {
                        query: `
                            query getSingleUser($id: ID!) {
                                user(id: $id) {
                                    name
                                }
                            }
                        `,
                        variables: {
                            id: userId
                        }
                    }

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const singleUser = res.body.data.user;
                            expect(res.body.data).to.be.an('object');
                            expect(singleUser).to.be.an('object');
                            expect(singleUser).to.have.key('name');
                            expect(singleUser.name).to.equal('João');
                            expect(singleUser.email).to.be.undefined;
                        }).catch(handleError);
                });

                it('should return if user not exists', () => {
                    let body = {
                        query: `
                            query getSingleUser($id: ID!) {
                                user(id: $id) {
                                    name
                                    email
                                }
                            }
                        `,
                        variables: {
                            id: -1
                        }
                    }

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data.user).to.be.null;
                            expect(res.body.errors).to.be.an('array');
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.errors[0].message).to.equal('Error: User with id: -1 not found');
                        }).catch(handleError);
                });
                
            });

            describe('currentUser', () => {
                it('should return a current user', () => {
                    let body = {
                        query: `
                            query {
                                currentUser {
                                    name
                                    email
                                }
                            }
                        `,
                        variables: {
                            id: userId
                        }
                    }

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const currentUser = res.body.data.currentUser;
                            expect(currentUser).to.be.an('object');
                            expect(currentUser).to.have.keys(['name', 'email']);
                            expect(currentUser.name).to.equal('João');
                            expect(currentUser.email).to.equal('jao@gmail.com');
                        }).catch(handleError);

                });
                
            });

        });

    });

    describe('Mutations', () => {
        
        describe('application/json', () => {

            describe('createUser', () => {

                it('shoud create new User', () => {
                    let body = {
                        query: `
                            mutation createNewUser($input: UserCreateInput!) {
                                createUser(input: $input) {
                                    id
                                    name
                                    email
                                }
                            }
                        `,
                        variables: {
                            input: {
                                name: 'Silva',
                                email: 'silva@gmail.com',
                                password: '123'
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const createdUser = res.body.data.createUser;

                            expect(createdUser).to.be.an('object');
                            expect(createdUser.name).to.equal('Silva');
                            expect(createdUser.email).to.equal('silva@gmail.com');
                            expect(parseInt(createdUser.id)).to.be.an('number');
                        }).catch(handleError); 
                });

            });

            describe('updateUser', () => {

                it('shoud update an exists User', () => {
                    let body = {
                        query: `
                            mutation updateExistsUser($input: UserUpdateInput!) {
                                updateUser(input: $input) {
                                    name
                                    email
                                    photo
                                }
                            }
                        `,
                        variables: {
                            input: {
                                name: 'João Silva',
                                email: 'joao.silva@gmail.com',
                                photo: 'image.png'
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const updatedUser = res.body.data.updateUser;

                            expect(updatedUser).to.be.an('object');
                            expect(updatedUser.name).to.equal('João Silva');
                            expect(updatedUser.email).to.equal('joao.silva@gmail.com');
                            expect(updatedUser.photo).to.be.not.null;
                            expect(updatedUser.id).to.be.undefined;
                        }).catch(handleError); 
                });

                it('shoud block operation if token is invalid', () => {
                    let body = {
                        query: `
                            mutation updateExistsUser($input: UserUpdateInput!) {
                                updateUser(input: $input) {
                                    name
                                    email
                                    photo
                                }
                            }
                        `,
                        variables: {
                            input: {
                                name: 'João Silva',
                                email: 'joao.silva@gmail.com',
                                photo: 'image.png'
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer INVALID_TOKEN`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data.updateUser).to.be.null;
                            expect(res.body.errors).to.be.an('array');
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.errors[0].message).to.equal('JsonWebTokenError: jwt malformed');
                        }).catch(handleError); 
                });

            });

            describe('updatePassword', () => {

                it('shoud update the password an exists User', () => {
                    let body = {
                        query: `
                            mutation updateUserPassword($input: UserUpdatePasswordInput!) {
                                updateUserPassword(input: $input)
                            }
                        `,
                        variables: {
                            input: {
                                password: '123456'
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data.updateUserPassword).to.be.true;
                        }).catch(handleError); 
                });

            });

            describe('deleteUser', () => {

                it('shoud update the password an exists User', () => {
                    let body = {
                        query: `
                            mutation {
                                deleteUser
                            }
                        `
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data.deleteUser).to.be.true;
                        }).catch(handleError); 
                });

                it('shoud block if not provider token', () => {
                    let body = {
                        query: `
                            mutation {
                                deleteUser
                            }
                        `
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.errors[0].message).to.equal('Unauthorized! Token não fornecido!');
                        }).catch(handleError); 
                });

            });
        
        });

    });

});