import { GraphQLResolveInfo } from "graphql";
import { Transaction } from "sequelize";

import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { CommentInstance } from "../../../models/CommentMoldel";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { AuthResovers } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import { ResolverContext } from "../../../interfaces/ResolverContextInterface";

export const CommentResolvers = {
    Comment: {
        user: (comment, args, {db, dataloaders: {userLoader}}: {db: DbConnection, dataloaders: DataLoaders}, info: GraphQLResolveInfo) => {
            return userLoader
                .load({key: comment.get('user'), info})
                .catch(handleError);
        },

        post: (comment, args, {db, dataloaders: {postLoader}}: {db: DbConnection, dataloaders: DataLoaders}, info: GraphQLResolveInfo) => {
            return postLoader
                .load({key: comment.get('post'), info})
                .catch(handleError);
        }
    },

    Query: {
        commentsByPost: (parent, {postId, first = 10, offset = 0}, context: ResolverContext, info: GraphQLResolveInfo) => {
            postId = parseInt(postId);
            return context.db.Comment
                .findAll({
                    where: {post: postId},
                    limit: first,
                    offset: offset,
                    attributes: context.requestedFields.getFields(info, {keep: undefined})
                })
                .catch(handleError);
        }
    },

    Mutation: {
        createComment: compose(...AuthResovers)
            ((parent, {input}, context: ResolverContext, info: GraphQLResolveInfo) => {
                input.user = context.authUser.id;
                return context.db.sequelize.transaction((t: Transaction) => {
                    return context.db.Comment
                        .create(input, {transaction: t});
                }).catch(handleError);
            }),
        updateComment: compose(...AuthResovers)
            ((parent, {id, input}, context: ResolverContext, info: GraphQLResolveInfo) => {
                id = parseInt(id);
                return context.db.sequelize.transaction((t: Transaction) => {
                    return context.db.Comment
                        .findById(id)
                        .then((comment: CommentInstance) => {
                            throwError(!comment, `Comment with id: ${id} not found`);
                            throwError(comment.get('user') != context.authUser.id, `Unauthorized! You can only edit comments by yourself!`);
                            return comment.update(input, {transaction: t});
                        });
                }).catch(handleError);
            }),
        deleteComment: compose(...AuthResovers)
            ((parent, {id}, context: ResolverContext, info: GraphQLResolveInfo) => {
                id = parseInt(id);
                return context.db.sequelize.transaction((t: Transaction) => {
                    return context.db.Comment
                        .findById(id)
                        .then((comment: CommentInstance) => {
                            throwError(!comment, `Comment with id: ${id} not found`);
                            throwError(comment.get('user') != context.authUser.id, `Unauthorized! You can only delete comments by yourself!`);
                            return comment.destroy({transaction: t});
                        });
                }).catch(handleError);
            })
    }
}