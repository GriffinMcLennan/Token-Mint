import { Keypair } from "@solana/web3.js";

const generatePrefixKey = (prefix: string) => {
    // prefix technically needs to only contain characters that are available in base58 encoding.
    // this can be dealt with later

    let keypair = Keypair.generate();

    while (!keypair.publicKey.toBase58().startsWith(prefix)) {
        keypair = Keypair.generate();
        console.log(keypair.publicKey.toBase58());
    }

    return keypair;
};

export default generatePrefixKey;
