import { gql } from "apollo-server";

export const typeDefs = gql`
    type User {
        _id: ID!
        email: String!
        products: [Product]!
    }
    type Product {
        _id: ID!
        name: String!
        price: Float!
        stock: Int!
    }

    type Query {
        me: User
        products(page: Int, size: Int): [Product]!
        product(id: ID!): Product
    }

    type Mutation {
        register(email: String!, password: String!): String!
        login(email: String!, password: String!): String!
        addProduct(name: String!, price: Float!, stock: Int!): Product!
        buyProduct(productId: ID!): User!
        deleteProduct(productId: ID!): Product!
        updateProduct(productId: ID!, name: String, price: Float, stock: Int): Product!
    }
`;