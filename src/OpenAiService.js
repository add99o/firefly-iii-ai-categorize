import OpenAI from "openai";
import {getConfigVariable} from "./util.js";

export default class OpenAiService {
    #openAi;
    #model = "gpt-5-nano";

    constructor() {
        const apiKey = getConfigVariable("OPENAI_API_KEY")

        this.#openAi = new OpenAI({
            apiKey
        });
    }

    async classify(categories, destinationName, description) {
        try {
            const prompt = this.#generatePrompt(categories, destinationName, description);

            const response = await this.#openAi.responses.create({
                model: this.#model,
                input: prompt
            });

            let guess = response.output_text;
            guess = guess.replace("\n", "");
            guess = guess.trim();

            if (categories.indexOf(guess) === -1) {
                console.warn(`OpenAI could not classify the transaction. 
                Prompt: ${prompt}
                OpenAIs guess: ${guess}`)
                return null;
            }

            return {
                prompt,
                response: response.output_text,
                category: guess
            };

        } catch (error) {
            if (error.response) {
                console.error(error.response.status);
                console.error(error.response.data);
                throw new OpenAiException(error.status, error.response, error.response.data);
            } else {
                console.error(error.message);
                throw new OpenAiException(null, null, error.message);
            }
        }
    }

    #generatePrompt(categories, destinationName, description) {
        return `Given i want to categorize transactions on my bank account into this categories: ${categories.join(", ")}
In which category would a transaction from "${destinationName}" with the subject "${description}" fall into?
Just output the name of the category. Does not have to be a complete sentence.`;
    }
}

class OpenAiException extends Error {
    code;
    response;
    body;

    constructor(statusCode, response, body) {
        super(`Error while communicating with OpenAI: ${statusCode} - ${body}`);

        this.code = statusCode;
        this.response = response;
        this.body = body;
    }
}