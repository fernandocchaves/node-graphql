import * as jwt from 'jsonwebtoken';

import { db, app, chai, handleError, expect } from "../../test-utils";
import { UserInstance } from "../../../src/models/UserModel";
import { JWT_SECRET } from "../../../src/utils/utils";
import { PostInstance } from '../../../src/models/PostModel';

describe('Post', () => {
    let token: string;
    let userId: number;
    let postId: number;
    
    beforeEach(() => {
        return db.Comment.destroy({ where: {} })
            .then((rows: number) => db.Post.destroy({ where: {} }))
            .then((rows: number) => db.User.destroy({ where: {} }))
            .then((rows: number) => db.User.create(
                {
                    name: 'Armando',
                    email: 'armando@gmail.com',
                    password: '1234'
                }
            )).then((user: UserInstance) => {
                userId = user.get('id');
                const payload = { sub: userId };
                token = jwt.sign(payload, JWT_SECRET);

                return db.Post.bulkCreate([
                    {
                        title: 'post 1',
                        content: 'Post content 1',
                        author: userId,
                        photo: 'image_1.png'
                    },
                    {
                        title: 'post 2',
                        content: 'Post content 2',
                        author: userId,
                        photo: 'image_2.png'
                    },
                    {
                        title: 'post 3',
                        content: 'Post content 3',
                        author: userId,
                        photo: 'image_3.png'
                    }
                ]);
            }).then((posts: PostInstance[]) => {
                postId = posts[0].get('id');
            });
    });

    describe('Queries', () => {
        describe('application/json', () => {

            describe('posts', () => {
                it('should return a list of posts', () => {
                    let body = {
                        query: `
                            query {
                                posts {
                                    title
                                    content
                                    photo
                                }
                            }
                        `
                    }

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const postsList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postsList).to.be.an('array');
                            expect(postsList[0]).to.not.have.keys(['id', 'author', 'comments']);
                            expect(postsList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postsList[0].title).to.equal('post 1');
                        }).catch(handleError);
                });
            });

            describe('post', () => {
                it('should a single post with your author', () => {
                    let body = {
                        query: `
                            query getPost($id: ID!) {
                                post(id: $id) {
                                    title
                                    author {
                                        name
                                        email
                                    }
                                    comments {
                                        comment
                                    }
                                }
                            }
                        `,
                        variables: {
                            id: postId
                        }
                    }

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const singlePost = res.body.data.post;
                            expect(res.body.data).to.have.key('post');
                            expect(singlePost).to.have.keys(['title', 'author', 'comments']);
                            expect(singlePost.title).to.equal('post 1');
                            expect(singlePost.author).to.be.an('object').with.keys(['name', 'email']);
                        }).catch(handleError);

                });
            });
        });

        describe('application/graphql', () => {
            describe('posts', () => {
                it('should return a list of posts', () => {
                    let query = `
                        query {
                            posts {
                                title
                                content
                                photo
                            }
                        }
                        `

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/graphql')
                        .send(query)
                        .then(res => {
                            const postsList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postsList).to.be.an('array');
                            expect(postsList[0]).to.not.have.keys(['id', 'author', 'comments']);
                            expect(postsList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postsList[0].title).to.equal('post 1');
                        }).catch(handleError);
                });

                it('should paginate a list of posts', () => {
                    let query = `
                        query getPostList($first: Int, $offset: Int) {
                            posts (first: $first, offset: $offset){
                                title
                                content,
                                photo
                            }
                        }
                        `

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/graphql')
                        .send(query)
                        .query({
                            variables: JSON.stringify({
                                first: 2,
                                offset: 1
                            })
                        })
                        .then(res => {
                            const postsList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postsList).to.be.an('array').with.length(2);
                            expect(postsList[0]).to.not.have.keys(['id', 'author', 'comments']);
                            expect(postsList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postsList[0].title).to.equal('post 2');
                        }).catch(handleError);
                });
            });
        });
    });

    describe('Mutations', () => {
        describe('application/json', () => {

            describe('createPost', () => {
                it('should create a new post', () => {
                    let body = {
                        query: `
                            mutation createNewPost($input: PostInput!) {
                                createPost(input: $input) {
                                    id
                                    title
                                    author {
                                        id
                                        name
                                        email
                                    }
                                }
                            }
                        `,
                        variables: {
                            input: {
                                title: 'post 4',
                                content: 'Post content 4',
                                photo: 'image_4.png'
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const createdPost = res.body.data.createPost;
                            expect(res.body).to.have.not.key('errors');
                            expect(createdPost).to.be.an('object');
                            expect(createdPost).to.have.keys(['id', 'title', 'author']);
                            expect(createdPost.title).to.equal('post 4');
                            expect(parseInt(createdPost.author.id)).to.equal(userId);
                        }).catch(handleError);
                });
            });

            describe('updatePost', () => {
                it('should edit an exists post', () => {
                    let body = {
                        query: `
                            mutation updatePost($id: ID!, $input: PostInput!) {
                                updatePost(id: $id, input: $input) {
                                    id
                                    title
                                    content
                                    photo
                                }
                            }
                        `,
                        variables: {
                            id: postId,
                            input: {
                                title: 'post updated',
                                content: 'Post content updated',
                                photo: 'image_updated.png'
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const updatedPost = res.body.data.updatePost;
                            expect(res.body).to.have.not.key('errors');
                            expect(updatedPost).to.be.an('object');
                            expect(updatedPost).to.have.keys(['id', 'title', 'photo', 'content']);
                            expect(updatedPost.title).to.equal('post updated');
                        }).catch(handleError);
                });
            });

            describe('deletePost', () => {
                it('should delete an exists post', () => {
                    let body = {
                        query: `
                            mutation deletePost($id: ID!) {
                                deletePost(id: $id)
                            }
                        `,
                        variables: {
                            id: postId
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body).to.have.not.key('errors');
                            expect(res.body.data).to.have.key('deletePost');
                            expect(res.body.data.deletePost).to.be.true;
                        }).catch(handleError);
                });
            });
        });
    });
});