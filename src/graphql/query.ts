import { CommentQueries } from './resources/comment/comment.schema';
import { PostQueries } from './resources/post/post.schema';
import { UserQueries } from './resources/user/user.schema';

const Query = `
    type Query {
        ${CommentQueries}
        ${PostQueries}
        ${UserQueries}
    }
`;

export {
    Query
}