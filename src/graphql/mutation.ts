import { CommentMutations } from './resources/comment/comment.schema';
import { PostMutations } from './resources/post/post.schema';
import { UserMutations } from './resources/user/user.schema';
import { TokenMutations } from './resources/token/token.schema';

const Mutation = `
    type Mutation {
        ${CommentMutations}
        ${PostMutations}
        ${TokenMutations}
        ${UserMutations}
    }
`;

export {
    Mutation
}