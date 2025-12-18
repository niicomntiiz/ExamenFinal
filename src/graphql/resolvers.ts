import { IResolvers } from "@graphql-tools/utils";
import { createUser, validateUser } from "../collections/users";
import { signToken } from "../auth";
import { getDB } from "../db/mongo";
import { ObjectId } from "mongodb";
import { addProduct, buyProduct, deleteProduct, getProducts, getProductsById, updateProduct } from "../collections/products";
import { ProductsUser } from "../types";
import { COLLECTION_PRODUCTS } from "../utils";

export const resolvers: IResolvers = {
    Query: {
        products: async (_, { page, size }) => {
            return await getProducts(page, size);
        },
        product: async (_, { id }) => {
            return await getProductsById(id);
        },
        me: async (_, __, { user }) => {
            if(!user) return null;
            return {
                _id: user._id.toString(),
                ...user
            }
        }
    },
    Mutation: {
        addProduct: async (_, { name, price, stock}) =>{
            return await addProduct(name, price, stock);
        },
        buyProduct: async (_, { productId }, { user }) => {
            if(!user) throw new Error("Has de estar loggeado para comprar un producto.");
            return await buyProduct(productId, user._id.toString());
        },
        deleteProduct: async (_, {productId}) => {
            return await deleteProduct(productId);
        },
        updateProduct: async (_, { productId, name, price, stock}) => {
            return await updateProduct(productId, name, price, stock);
        },
        register: async (_, { email, username, password }) => {
            const userId = await createUser(email, username, password);
            return signToken(userId);
        },
        login: async (_, { email, username, password }) => {
            const user = await validateUser(email, username, password);
            if(!user) throw new Error("Invalid credentials");
            return signToken(user._id.toString());
        }
    },
    User: {
        products: async (parent: ProductsUser) => {
            const db = getDB();
            const listaDeIdsProductos = parent.products;
            if(!listaDeIdsProductos) return [];
            const objectIds = listaDeIdsProductos.map((id) => new ObjectId(id));
            return db
                .collection(COLLECTION_PRODUCTS)
                .find({_id: { $in: objectIds}})
                .toArray()
        }
    }
};