import { GraphQLFieldResolver } from "graphql";

import { ComposableResolver } from "./composable.resolver";
import { ResolverContext } from "../../interfaces/ResolverContextInterface";
import { VerifyTokenResover } from "./verify-token.resolver";

export const AuthResover: ComposableResolver<any, ResolverContext> = 
    (resolver: GraphQLFieldResolver<any, ResolverContext>): GraphQLFieldResolver<any, ResolverContext> => {
        return (parent, args, context: ResolverContext, info) => {
            if(context.authUser || context.authorization) {
                return resolver(parent, args, context, info);
            }

            throw new Error('Unauthorized! Token não fornecido!');
        }
    }

export const AuthResovers = [AuthResover, VerifyTokenResover];