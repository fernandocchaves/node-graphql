import { UserModel } from "../models/UserModel";
import { PostModel } from "../models/PostModel";
import { CommentModel } from "../models/CommentMoldel";

export interface ModelsInterface {
    User: UserModel;
    Post: PostModel;
    Comment: CommentModel;
}