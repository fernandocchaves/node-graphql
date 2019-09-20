import { UserModel, UserInstance } from "../../models/UserModel";
import { DataLoaderParam } from "../../interfaces/DataLoaderParamInterface";
import { RequestedFields } from "../ast/RequestedFields";

export class UserLoader {
    static batchUsers(user: UserModel, params: DataLoaderParam<number>[], requestedFields: RequestedFields): Promise<UserInstance[]> {
        let ids: number[] = params.map(param => param.key);
        return Promise.resolve(
            user.findAll({
                where: { id: { $in: ids } },
                attributes: requestedFields.getFields(params[0].info, {keep: ['id'], exclude: ['posts']})
            })
        );
    }
}