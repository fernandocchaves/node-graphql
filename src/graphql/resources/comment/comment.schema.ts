const CommentTypes = `
    type Comment {
        id: ID!
        comment: String!
        user: User!
        post: Post!
        createdAt: String!
        updatedAt: String!
    }

    input CommentInput {
        comment: String!
        post: Int!
    }
`;

const CommentQueries = `
    commentsByPost(postId: ID!, first: Int, offset: Int): [ Comment! ]!
`;

const CommentMutations = `
    createComment(input: CommentInput!): Comment
    updateComment(id: ID!, input: CommentInput!): Comment
    deleteComment(id: ID!): Boolean
`;

export {
    CommentTypes,
    CommentQueries,
    CommentMutations
}