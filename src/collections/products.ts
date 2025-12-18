import { ObjectId } from "mongodb";
import { getDB } from "../db/mongo"
import { COLLECTION_PRODUCTS, COLLECTION_USERS } from "../utils";
import { ProvidedRequiredArguments } from "graphql/validation/rules/ProvidedRequiredArguments";


export const getProducts = async (page?: number, size?: number) => {
    const db = getDB();
    page = page || 1;
    size = size || 10;
    return await db.collection(COLLECTION_PRODUCTS).find().skip((page-1)*size).limit(size).toArray();
};

export const getProductsById = async (id: string) => {
    const db = getDB();
    return await db.collection(COLLECTION_PRODUCTS).findOne({_id: new ObjectId(id)});
};

export const addProduct = async (name: string, price: number, stock: number) => {
    const db = getDB();
    const result = await db.collection(COLLECTION_PRODUCTS).insertOne({
        name,
        price,
        stock
    });
    const newProduct = await getProductsById(result.insertedId.toString());
    return newProduct;
};

export const buyProduct = async (productId: string, userId: string) => {
    const db = getDB();
    const localUserId = new ObjectId(userId);
    const localProductId = new ObjectId(productId);
    const productToAdd = await db.collection(COLLECTION_PRODUCTS).findOne({_id: localProductId});

    if(productToAdd && (productToAdd.stock > 0 || productToAdd.stock === undefined)){
        await db.collection(COLLECTION_PRODUCTS).updateOne(
            {_id: localProductId},
            {$inc: {stock: -1}}
        );

        await db.collection(COLLECTION_USERS).updateOne(
            {_id: localUserId},
            {
                $addToSet: {products: productId}
            }
        );

        const updateUser = await db.collection(COLLECTION_USERS).findOne({_id: localUserId});
        return updateUser;
    } else {
        throw new Error("Producto no encontrado o no tiene stock.")
    }
}

export const deleteProduct = async (productId: string) => {
    const db = getDB();

    const productoEliminar = await db.collection(COLLECTION_PRODUCTS).findOne({_id: new ObjectId(productId)});
    if(!productoEliminar) throw new Error("Producto a eliminar no existe");

    await db.collection(COLLECTION_PRODUCTS).deleteOne({_id: new ObjectId(productId)});
    return productoEliminar;
}

export const updateProduct = async (productId: string, name?: string, price?: number, stock?: number) => {
    const db = getDB();
    const objectId = new ObjectId(productId);

    const updateFields: any = {};
    if(name) updateFields.name = name;
    if(price) updateFields.price = price;
    if(stock !== undefined) updateFields.stock = stock;

    const existe = await db.collection(COLLECTION_PRODUCTS).findOne({_id: objectId});
    console.log("¿El producto existe en la BD?:", existe ? "SÍ" : "NO");

    const resultado = await db.collection(COLLECTION_PRODUCTS).findOneAndUpdate(
        {_id: objectId},
        {$set: updateFields},
        {returnDocument: "after"}
    );

    if(!resultado) throw new Error("El producto no existe");
    return resultado;
}