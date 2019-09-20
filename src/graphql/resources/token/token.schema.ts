const TokenTypes = `
    type Token {
        token: String!
    }
`;

const TokenMutations = `
    createToken(email: String!, password: String!): Token
`;

export {
    TokenTypes,
    TokenMutations
}