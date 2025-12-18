import { IResolvers } from "@graphql-tools/utils";
import { createUser, validateUser } from "../collections/users";
import { signToken } from "../auth";
import { getDB } from "../db/mongo";
import { ObjectId } from "mongodb";
import { createPokemon, catchPokemon, getPokemons, getPokemonById, freePokemon } from "../collections/pokemons";
import { PokemonsUser } from "../types";
import { COLLECTION_OWNEDPOKEMONS, COLLECTION_POKEMONS } from "../utils";

export const resolvers: IResolvers = {
    Query: {
        pokemons: async (_, { page, size }) => {
            return await getPokemons(page, size);
        },
        pokemon: async (_, { id }) => {
            return await getPokemonById(id);
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
        createPokemon: async (_, { name, description, height, weight, types }) =>{
            return await createPokemon(name, description, height, weight, types);
        },
        catchPokemon: async (_, { pokemonId, nickname }, { user }) => {
            if(!user) throw new Error("Has de estar loggeado para capturar un pokémon.");
            return await catchPokemon(pokemonId, nickname, user._id.toString());
        },
        freePokemon: async (_, {ownedPokemonId}, { user }) => {
            if (!user) throw new Error("Has de estar loggead para liberar im pokémon.");
            return await freePokemon(ownedPokemonId, user._id.toString());
        },
        startJourney: async (_, { name, password }) => {
            const userId = await createUser(name, password);
            return signToken(userId);
        },
        login: async (_, { name, password }) => {
            const user = await validateUser(name, password);
            if(!user) throw new Error("Credenciales inválidas");
            return signToken(user._id.toString());
        }
    },
    Trainer: {
        pokemons: async (parent: PokemonsUser) => {
            const db = getDB();
            const listaDeIdsPokemons = parent.pokemons;
            if(!listaDeIdsPokemons) return [];
            const pokemonId = listaDeIdsPokemons.map((id) => new ObjectId(id));
            return db
                .collection(COLLECTION_OWNEDPOKEMONS)
                .find({_id: { $in: pokemonId}})
                .toArray()
        }
    }
};