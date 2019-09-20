import * as jwt from 'jsonwebtoken';

import { db, app, chai, handleError, expect } from "../../test-utils";
import { UserInstance } from "../../../src/models/UserModel";
import { JWT_SECRET } from "../../../src/utils/utils";
import { PostInstance } from '../../../src/models/PostModel';
import { CommentInstance } from '../../../src/models/CommentMoldel';

describe('Comment', () => {
    let token: string;
    let userId: number;
    let postId: number;
    let commentId: number;
    
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

                return db.Post.create({
                        title: 'post 1',
                        content: 'Post content 1',
                        author: userId,
                        photo: 'image_1.png'
                    });
            }).then((post: PostInstance) => {
                postId = post.get('id');

                return db.Comment.bulkCreate([
                    {
                        comment: 'commentario 1',
                        user: userId,
                        post: postId
                    },
                    {
                        comment: 'commentario 2',
                        user: userId,
                        post: postId
                    },
                    {
                        comment: 'commentario 3',
                        user: userId,
                        post: postId
                    }
                ]).then((comments: CommentInstance[]) => {
                    commentId = comments[0].get('id');
                })
            });
    });

    describe('Queries', () => {
        describe('application/json', () => {

            describe('commentsByPost', () => {
                it('should return a list of comments by post', () => {
                    let body = {
                        query: `
                            query getCommentsByPostList($postId: ID!) {
                                commentsByPost(postId: $postId) {
                                    comment
                                    user {
                                        id
                                        name
                                    }
                                    post {
                                        id
                                        title
                                    }
                                }
                            }
                        `,
                        variables: {
                            postId: postId
                        }
                    }

                    return chai.request(app)
                        .get('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const commentsList = res.body.data.commentsByPost;
                            expect(res.body.data).to.be.an('object');
                            expect(commentsList).to.be.an('array');
                            expect(commentsList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt']);
                            expect(commentsList[0]).to.have.keys(['comment', 'user', 'post']);
                            expect(parseInt(commentsList[0].user.id)).to.equal(userId);
                            expect(parseInt(commentsList[0].post.id)).to.equal(postId);
                        }).catch(handleError);
                });
            });
        });
    });

    describe('Mutations', () => {
        describe('application/json', () => {

            describe('createComment', () => {
                it('should create a new comment', () => {
                    let body = {
                        query: `
                            mutation createNewComment($input: CommentInput!) {
                                createComment(input: $input) {
                                    comment
                                    user {
                                        id
                                        name
                                    }
                                    post {
                                        id
                                        title
                                    }
                                }
                            }
                        `,
                        variables: {
                            input: {
                                comment: 'Comentario 2',
                                post: postId
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const createdComment = res.body.data.createComment;
                            expect(res.body).to.have.not.key('errors');
                            expect(createdComment).to.be.an('object');
                            expect(createdComment).to.have.keys(['comment', 'user', 'post']);
                            expect(createdComment.comment).to.equal('Comentario 2');
                            expect(parseInt(createdComment.user.id)).to.equal(userId);
                            expect(parseInt(createdComment.post.id)).to.equal(postId);
                        }).catch(handleError);
                });
            });

            describe('updateComment', () => {
                it('should edit an exists comment', () => {
                    let body = {
                        query: `
                            mutation updateComment($id: ID!, $input: CommentInput!) {
                                updateComment(id: $id, input: $input) {
                                    id
                                    comment
                                }
                            }
                        `,
                        variables: {
                            id: commentId,
                            input: {
                                comment: 'Comentario Atualizado',
                                post: postId
                            }
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const updatedPost = res.body.data.updateComment;
                            expect(res.body).to.have.not.key('errors');
                            expect(updatedPost).to.be.an('object');
                            expect(updatedPost).to.have.keys(['comment', 'id']);
                            expect(updatedPost.comment).to.equal('Comentario Atualizado');
                        }).catch(handleError);
                });
            });

            describe('deleteComment', () => {
                it('should delete an exists comment', () => {
                    let body = {
                        query: `
                            mutation deleteComment($id: ID!) {
                                deleteComment(id: $id)
                            }
                        `,
                        variables: {
                            id: commentId
                        }
                    }

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body).to.have.not.key('errors');
                            expect(res.body.data).to.have.key('deleteComment');
                            expect(res.body.data.deleteComment).to.be.true;
                        }).catch(handleError);
                });
            });
        });
    });
});