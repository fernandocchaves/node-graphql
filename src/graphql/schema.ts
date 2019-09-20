import { makeExecutableSchema } from 'graphql-tools';
import { merge } from 'lodash';

import { Query } from './query';
import { Mutation } from './mutation';

import { CommentTypes } from './resources/comment/comment.schema';
import { PostTypes } from './resources/post/post.schema';
import { UserTypes } from './resources/user/user.schema';
import { TokenTypes } from './resources/token/token.schema';

import { CommentResolvers } from './resources/comment/comment.resolvers';
import { PostResolvers } from './resources/post/post.resolvers';
import { UserResolvers } from './resources/user/user.resolvers';
import { TokenResolvers } from './resources/token/token.resolvers';

const resolvers = merge(
    CommentResolvers,
    PostResolvers,
    TokenResolvers,
    UserResolvers
)

const SchemaDefinition = `
    type Schema {
        query: Query
        mutation: Mutation
    }
`;

export default makeExecutableSchema({
    typeDefs: [
        SchemaDefinition,
        Query,
        Mutation,
        CommentTypes,
        PostTypes,
        TokenTypes,
        UserTypes
    ],
    resolvers
});