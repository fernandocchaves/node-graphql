import { GraphQLResolveInfo } from "graphql";
import { Transaction } from "sequelize";

import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { PostInstance } from "../../../models/PostModel";
import { handleError, throwError } from "../../../utils/utils";
import { AuthResovers } from "../../composable/auth.resolver";
import { compose } from "../../composable/composable.resolver";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import { ResolverContext } from '../../../interfaces/ResolverContextInterface';

export const PostResolvers = {
    Post: {
        author: (post, args, {db, dataloaders: {userLoader}}: {db: DbConnection, dataloaders: DataLoaders}, info: GraphQLResolveInfo) => {
            return userLoader
                .load({key: post.get('author'), info})
                .catch(handleError);
        },

        comments: (post, {first = 10, offset = 0}, context: ResolverContext, info: GraphQLResolveInfo) => {
            return context.db.Comment
                .findAll({
                    where: {post: post.get('id')},
                    limit: first,
                    offset: offset,
                    attributes: context.requestedFields.getFields(info)
                })
                .catch(handleError);
        }
    },

    Query: {
        posts: (parent, {first = 10, offset = 0}, context: ResolverContext, info: GraphQLResolveInfo) => {
            return context.db.Post
                .findAll({
                    limit: first,
                    offset: offset,
                    attributes: context.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
                }).catch(handleError);
        },
        post: (parent, {id}, context: ResolverContext, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return context.db.Post
                .findById(id, {
                    attributes: context.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
                })
                .then((post: PostInstance) => {
                    throwError(!post, `Post with id: ${id} not found`);
                    return post;
                }).catch(handleError);
        }
    },

    Mutation: {
        createPost: compose(...AuthResovers)
            ((parent, {input}, context: ResolverContext, info: GraphQLResolveInfo) => {
                input.author = context.authUser.id;
                return context.db.sequelize.transaction((t: Transaction) => {
                    return context.db.Post
                        .create(input, {transaction: t});
                }).catch(handleError);
            }),
        updatePost: compose(...AuthResovers)
            ((parent, {id, input}, context: ResolverContext, info: GraphQLResolveInfo) => {
                id = parseInt(id);
                return context.db.sequelize.transaction((t: Transaction) => {
                    return context.db.Post
                        .findById(id)
                        .then((post: PostInstance) => {
                            throwError(!post, `Post with id: ${id} not found`);
                            throwError(post.get('author') != context.authUser.id, `Unauthorized! You can only edit posts by yourself!`);
                            return post.update(input, {transaction: t});
                        });
                }).catch(handleError);
            }),
        deletePost: compose(...AuthResovers)
            ((parent, {id}, context: ResolverContext, info: GraphQLResolveInfo) => {
                id = parseInt(id);
                return context.db.sequelize.transaction((t: Transaction) => {
                    return context.db.Post
                        .findById(id)
                        .then((post: PostInstance) => {
                            throwError(!post, `Post with id: ${id} not found`);
                            throwError(post.get('author') != context.authUser.id, `Unauthorized! You can only delete posts by yourself!`);
                            return post.destroy({transaction: t});
                        });
                }).catch(handleError);
            })
    }
}