const PostTypes = `
    type Post {
        id: ID!
        title: String!
        content: String!
        photo: String!
        author: User!
        comments(first: Int, offse: Int): [ Comment! ]!
        createdAt: String!
        updatedAt: String!
    }

    input PostInput {
        title: String!
        content: String!
        photo: String!
    }
`;

const PostQueries = `
    posts(first: Int, offset: Int): [ Post! ]!
    post(id: ID!): Post
`;

const PostMutations = `
    createPost(input: PostInput!): Post
    updatePost(id: ID!, input: PostInput!): Post
    deletePost(id: ID!): Boolean
`;

export {
    PostTypes,
    PostQueries,
    PostMutations
}