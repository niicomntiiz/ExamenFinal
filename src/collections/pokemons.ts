import { ObjectId } from "mongodb";
import { getDB } from "../db/mongo"
import { COLLECTION_POKEMONS, COLLECTION_USERS, COLLECTION_OWNEDPOKEMONS } from "../utils";
import { ProvidedRequiredArguments } from "graphql/validation/rules/ProvidedRequiredArguments";
import { randomInt } from "crypto";


export const getPokemons = async (page?: number, size?: number) => {
    const db = getDB();
    page = page || 1;
    size = size || 10;
    return await db.collection(COLLECTION_POKEMONS).find().skip((page-1)*size).limit(size).toArray();
};

export const getPokemonById = async (id: string) => {
    const db = getDB();
    return await db.collection(COLLECTION_POKEMONS).findOne({_id: new ObjectId(id)});
};

export const createPokemon = async (name: string, description: string, height: number, weight: number, types: string) => {
    const db = getDB();
    const result = await db.collection(COLLECTION_POKEMONS).insertOne({
        name,
        description,
        height,
        weight,
        types
    });
    const newPokemon = await getPokemonById(result.insertedId.toString());
    return newPokemon;
};

export const catchPokemon = async (pokemonId: string, nickname: string, userId: string) => {
    const db = getDB();
    const localUserId = new ObjectId(userId);
    const localPokemonId = new ObjectId(pokemonId);
    const pokemonCapturar = await db.collection(COLLECTION_POKEMONS).findOne({_id: localPokemonId});

    const newOwnedPokemon = await db.collection(COLLECTION_OWNEDPOKEMONS).insertOne({
        pokemonId,
        nickname,
        attack: randomInt(100),
        defense: randomInt(100),
        speed: randomInt(100),
        special: randomInt(100),
        level: randomInt(100)
    })

    const pokemonAInsertar = await db.collection(COLLECTION_OWNEDPOKEMONS).findOne(newOwnedPokemon.insertedId);

    if(pokemonCapturar){
        await db.collection(COLLECTION_USERS).updateOne(
            {_id: localUserId},
            {
                $addToSet: {pokemons: newOwnedPokemon}
            }
        );
        
        const updateUser = await db.collection(COLLECTION_USERS).findOne({_id: localUserId});
        return pokemonAInsertar;
    } else {
        throw new Error("El Pokémon no se ha podido capturar.")
    }
};

export const freePokemon = async (ownedPokemonId: string, userId: string) => {
    const db = getDB();
    const localUserId = new ObjectId(userId);

    const user = await db.collection(COLLECTION_USERS).findOne({
        _id: localUserId,
        pokemons: ownedPokemonId
    });

    if(!user) throw new Error("El entrenador no ha capturado este pokémon o no existe.");

    await db.collection(COLLECTION_USERS).findOneAndUpdate(
        {_id: localUserId},
        {$pull: {pokemons: ownedPokemonId}} as any
    );

    return await db.collection(COLLECTION_USERS).findOne({_id: localUserId});
}